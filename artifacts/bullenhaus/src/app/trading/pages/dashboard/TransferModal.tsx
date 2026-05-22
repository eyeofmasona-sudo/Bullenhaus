import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Upload, ArrowRight, CheckCircle2, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTradingStore } from '../../stores/tradingStore';
import { useTransactionStore, TxMethod, TX_METHODS } from '../../stores/transactionStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const TransferModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  type: 'deposit' | 'withdraw';
}> = ({ isOpen, onClose, type }) => {
  const { t } = useTranslation('common');
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<TxMethod>('Credit Card');
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [serverRequestId, setServerRequestId] = useState<string | null>(null);
  const [serverRequest, setServerRequest] = useState<any>(null);
  const [serverInstructions, setServerInstructions] = useState('');
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const { wallet } = useTradingStore();
  const { addRequest, requests } = useTransactionStore();
  const [user, setUser] = useState<any>(null);
  const { kycStatus } = useAuth();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const isDeposit = type === 'deposit';

  const activeRequest = requestId ? requests.find(r => r.id === requestId) : null;
  const displayRequest = serverRequest || activeRequest;
  const displayInstructions = serverRequest?.instructions || activeRequest?.instructions || serverInstructions;

  // Poll Supabase for status/instructions updates on the submitted transaction
  useEffect(() => {
    if (step !== 2 || !serverRequestId) return;
    const isFinal = serverStatus === 'Completed' || serverStatus === 'Rejected';
    if (isFinal) return;

    const pollRequest = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('status, instructions')
        .eq('id', serverRequestId)
        .single();
      if (!data) return;
      if (data.instructions) setServerInstructions(data.instructions);
      if (data.status) setServerStatus(data.status);
    };

    pollRequest();
    const interval = window.setInterval(pollRequest, 5000);
    return () => window.clearInterval(interval);
  }, [step, serverRequestId, serverStatus]);

  const handleAction = async () => {
    if (kycStatus !== 'VERIFIED') {
      toast.error('KYC Verification required');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Invalid amount');
      return;
    }
    if (!isDeposit && numAmount > wallet.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);

    const localReqId = addRequest({
      userId: user?.id || 'unknown',
      userEmail: user?.email || 'unknown',
      userName: user?.user_metadata?.name || 'User',
      type: isDeposit ? 'Deposit' : 'Withdrawal',
      amount: numAmount,
      currency: 'USD',
      method: method,
    });
    setRequestId(localReqId);

    if (user) {
      try {
        const { data: txRow, error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id:  user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email,
            type:     isDeposit ? 'Deposit' : 'Withdrawal',
            amount:   numAmount,
            currency: 'USD',
            method,
            status:   'Pending',
          })
          .select()
          .single();
        if (txError) throw new Error(txError.message);
        setServerRequestId(txRow?.id || null);
        setServerRequest(txRow || null);
        setServerStatus('Pending');
      } catch (err) {
        // Supabase table may not exist yet — proceed with local store only
        console.warn('[TransferModal] Could not persist to Supabase:', err);
      }
    }

    setLoading(false);
    setStep(2);
    toast.success(t('requestProcessing', { defaultValue: 'Your request is being processed.' }));
  };

  const handleClose = () => {
    if (step === 2 && activeRequest && !displayInstructions) {
      toast.error('Please wait for instructions from the admin.');
      return;
    }
    setStep(1);
    setAmount('');
    setRequestId(null);
    setServerRequestId(null);
    setServerRequest(null);
    setServerInstructions('');
    setServerStatus(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 ${isDeposit ? 'bg-accent-secondary shadow-neon-emerald' : 'bg-orange-500 shadow-neon-rose'}`} />

            {step === 1 ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isDeposit ? 'bg-accent-secondary/10 text-accent-secondary' : 'bg-orange-500/10 text-orange-500'}`}>
                      {isDeposit ? <Download size={20} /> : <Upload size={20} />}
                    </div>
                    <h3 className="text-lg font-bold text-text tracking-wide">
                      {isDeposit ? 'Deposit' : 'Withdrawal'}
                    </h3>
                  </div>
                  <button onClick={handleClose} className="p-2 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-white/5">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-text-dim font-bold block mb-2">Select Currency</label>
                    <div className="p-3 bg-black/40 border border-border rounded-xl flex items-center justify-between cursor-pointer hover:border-border-strong transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs">$</div>
                        <div>
                          <p className="text-sm font-bold text-text">USD</p>
                          <p className="text-[10px] text-text-dim">US Dollar</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-text-dim" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                       <label className="text-[10px] uppercase tracking-widest text-text-dim font-bold block">Amount</label>
                       {isDeposit ? (
                         <span className="text-[10px] font-bold text-text-dim">Add funds</span>
                       ) : (
                         <span className="text-[10px] font-bold text-text-dim">Available: <span className="text-text">{wallet.balance.toFixed(2)} USD</span></span>
                       )}
                    </div>
                    <div className="relative group">
                       <input
                         type="number"
                         placeholder="0.00"
                         value={amount}
                         onChange={(e) => setAmount(e.target.value)}
                         className="w-full p-4 bg-black/40 border border-border rounded-xl text-lg font-mono font-bold text-text focus:outline-none focus:border-accent-primary/50 transition-all pl-12"
                       />
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-text-dim font-bold">$</span>
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-dim group-focus-within:text-accent-primary transition-colors">USD</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-text-dim font-bold block mb-2">Transfer Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      {TX_METHODS.map(m => (
                        <button
                          key={m}
                          onClick={() => setMethod(m)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            method === m
                              ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                              : 'bg-black/40 border-border text-text-muted hover:bg-white/5 hover:border-border-strong'
                          }`}
                        >
                           {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {kycStatus !== 'VERIFIED' && (
                    <div className="flex items-center justify-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs text-center gap-2">
                      <Lock size={14} />
                      <span>KYC Verification required. <Link to="/trade/kyc" className="underline font-bold" onClick={onClose}>Verify Identity</Link></span>
                    </div>
                  )}

                  <button
                    onClick={handleAction}
                    disabled={!amount || Number(amount) <= 0 || loading || kycStatus !== 'VERIFIED'}
                    className={`w-full py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 ${
                      kycStatus !== 'VERIFIED'
                      ? 'bg-surface/50 text-text-muted'
                      : isDeposit
                      ? 'bg-accent-secondary text-black shadow-neon-emerald hover:brightness-110'
                      : 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:brightness-110'
                    }`}
                  >
                    {loading ? 'Processing...' : (isDeposit ? 'Submit Deposit' : 'Submit Withdrawal')}
                  </button>
                </div>
              </div>
            ) : step === 2 && displayRequest ? (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                {/* Request summary — visible to client at every state */}
                <div className="w-full bg-white/5 border border-border rounded-xl p-4 text-left text-xs space-y-2 mb-2">
                  <div className="flex justify-between"><span className="text-text-muted">Type</span><span className="font-bold text-text">{displayRequest.type}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Amount</span><span className="font-mono font-bold text-text">{displayRequest.amount.toLocaleString()} {displayRequest.currency}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Method</span><span className="font-bold text-text">{displayRequest.method || method}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Status</span><span className={`font-bold ${
                    serverStatus === 'Completed' ? 'text-success'
                    : serverStatus === 'Rejected' ? 'text-danger'
                    : 'text-warning'
                  }`}>{serverStatus || displayRequest.status}</span></div>
                </div>

                {displayInstructions ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className={`w-20 h-20 rounded-full flex items-center justify-center ${isDeposit ? 'bg-accent-secondary/20 text-accent-secondary' : 'bg-orange-500/20 text-orange-500'}`}
                    >
                      <CheckCircle2 size={40} />
                    </motion.div>
                    <div className="w-full">
                       <h3 className="text-xl font-bold text-text mb-2">Instructions Received</h3>
                       <p className="text-sm text-text-muted mb-6">Please follow the card, IBAN, payment link, or transfer instructions below:</p>
                       <div className="bg-white/5 border border-border p-4 rounded-xl text-left select-all text-sm font-mono text-text break-words mb-6 max-h-[200px] overflow-y-auto">
                         {displayInstructions}
                       </div>

                       <button
                          onClick={handleClose}
                          className={`w-full py-4 rounded-xl text-sm font-bold transition-all text-white ${
                            isDeposit
                            ? 'bg-accent-secondary text-black shadow-neon-emerald hover:brightness-110'
                            : 'bg-orange-500 text-black shadow-neon-rose hover:brightness-110'
                          }`}
                        >
                          Done
                       </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Loader2 size={40} className={`animate-spin ${isDeposit ? 'text-accent-secondary' : 'text-orange-500'}`} />
                    <div>
                       <h3 className="text-xl font-bold text-text mb-2">Waiting for Admin</h3>
                       <p className="text-sm text-text-muted">Please keep this window open while our operator prepares your transfer instructions...</p>
                       <p className="text-[11px] text-text-dim mt-2">This window checks for new instructions automatically.</p>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
