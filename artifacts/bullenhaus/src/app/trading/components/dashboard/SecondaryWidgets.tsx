import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Clock, Search, Filter, ShieldCheck, ArrowUpRight, Activity } from 'lucide-react';
import { useTradingStore } from '../../stores/tradingStore';
import { useTradingContext } from '../../contexts/TradingContext';

export const Watchlist = () => {
  const { setCurrentPair } = useTradingContext();
  const prices = useTradingStore(s => s.prices);
  const priceChanges = useTradingStore(s => s.priceChanges);

  const defaultSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'EURUSD', 'GBPUSD', 'XAUUSD'];
  
  const items = defaultSymbols.map(sym => {
    // Determine the store key (crypto is lowercase from Binance, forex is whatever ForexStore provides)
    const storeKey = sym.endsWith('USDT') ? sym.toLowerCase() : sym;
    const p = prices[storeKey] || prices[sym]; // fallback just in case
    const c = priceChanges[storeKey] || priceChanges[sym];
    const isCrypto = sym.endsWith('USDT');
    // Format presentation symbol
    const displaySym = isCrypto ? sym.replace('USDT', ' / USDT') : `${sym?.substring(0,3)} / ${sym?.substring(3)}`;
    
    return {
      id: sym,
      symbol: displaySym,
      price: p != null ? p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: isCrypto ? 2 : 4 }) : '.',
      change: c != null ? `${c > 0 ? '+' : ''}${c.toFixed(2)}%` : '.',
      trend: c && c >= 0 ? 'up' : 'down'
    };
  });

  return (
    <div className="glass-card p-6 min-w-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white tracking-wide">Watchlist</h3>
        <div className="flex gap-2">
           <button className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors"><Search size={14}/></button>
           <button className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors"><Filter size={14}/></button>
        </div>
      </div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest grid grid-cols-12 mb-4 px-2">
         <span className="col-span-6">Symbol</span>
         <span className="col-span-3 text-right">Price</span>
         <span className="col-span-3 text-right">Change</span>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <motion.div 
            key={item.id}
            onClick={() => setCurrentPair(item.id)}
            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.02)' }}
            className="grid grid-cols-12 items-center px-2 py-3 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/5"
          >
            <div className="col-span-6 flex items-center gap-3 min-w-0">
               <div className="w-8 h-8 rounded-lg bg-[#111] border border-white/5 flex items-center justify-center text-xs font-bold text-accent-primary">
                  {item.symbol.charAt(0)}
               </div>
               <span className="text-xs font-bold text-slate-200 truncate">{item.symbol}</span>
            </div>
            <span className="col-span-3 text-right text-xs font-mono text-slate-300 truncate">{item.price}</span>
            <span className={`col-span-3 text-right text-xs font-bold ${item.trend === 'up' ? 'text-accent-secondary' : 'text-accent-quaternary'}`}>
               {item.change}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const MarketMovers = () => {
  const tabs = ['Top Gainers', 'Top Losers', 'Top Volume'];
  const prices = useTradingStore(s => s.prices);
  const priceChanges = useTradingStore(s => s.priceChanges);

  // Compute movers dynamically
  const moversList = Object.entries(priceChanges).map(([symbol, change]) => {
    const isCrypto = symbol.toLowerCase().endsWith('usdt');
    const upperSym = symbol.toUpperCase();
    const displaySym = isCrypto ? upperSym.replace('USDT', ' / USDT') : `${upperSym?.substring(0,3)} / ${upperSym?.substring(3)}`;
    const currPrice = prices[symbol];
    
    return {
      symbol: displaySym,
      rawSymbol: symbol,
      priceStr: currPrice != null ? currPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: isCrypto ? 2 : 4 }) : '.',
      changeStr: change != null ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : '.',
      changeVal: change,
      trend: change >= 0 ? 'up' : 'down'
    };
  }).sort((a, b) => b.changeVal - a.changeVal).slice(0, 4);

  // Fallback if no prices exist yet
  const movers = moversList.length > 0 ? moversList : [
    { rawSymbol: 'SOLUSDT', symbol: 'SOL / USDT', priceStr: '.', changeStr: '.', trend: 'up' },
    { rawSymbol: 'ADAUSDT', symbol: 'ADA / USDT', priceStr: '.', changeStr: '.', trend: 'up' },
    { rawSymbol: 'AVAXUSDT', symbol: 'AVAX / USDT', priceStr: '.', changeStr: '.', trend: 'up' },
    { rawSymbol: 'LINKUSDT', symbol: 'LINK / USDT', priceStr: '.', changeStr: '.', trend: 'up' },
  ];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
         <h3 className="text-sm font-bold text-white tracking-wide">Market Movers</h3>
         <select className="bg-transparent text-[10px] font-bold text-slate-500 outline-none">
            <option>24h</option>
         </select>
      </div>
      <div className="flex p-1 bg-[#111] rounded-xl mb-6">
         {tabs.map((tab, i) => (
           <button key={tab} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${i === 0 ? 'bg-accent-primary/20 text-accent-primary' : 'text-slate-500 hover:text-white'}`}>
              {tab}
           </button>
         ))}
      </div>
      <div className="space-y-4">
        {movers.map((mover) => (
          <div key={mover.rawSymbol} className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-all">
             <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${mover.trend === 'up' ? 'bg-accent-secondary shadow-neon-emerald' : 'bg-accent-quaternary shadow-neon-rose'} group-hover:scale-150 transition-transform`} />
                <span className="text-xs font-bold text-slate-200 group-hover:text-accent-primary transition-colors">{mover.symbol}</span>
             </div>
             <div className="text-right">
                <p className="text-xs font-bold text-white">{mover.priceStr}</p>
                <p className={`text-[10px] font-bold ${mover.trend === 'up' ? 'text-accent-secondary' : 'text-accent-quaternary'}`}>{mover.changeStr}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RecentActivity = () => {
  const activities: Array<{ label: string; time: string; value: string; color: string }> = [];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
         <h3 className="text-sm font-bold text-white tracking-wide">Recent Activity</h3>
         <button className="text-[10px] font-bold text-accent-primary hover:underline">View All</button>
      </div>
      <div className="space-y-6">
        {activities.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-6">No recent account activity.</div>
        ) : activities.map((act, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
               <Clock size={14} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-bold text-white mb-0.5 truncate">{act.label}</p>
               <p className="text-[10px] font-bold text-slate-500">{act.time}</p>
            </div>
            <span className={`text-[10px] font-bold ${act.color}`}>{act.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MarketSentimentWidget = () => {
  const [sentiment, setSentiment] = React.useState(39); // 0 = Bearish, 100 = Bullish

  // Simulate a live feel by slightly fluctuating sentiment every few seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setSentiment(prev => {
        // Random walk
        let next = prev + (Math.random() * 10 - 5);
        if (next < 5) next = 5;
        if (next > 95) next = 95;
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const isBearish = sentiment < 50;
  // Map sentiment (0-100) to rotation (-90 to 90 degrees) for the needle
  const needleRotation = (sentiment / 100) * 180 - 90;

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className={`glass-card p-6 border-accent-primary/20 relative overflow-hidden transition-colors duration-1000 holo-border`}
    >
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${isBearish ? 'bg-accent-quaternary/20' : 'bg-accent-secondary/20'}`} />

      <div className="flex items-center justify-between mb-4 relative z-10">
         <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Market Sentiment</h3>
         <div className={`w-2 h-2 rounded-full animate-pulse transition-colors duration-1000 ${isBearish ? 'bg-accent-quaternary shadow-neon-rose' : 'bg-accent-secondary shadow-neon-emerald'}`} />
      </div>

      <div className="relative flex flex-col items-center justify-center pt-8 pb-4 z-10">
        {/* Gauge Background */}
        <div className="relative w-48 h-24 overflow-hidden">
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-slate-800" />
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-transparent border-t-accent-quaternary border-l-accent-quaternary opacity-80" style={{ transform: 'rotate(-45deg)' }} />
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-transparent border-t-accent-secondary border-r-accent-secondary opacity-80" style={{ transform: 'rotate(45deg)' }} />
          
          {/* Animated Needle */}
          <motion.div 
            className="absolute bottom-0 left-1/2 w-1 h-24 origin-bottom bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20"
            animate={{ rotate: needleRotation }}
            transition={{ type: "spring", stiffness: 40, damping: 15 }}
            style={{ x: "-50%" }}
          >
             {/* Needle base */}
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)]" />
          </motion.div>
        </div>

        <div className="absolute bottom-0 flex flex-col items-center w-full">
          <motion.h2 
             key={Math.round(sentiment)}
             initial={{ scale: 1.1, opacity: 0.8 }}
             animate={{ scale: 1, opacity: 1 }}
             className={`text-3xl font-bold tracking-tighter drop-shadow-md transition-colors duration-1000 ${isBearish ? 'text-accent-quaternary' : 'text-accent-secondary'}`}
          >
             {Math.round(sentiment)}%
          </motion.h2>
          <div className="flex items-center gap-1.5 mt-1">
             <TrendingDown size={14} className={isBearish ? "text-accent-quaternary" : "text-accent-secondary rotate-180"} />
             <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-1000 ${isBearish ? "text-accent-quaternary shadow-neon-rose" : "text-accent-secondary shadow-neon-emerald"}`}>
               {isBearish ? 'Bearish' : 'Bullish'}
             </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const EliteTraderWidget = () => {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
      style={{ perspective: 1000 }}
      className="glass-card p-0 border-accent-primary/30 relative overflow-hidden holo-border cursor-pointer group h-64"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000aa] to-transparent z-10 pointer-events-none" />
      <img 
        src="/elite-trade-ad.png" 
        alt="BullenHaus Elite Trade" 
        className="w-full h-full object-cover transform group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 absolute inset-0" 
      />
      
      <div className="relative z-20 flex flex-col justify-end h-full p-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
           <h3 className="text-xl font-bold text-white uppercase tracking-[0.1em] drop-shadow-lg">Elite Trade</h3>
           <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-primary text-black shadow-[0_0_15px_rgba(212,175,55,0.8)]">VIP</div>
        </div>
        
        <p className="text-xs text-slate-200 leading-relaxed font-medium mb-3 drop-shadow-md">
          Institutional intelligence. Exclusive vaults. <span className="text-gold font-bold">0% maker fees.</span>
        </p>

        <button className="w-full py-2 rounded-xl bg-gradient-to-r from-accent-primary via-yellow-400 to-yellow-600 text-[11px] font-bold text-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(212,175,55,0.8)] transition-all duration-300">
          Upgrade Now
        </button>
      </div>
    </motion.div>
  );
};
