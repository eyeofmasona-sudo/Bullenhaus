import { useEffect } from 'react';
import { useTradingStore } from '../stores/tradingStore';
import { useForexStore } from '../stores/forexStore';

// Major crypto pairs
const CRYPTO_PAIRS = [
  'btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'xrpusdt', 'adausdt', 'dogeusdt',
  'avaxusdt', 'dotusdt', 'linkusdt', 'ltcusdt', 'trxusdt', 'tonusdt', 'bchusdt',
  'shibusdt', 'pepeusdt', 'aptusdt', 'arbusdt', 'opusdt', 'suiusdt', 'nearusdt',
  'atomusdt', 'filusdt', 'icpusdt', 'uniusdt', 'etcusdt', 'injusdt', 'renderusdt',
  'seiusdt', 'fetusdt'
];

const BINANCE_REST_URLS = [
  'https://api.binance.com/api/v3/ticker/24hr',
  'https://data-api.binance.vision/api/v3/ticker/24hr',
];

async function fetchPricesREST(): Promise<{ symbol: string; price: number; change: number }[]> {
  const symbols = CRYPTO_PAIRS.map(p => `"${p.toUpperCase()}"`).join(',');
  const query = `symbols=[${symbols}]`;
  for (const base of BINANCE_REST_URLS) {
    try {
      const res = await fetch(`${base}?${query}`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const data: any[] = await res.json();
      return data.map(d => ({
        symbol: d.symbol,
        price: parseFloat(d.lastPrice),
        change: parseFloat(d.priceChangePercent),
      }));
    } catch { /* try next */ }
  }
  return [];
}

export const useMarketEngine = () => {
  const { updatePrice } = useTradingStore();
  const { tickSimulation } = useForexStore();

  // Binance WS with REST fallback when WS is unavailable
  useEffect(() => {
    let ws: WebSocket | null = null;
    let wsAlive = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let destroyed = false;

    const stopRESTFallback = () => {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    };

    const startRESTFallback = () => {
      if (pollTimer) return;
      // Fetch immediately
      fetchPricesREST().then(prices => {
        if (destroyed) return;
        prices.forEach(p => updatePrice(p.symbol, p.price, p.change));
      });
      // Then every 5s while WS is down
      pollTimer = setInterval(async () => {
        if (wsAlive || destroyed) return;
        const prices = await fetchPricesREST();
        if (destroyed) return;
        prices.forEach(p => updatePrice(p.symbol, p.price, p.change));
      }, 5000);
    };

    const connectWS = () => {
      if (destroyed) return;
      const streamUrl = CRYPTO_PAIRS.map(p => `${p}@ticker`).join('/');
      ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streamUrl}`);

      ws.onopen = () => {
        wsAlive = true;
        stopRESTFallback();
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.data) {
            const item = payload.data;
            updatePrice(item.s.toUpperCase(), parseFloat(item.c), parseFloat(item.P));
          }
        } catch { /* ignore */ }
      };

      ws.onerror = () => {
        wsAlive = false;
        startRESTFallback();
        console.warn("Binance WS Connection Error - Retrying soon...");
      };

      ws.onclose = () => {
        wsAlive = false;
        startRESTFallback();
        if (!destroyed) setTimeout(connectWS, 5000);
      };
    };

    // Start both immediately — REST gives prices right away, WS takes over if it connects
    connectWS();
    startRESTFallback();

    return () => {
      destroyed = true;
      wsAlive = false;
      stopRESTFallback();
      if (ws) ws.close();
    };
  }, [updatePrice]);

  // Forex Simulation Tick
  useEffect(() => {
    const interval = setInterval(() => {
      tickSimulation();

      // Sync forex prices to trading store so charts/orders work seamlessly
      const currentForexPairs = useForexStore.getState().pairs;
      Object.values(currentForexPairs).forEach(fp => {
        updatePrice(fp.symbol, fp.price, fp.change24h);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tickSimulation, updatePrice]);
};
