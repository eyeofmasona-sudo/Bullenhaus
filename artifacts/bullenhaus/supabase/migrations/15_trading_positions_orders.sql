-- ============================================================
-- Migration 15: Trading positions and orders persistence
--
-- The trading UI writes market positions to public.positions and
-- pending limit/stop orders to public.orders. These tables must exist
-- with RLS policies for authenticated clients to manage their own rows.
-- ============================================================

create table if not exists public.positions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  symbol             text not null,
  type               text not null check (type in ('Long', 'Short')),
  entry_price        numeric(18, 8) not null check (entry_price > 0),
  size               numeric(18, 8) not null check (size > 0),
  leverage           integer not null check (leverage > 0),
  margin_type        text not null default 'Cross' check (margin_type in ('Cross', 'Isolated')),
  margin             numeric(18, 2) not null check (margin >= 0),
  liquidation_price  numeric(18, 8) not null check (liquidation_price >= 0),
  stop_loss          numeric(18, 8),
  take_profit        numeric(18, 8),
  status             text not null default 'open' check (status in ('open', 'closed')),
  opened_at          timestamptz not null default now(),
  closed_at          timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  symbol         text not null,
  type           text not null check (type in ('Market', 'Limit', 'Stop')),
  position_type  text not null check (position_type in ('Long', 'Short')),
  price          numeric(18, 8) not null check (price > 0),
  size           numeric(18, 8) not null check (size > 0),
  leverage       integer not null check (leverage > 0),
  margin_type    text not null default 'Cross' check (margin_type in ('Cross', 'Isolated')),
  stop_loss      numeric(18, 8),
  take_profit    numeric(18, 8),
  status         text not null default 'pending' check (status in ('pending', 'filled', 'canceled')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists positions_user_status_idx on public.positions(user_id, status);
create index if not exists positions_symbol_idx on public.positions(symbol);
create index if not exists orders_user_status_idx on public.orders(user_id, status);
create index if not exists orders_symbol_idx on public.orders(symbol);

drop trigger if exists positions_set_updated_at on public.positions;
create trigger positions_set_updated_at
  before update on public.positions
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.positions enable row level security;
alter table public.orders enable row level security;

drop policy if exists "positions_select_own" on public.positions;
create policy "positions_select_own"
  on public.positions for select
  using (auth.uid() = user_id);

drop policy if exists "positions_select_staff" on public.positions;
create policy "positions_select_staff"
  on public.positions for select
  using (public.get_my_role() in ('admin', 'trade_admin', 'manager'));

drop policy if exists "positions_insert_own" on public.positions;
create policy "positions_insert_own"
  on public.positions for insert
  with check (auth.uid() = user_id);

drop policy if exists "positions_update_own" on public.positions;
create policy "positions_update_own"
  on public.positions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "positions_update_staff" on public.positions;
create policy "positions_update_staff"
  on public.positions for update
  using (public.get_my_role() in ('admin', 'trade_admin'));

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "orders_select_staff" on public.orders;
create policy "orders_select_staff"
  on public.orders for select
  using (public.get_my_role() in ('admin', 'trade_admin', 'manager'));

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders for insert
  with check (auth.uid() = user_id);

drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_own"
  on public.orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "orders_update_staff" on public.orders;
create policy "orders_update_staff"
  on public.orders for update
  using (public.get_my_role() in ('admin', 'trade_admin'));
