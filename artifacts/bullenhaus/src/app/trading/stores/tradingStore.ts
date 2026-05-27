import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export type PositionType = 'Long' | 'Short';
export type OrderType = 'Market' | 'Limit' | 'Stop';
export type MarginType = 'Cross' | 'Isolated';

export interface Position {
  id: string;
  symbol: string;
  type: PositionType;
  entryPrice: number;
  size: number; // in base currency or quote? Let's say base crypto.
  leverage: number;
  marginType: MarginType;
  margin: number;
  liquidationPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  unrealizedPnL: number;
  status: 'open' | 'closed';
}

export interface Order {
  id: string;
  symbol: string;
  type: OrderType;
  positionType: PositionType;
  price: number; // target price for limit/stop
  size: number;
  leverage: number;
  marginType: MarginType;
  stopLoss: number | null;
  takeProfit: number | null;
  status: 'pending' | 'filled' | 'canceled';
}

export interface Wallet {
  balance: number; // in USD
  realizedPnL: number;
  marginUsed: number;
}

interface TradingState {
  wallet: Wallet;
  positions: Position[];
  orders: Order[];
  prices: Record<string, number>;
  priceChanges: Record<string, number>;
  priceOverrides: Record<string, number>;

  // Actions
  fetchPositionsAndOrders: () => Promise<void>;
  initPriceOverrideSync: () => Promise<void>;
  setPositions: (positions: Position[]) => void;
  setOrders: (orders: Order[]) => void;
  setPriceOverride: (symbol: string, price: number | null) => void;
  setWallet: (wallet: Partial<Wallet>) => void;
  updatePrice: (symbol: string, price: number, change24h: number) => void;
  openPosition: (pos: Omit<Position, 'id' | 'unrealizedPnL' | 'status'>) => boolean;
  closePosition: (id: string, closePrice: number) => void;
  updatePositionPnL: (symbol: string, currentPrice: number) => void;
  placeOrder: (order: Omit<Order, 'id' | 'status'>) => boolean;
  cancelOrder: (id: string) => void;
  checkOrders: () => void; // checks limit/stop orders against current prices
  addBalance: (amount: number) => void;
  setWalletBalance: (amount: number) => void;
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      wallet: {
        balance: 0, // starting balance
        realizedPnL: 0,
        marginUsed: 0,
      },
      positions: [],
      orders: [],
      prices: {},
      priceChanges: {},
      priceOverrides: {},

