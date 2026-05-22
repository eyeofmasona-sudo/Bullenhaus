---
name: Bullenhaus CRM setup
description: Supabase project details, account roster, DB tables, and key decisions for the Bullenhaus trading/CRM platform
---

## Supabase project
- Project ref: `sgtmwdlycllbbavrqgzm`
- CLI at `/tmp/supabase` (v2.101.0); `db push --project-ref` is NOT supported — use `db push --linked` or push SQL via Management API: `POST https://api.supabase.com/v1/projects/<ref>/database/query`

## Supabase client in frontend
- The browser Supabase client lives at `src/lib/supabase/browserClient.ts` (exports `supabase` and `getSupabaseBrowserClient`)
- Import as: `import { supabase } from "../../../lib/supabase/browserClient"` (adjust relative depth)
- NOT `client.ts` — that file does not exist

## DB schema
- `public.users`: id, email, full_name, balance, realized_pnl, margin_used, kyc_status, `role` (not `unified_role`), created_at, updated_at
- `public.transactions`: id, user_id, type (DEPOSIT/WITHDRAWAL/TRADE), status (PENDING/COMPLETED/FAILED), amount, instructions, created_at, updated_at
- `public.leads`: id, name, first_name, last_name, email, phone, stage (NEW_INQUIRY/IN_DISCUSSION/PENDING_KYC/FUNDED), capacity, timezone, notes, acquisition_source (jsonb), assigned_agent_id, created_at, updated_at
- `public.clients`: id, full_name, email, phone, country, balance, kyc_status, assigned_agent_id, user_id, notes, created_at, updated_at
- RLS policies for leads/clients use `role` column (not `unified_role`) from `public.users`

**Why:** Migration 01 defined `unified_role` but migration 02 renamed it to `role`. All queries and RLS must use `role`.

## RLS note
- Migrations 02+ use `role` column (migration 01 used `unified_role` — already cleaned up). When writing new policies always use `role`.
- Always use `public.get_my_role()` (security definer) in RLS policies on `users`/`transactions` to avoid infinite recursion.
- CRM workers (agent/manager/director/admin) need two key policies to read client data:
  - `"CRM workers can view client profiles"` on `users` (filters by `role='client'`)
  - `"CRM workers can view all transactions"` on `transactions` (migration 06)

## Accounts & Role Matrix
| Email | Password | DB role | CRM | Trading Admin |
|---|---|---|---|---|
| `superadmin@bullenhaus.io` | `Bullenhaus2025` | admin | ✓ | ✓ |
| `trade.admin@bullenhaus.io` | `Bullenhaus2025` | trade_admin | ✗ blocked | ✓ |
| `orion.voss@aurelius-desk.crm` | (original) | admin | ✓ | ✗ |
- 2 directors, 2 managers, 10 agents all at `@aurelius-desk.crm`
- 3 clients (galstyan@rrr.com, armenia@arm.com, atlas.admin@bullenhaus.trade)
- All non-client accounts have `user_metadata.role` synced in auth.users

## Role separation: trade_admin vs admin
- `trade_admin` role added to CHECK constraint on `public.users`
- Trading platform (`AuthContext`, `AdminProtectedRoute`, `AdminLayout`, `Sidebar`, `Login`, `AuthLayout`) treats `trade_admin` same as `admin` — full access to `/admin/*`
- CRM `auth.ts` `mapRole()` throws "Нет доступа" for any role not in `['admin','director','manager','agent']` — blocks `trade_admin`

## Role sync
- `user_metadata.role` sync via: `PUT {SUPABASE_URL}/auth/v1/admin/users/{uid}` with `{"user_metadata": {"role": "<role>"}}`
- Run after creating any new CRM worker to ensure role is in JWT claims

## Pre-existing TS errors (do not fix)
- `useWalletSync.ts`, `ProtectedRoute.tsx` (components/layout), `chart.tsx` — known issues, not introduced by us
