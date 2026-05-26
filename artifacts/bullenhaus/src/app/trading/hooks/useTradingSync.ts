import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTradingStore } from '../stores/tradingStore';
import type { Position, Order } from '../stores/tradingStore';

const mapDbPosition = (row: any): Position => ({
  id: row.id,
  symbol: row.symbol,
  type: row.type,
  entryPrice: row.entry_price,
  size: row.size,
  leverage: row.leverage,
  marginType: row.margin_type,
  margin: row.margin,
  liquidationPrice: row.liquidation_price,
  stopLoss: row.stop_loss,
  takeProfit: row.take_profit,
  unrealizedPnL: 0,
  status: row.status,
});

const mapDbOrder = (row: any): Order => ({
  id: row.id,
  symbol: row.symbol,
  type: row.type,
  positionType: row.position_type,
  price: row.price,
  size: row.size,
  leverage: row.leverage,
  marginType: row.margin_type,
  stopLoss: row.stop_loss,
  takeProfit: row.take_profit,
  status: row.status,
});

export const useTradingSync = () => {
  const setPositions = useTradingStore(s => s.setPositions);
  const setOrders = useTradingStore(s => s.setOrders);
  const setWallet = useTradingStore(s => s.setWallet);

  const sync = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    const uid = session.user.id;

    const [posRes, ordRes] = await Promise.all([
      supabase.from('positions').select('*').eq('user_id', uid).eq('status', 'open'),
      supabase.from('orders').select('*').eq('user_id', uid).eq('status', 'pending'),
    ]);

    if (posRes.data) {
      const positions = posRes.data.map(mapDbPosition);
      const marginUsed = positions.reduce((acc, p) => acc + p.margin, 0);
      setPositions(positions);
      setWallet({ marginUsed });
    }
    if (ordRes.data) {
      setOrders(ordRes.data.map(mapDbOrder));
    }
  }, [setPositions, setOrders, setWallet]);

  useEffect(() => {
    sync();
  }, [sync]);
};
