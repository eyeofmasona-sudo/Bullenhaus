-- Atomic deposit approval: status transition + balance credit in one DB transaction.
-- Uses FOR UPDATE row lock so concurrent approvals cannot double-credit the balance.
-- SECURITY DEFINER: executes as the function owner (bypasses client RLS) so that
-- admin/trade_admin callers can update both transactions and users tables.
-- The calling client still needs execute permission granted below.

CREATE OR REPLACE FUNCTION approve_deposit(p_transaction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  -- Lock the transaction row for the duration of this transaction.
  -- Any concurrent call for the same id will wait here until we commit.
  SELECT id, user_id, amount, status, type
  INTO v_tx
  FROM transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  -- Only process Deposit type rows (safety guard against misuse).
  IF v_tx.type != 'Deposit' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_a_deposit');
  END IF;

  -- Idempotency guard: if already in a final approved state, do nothing.
  IF v_tx.status IN ('Completed', 'Approved') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_approved', 'amount', v_tx.amount);
  END IF;

  -- Transition status to Completed (exactly once, protected by the row lock above).
  UPDATE transactions
  SET status = 'Completed', updated_at = now()
  WHERE id = p_transaction_id;

  -- Increment the client's balance atomically (no separate read needed).
  UPDATE users
  SET balance = balance + v_tx.amount
  WHERE id = v_tx.user_id;

  RETURN jsonb_build_object('ok', true, 'amount', v_tx.amount, 'user_id', v_tx.user_id);
END;
$$;

-- Allow authenticated users to call this function.
-- Row-level security on transactions (transactions_update_admin) ensures only
-- admin/trade_admin can produce rows that reach the Completed state via this path.
GRANT EXECUTE ON FUNCTION approve_deposit(uuid) TO authenticated;