      initPriceOverrideSync: async () => {
        // Fetch all existing admin price overrides and apply them locally
        try {
          const { data } = await supabase.from('price_overrides').select('symbol, price');
          if (data && data.length > 0) {
            const overrides: Record<string, number> = {};
            data.forEach((row: { symbol: string; price: number }) => {
              overrides[row.symbol] = Number(row.price);
            });
            set({ priceOverrides: overrides });
          }
        } catch {
          // table may not exist yet — silently skip
        }

        // Subscribe to realtime changes on price_overrides
        supabase
          .channel('price-overrides-sync')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'price_overrides' }, (payload) => {
            const row = payload.new as { symbol: string; price: number };
            get().setPriceOverride(row.symbol, Number(row.price));
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'price_overrides' }, (payload) => {
            const row = payload.new as { symbol: string; price: number };
            get().setPriceOverride(row.symbol, Number(row.price));
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'price_overrides' }, (payload) => {
            const row = payload.old as { symbol: string };
            get().setPriceOverride(row.symbol, null);
          })
          .subscribe();
      },

      fetchPositionsAndOrders: async () => {
        try {
          const session = (await supabase.auth.getSession()).data.session;
          if (!session?.user?.id) return;
          
          const [posRes, ordRes] = await Promise.all([
            supabase
              .from('positions')
              .select('*')
              .eq('user_id', session.user.id),
            supabase
              .from('orders')
              .select('*')
              .eq('user_id', session.user.id)
          ]);

          if (posRes.data) {
            const positions = posRes.data.map(p => ({
              id: p.id,
              symbol: p.symbol,
              type: p.type as PositionType,
              entryPrice: Number(p.entry_price),
              size: Number(p.size),
              leverage: Number(p.leverage),
              marginType: p.margin_type as MarginType,
              margin: Number(p.margin),
              liquidationPrice: Number(p.liquidation_price),
              stopLoss: p.stop_loss ? Number(p.stop_loss) : null,
              takeProfit: p.take_profit ? Number(p.take_profit) : null,
              unrealizedPnL: Number(p.unrealized_pnl),
              status: p.status as 'open' | 'closed',
            }));
            set({ positions });
          }

          if (ordRes.data) {
            const orders = ordRes.data.map(o => ({
              id: o.id,
              symbol: o.symbol,
              type: o.type as OrderType,
              positionType: o.position_type as PositionType,
              price: Number(o.price),
              size: Number(o.size),
              leverage: Number(o.leverage),
              marginType: o.margin_type as MarginType,
              stopLoss: o.stop_loss ? Number(o.stop_loss) : null,
              takeProfit: o.take_profit ? Number(o.take_profit) : null,
              status: o.status as 'pending' | 'filled' | 'canceled',
            }));
            set({ orders });
          }
        } catch (err) {
          console.error('Failed to load positions/orders:', err);
        }
      },

      setPositions: (positions) => set({ positions }),
      setOrders: (orders) => set({ orders }),

      setWallet: (wallet) => {
        set((state) => ({
          wallet: {
            ...state.wallet,
            ...wallet,
          },
        }));
      },

      setPriceOverride: (symbol, price) => {
        set((state) => {
          const overrides = { ...state.priceOverrides };
          if (price === null) {
            delete overrides[symbol];
          } else {
            overrides[symbol] = price;
          }
          return { priceOverrides: overrides };
        });
      },

      updatePrice: (symbol, price, change) => {
        set((state) => {
          const actualPrice = state.priceOverrides[symbol] !== undefined ? state.priceOverrides[symbol] : price;
          const newPrices = { ...state.prices, [symbol]: actualPrice };
          const newChanges = { ...state.priceChanges, [symbol]: change };
          
          return { prices: newPrices, priceChanges: newChanges };
        });
        // Triggers side effects like PnL update or liqudation checks
        const finalPrice = get().prices[symbol];
        get().updatePositionPnL(symbol, finalPrice);
        get().checkOrders();
      },

      openPosition: (posData) => {
        const state = get();
        if (state.wallet.balance - state.wallet.marginUsed < posData.margin) {
          return false;
        }

        const newId = crypto.randomUUID();

        set((state) => {
          const newPos: Position = {
            ...posData,
            id: newId,
            unrealizedPnL: 0,
            status: 'open',
          };
          
          return {
            positions: [...state.positions, newPos],
            wallet: {
              ...state.wallet,
              marginUsed: state.wallet.marginUsed + posData.margin,
            }
          };
        });

        // Background database sync
        (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Insert position record
            await supabase.from('positions').insert({
              id: newId,
              user_id: user.id,
              symbol: posData.symbol,
              type: posData.type,
              entry_price: posData.entryPrice,
              size: posData.size,
              leverage: posData.leverage,
              margin_type: posData.marginType,
              margin: posData.margin,
              liquidation_price: posData.liquidationPrice,
              stop_loss: posData.stopLoss,
              take_profit: posData.takeProfit,
              status: 'open',
            });

            // 2. Log trade transaction
            await supabase.from('transactions').insert({
              user_id: user.id,
              user_email: user.email,
              user_name: user.user_metadata?.full_name || user.email,
              type: 'Trade',
              amount: posData.margin,
              currency: 'USD',
              method: 'Other',
              status: 'Completed',
              instructions: `Opened ${posData.type} position: ${posData.size} ${posData.symbol} at $${posData.entryPrice.toLocaleString()}`,
            });

            // 3. Update balance and margin in user profile
            const currentWallet = get().wallet;
            await supabase.from('users').update({
              balance: currentWallet.balance,
              margin_used: currentWallet.marginUsed,
            }).eq('id', user.id);
          } catch (err) {
            console.error('[openPosition] Failed to persist to Supabase:', err);
          }
        })();

        return true;
      },

      closePosition: (id, closePrice) => {
        const pos = get().positions.find(p => p.id === id);
        if (!pos || pos.status === 'closed') return;

        const pnl = pos.type === 'Long' 
          ? (closePrice - pos.entryPrice) * pos.size
          : (pos.entryPrice - closePrice) * pos.size;

        set((state) => ({
          positions: state.positions.map(p => 
            p.id === id ? { ...p, status: 'closed', unrealizedPnL: pnl } : p
          ),
          wallet: {
            ...state.wallet,
            balance: Math.max(0, state.wallet.balance + pnl),
            realizedPnL: state.wallet.realizedPnL + pnl,
            marginUsed: state.wallet.marginUsed - pos.margin,
          }
        }));

        // Background database sync
        (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Update position status to closed
            await supabase.from('positions').update({
              status: 'closed',
              unrealized_pnl: pnl,
            }).eq('id', id);

            // 2. Log close trade transaction
            await supabase.from('transactions').insert({
              user_id: user.id,
              user_email: user.email,
              user_name: user.user_metadata?.full_name || user.email,
              type: 'Trade',
              amount: Math.max(0.01, Math.abs(pnl)),
              currency: 'USD',
              method: 'Other',
              status: 'Completed',
              instructions: `Closed ${pos.type} position on ${pos.symbol} at $${closePrice.toLocaleString()}. P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString()}`,
            });

            // 3. Update user balance
            const currentWallet = get().wallet;
            await supabase.from('users').update({
              balance: currentWallet.balance,
              margin_used: currentWallet.marginUsed,
              realized_pnl: currentWallet.realizedPnL,
            }).eq('id', user.id);
          } catch (err) {
            console.error('[closePosition] Failed to persist to Supabase:', err);
          }
        })();
      },

      updatePositionPnL: (symbol, currentPrice) => {
        const closedJobs: { pos: Position; pnl: number; reason: string }[] = [];

        set((state) => {
          let marginFreed = 0;
          let balanceChange = 0;
          let realizedPnLChange = 0;

          const updatedPositions = state.positions.map(pos => {
            if (pos.symbol !== symbol || pos.status !== 'open') return pos;

            const pnl = pos.type === 'Long' 
              ? (currentPrice - pos.entryPrice) * pos.size
              : (pos.entryPrice - currentPrice) * pos.size;

            let isLiquidated = false;
            let reason = 'Liquidation';

            // Liquidation check
            if (pos.type === 'Long' && currentPrice <= pos.liquidationPrice) isLiquidated = true;
            if (pos.type === 'Short' && currentPrice >= pos.liquidationPrice) isLiquidated = true;

            // SL / TP check
            if (pos.stopLoss && pos.type === 'Long' && currentPrice <= pos.stopLoss) {
              isLiquidated = true;
              reason = 'Stop Loss';
            }
            if (pos.stopLoss && pos.type === 'Short' && currentPrice >= pos.stopLoss) {
              isLiquidated = true;
              reason = 'Stop Loss';
            }
            if (pos.takeProfit && pos.type === 'Long' && currentPrice >= pos.takeProfit) {
              isLiquidated = true;
              reason = 'Take Profit';
            }
            if (pos.takeProfit && pos.type === 'Short' && currentPrice <= pos.takeProfit) {
              isLiquidated = true;
              reason = 'Take Profit';
            }

            if (isLiquidated) {
               marginFreed += pos.margin;
               balanceChange += pnl;
               realizedPnLChange += pnl;
               
               const closedPos = { ...pos, unrealizedPnL: pnl, status: 'closed' as const };
               closedJobs.push({ pos: closedPos, pnl, reason });
               return closedPos;
            }

            return { ...pos, unrealizedPnL: pnl };
          });

          if (marginFreed > 0 || balanceChange !== 0) {
            return {
              positions: updatedPositions,
              wallet: {
                ...state.wallet,
                balance: Math.max(0, state.wallet.balance + balanceChange),
                realizedPnL: state.wallet.realizedPnL + realizedPnLChange,
                marginUsed: state.wallet.marginUsed - marginFreed,
              }
            }
          }

          return { positions: updatedPositions };
        });

        // Trigger background db updates for each closed position (SL/TP/Liq)
        if (closedJobs.length > 0) {
          (async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              for (const job of closedJobs) {
                // 1. Update position status to closed
                await supabase.from('positions').update({
                  status: 'closed',
                  unrealized_pnl: job.pnl,
                }).eq('id', job.pos.id);

                // 2. Log close trade transaction
                await supabase.from('transactions').insert({
                  user_id: user.id,
                  user_email: user.email,
                  user_name: user.user_metadata?.full_name || user.email,
                  type: 'Trade',
                  amount: Math.max(0.01, Math.abs(job.pnl)),
                  currency: 'USD',
                  method: 'Other',
                  status: 'Completed',
                  instructions: `Closed ${job.pos.type} position on ${job.pos.symbol} at $${currentPrice.toLocaleString()} via ${job.reason}. P&L: ${job.pnl >= 0 ? '+' : ''}$${job.pnl.toLocaleString()}`,
                });
              }

              // 3. Update user balance
              const currentWallet = get().wallet;
              await supabase.from('users').update({
                balance: currentWallet.balance,
                margin_used: currentWallet.marginUsed,
                realized_pnl: currentWallet.realizedPnL,
              }).eq('id', user.id);
            } catch (err) {
              console.error('[updatePositionPnL] Failed to persist closed positions to Supabase:', err);
            }
          })();
        }
      },

      placeOrder: (orderData) => {
        const state = get();
        const currentPrice = state.prices[orderData.symbol] || orderData.price;
        const marginRequired = (orderData.size * currentPrice) / orderData.leverage;
        if (state.wallet.balance - state.wallet.marginUsed < marginRequired) {
          return false;
        }

        const newId = crypto.randomUUID();

        set((state) => ({
          orders: [...state.orders, { ...orderData, id: newId, status: 'pending' }],
          wallet: {
            ...state.wallet,
            marginUsed: state.wallet.marginUsed + marginRequired,
          },
        }));

        // Background database sync
        (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('orders').insert({
              id: newId,
              user_id: user.id,
              symbol: orderData.symbol,
              type: orderData.type,
              position_type: orderData.positionType,
              price: orderData.price,
              size: orderData.size,
              leverage: orderData.leverage,
              margin_type: orderData.marginType,
              stop_loss: orderData.stopLoss,
              take_profit: orderData.takeProfit,
              status: 'pending',
            });
          } catch (err) {
            console.error('[placeOrder] Failed to persist to Supabase:', err);
          }
        })();

        return true;
      },

      cancelOrder: (id) => {
        const order = get().orders.find(o => o.id === id);
        const marginToReturn = (order && order.status === 'pending')
          ? (order.size * order.price) / order.leverage
          : 0;
        set((state) => ({
          orders: state.orders.map(o => o.id === id ? { ...o, status: 'canceled' } : o),
          ...(marginToReturn > 0 ? {
            wallet: {
              ...state.wallet,
              marginUsed: Math.max(0, state.wallet.marginUsed - marginToReturn),
            },
          } : {}),
        }));

        // Background database sync
        (async () => {
          try {
            await supabase.from('orders').update({
              status: 'canceled',
            }).eq('id', id);
          } catch (err) {
            console.error('[cancelOrder] Failed to update cancel status in Supabase:', err);
          }
        })();
      },

      checkOrders: () => {
        const filledJobs: { order: Order; newPos: Position }[] = [];

        set((state) => {
          let ordersChanged = false;
          let positionsChanged = false;
          const newOrders = [...state.orders];
          const newPositions = [...state.positions];
          let newMarginUsed = state.wallet.marginUsed;

          for (let i = 0; i < newOrders.length; i++) {
            const order = newOrders[i];
            if (order.status !== 'pending') continue;

            const currentPrice = state.prices[order.symbol];
            if (!currentPrice) continue;

            let shouldExecute = false;
            if (order.type === 'Limit') {
              if (order.positionType === 'Long' && currentPrice <= order.price) shouldExecute = true;
              if (order.positionType === 'Short' && currentPrice >= order.price) shouldExecute = true;
            } else if (order.type === 'Stop') {
              if (order.positionType === 'Long' && currentPrice >= order.price) shouldExecute = true;
              if (order.positionType === 'Short' && currentPrice <= order.price) shouldExecute = true;
            }

            if (shouldExecute) {
              const marginRequired = (order.size * currentPrice) / order.leverage;
              if (state.wallet.balance - newMarginUsed >= marginRequired) {
                 order.status = 'filled';
                 ordersChanged = true;
                 positionsChanged = true;
                 // margin was already reserved in placeOrder — no need to add again

                 // Calculate liquidation price simplified
                 const isLong = order.positionType === 'Long';
                 const liqPrice = isLong 
                   ? order.price * (1 - 1/order.leverage + 0.005) // maintenance margin simplified
                   : order.price * (1 + 1/order.leverage - 0.005);

                 const localPosId = crypto.randomUUID();
                 const newPos: Position = {
                   id: localPosId,
                   symbol: order.symbol,
                   type: order.positionType,
                   entryPrice: order.price, // executed at order price for logic
                   size: order.size,
                   leverage: order.leverage,
                   marginType: order.marginType,
                   margin: marginRequired,
                   liquidationPrice: liqPrice,
                   stopLoss: order.stopLoss,
                   takeProfit: order.takeProfit,
                   unrealizedPnL: 0,
                   status: 'open'
                 };

                 newPositions.push(newPos);
                 filledJobs.push({ order, newPos });
              }
            }
          }

          if (ordersChanged || positionsChanged) {
            return {
              orders: newOrders,
              positions: newPositions,
              wallet: { ...state.wallet, marginUsed: newMarginUsed }
            };
          }
          return state;
        });

        // Notify user for each filled order
        filledJobs.forEach(job => {
          toast.success(
            `✅ ${job.order.type} order filled: ${job.order.positionType} ${job.order.symbol} at $${job.order.price.toLocaleString()}`,
            { duration: 6000 }
          );
        });

        // Trigger background db updates for each filled order
        if (filledJobs.length > 0) {
          (async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              for (const job of filledJobs) {
                // 1. Update order status to filled
                await supabase.from('orders').update({
                  status: 'filled',
                }).eq('id', job.order.id);

                // 2. Insert position record
                await supabase.from('positions').insert({
                  id: job.newPos.id,
                  user_id: user.id,
                  symbol: job.newPos.symbol,
                  type: job.newPos.type,
                  entry_price: job.newPos.entryPrice,
                  size: job.newPos.size,
                  leverage: job.newPos.leverage,
                  margin_type: job.newPos.marginType,
                  margin: job.newPos.margin,
                  liquidation_price: job.newPos.liquidationPrice,
                  stop_loss: job.newPos.stopLoss,
                  take_profit: job.newPos.takeProfit,
                  status: 'open',
                });

                // 3. Log filled trade transaction
                await supabase.from('transactions').insert({
                  user_id: user.id,
                  user_email: user.email,
                  user_name: user.user_metadata?.full_name || user.email,
                  type: 'Trade',
                  amount: job.newPos.margin,
                  currency: 'USD',
                  method: 'Other',
                  status: 'Completed',
                  instructions: `Order Filled - Opened ${job.newPos.type} position: ${job.newPos.size} ${job.newPos.symbol} at $${job.newPos.entryPrice.toLocaleString()}`,
                });
              }

              // 4. Update balance and margin in user profile
              const currentWallet = get().wallet;
              await supabase.from('users').update({
                balance: currentWallet.balance,
                margin_used: currentWallet.marginUsed,
              }).eq('id', user.id);
            } catch (err) {
              console.error('[checkOrders] Failed to synchronize filled orders with Supabase:', err);
            }
          })();
        }
      },

      addBalance: (amount) => {
        set((state) => ({
          wallet: {
            ...state.wallet,
            balance: state.wallet.balance + amount
          }
        }));
      },
      
      setWalletBalance: (amount) => {
        set((state) => ({
          wallet: {
            ...state.wallet,
            balance: amount
          }
        }));
      }
    }),
    {
      name: 'bullenhaus-trading-store',
      partialize: (state) => ({
        positions: state.positions,
        orders: state.orders,
      }),
    }
  )
);
