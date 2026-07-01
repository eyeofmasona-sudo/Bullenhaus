import React from 'react';
import { motion } from 'motion/react';
import { Zap, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useTradingStore } from '../../stores/tradingStore';

export const ProTraderCard = () => (
  <div className="relative group overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#1a1a1a] to-[#050505] border border-accent-primary/20 mb-8 holo-border">
    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
       <Zap size={64} className="text-accent-primary" />
    </div>
    <div className="relative z-10">
      <h4 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-tertiary mb-2 uppercase tracking-wide">Elite Trader</h4>
      <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
        Unlock institutional tools, deep liquidity and exclusive rewards.
      </p>
      <button className="w-full py-3 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-[10px] font-bold rounded-lg hover:bg-accent-primary hover:text-black hover:shadow-neon-gold active:scale-95 transition-all uppercase tracking-widest">
        Upgrade Now
      </button>
    </div>
  </div>
);

export const SentimentGauge = () => {
  const priceChanges = useTradingStore(s => s.priceChanges);

  // Calculate sentiment from live price changes
  const changeValues = Object.values(priceChanges);
  const hasLiveChanges = changeValues.length > 0;

  let sentiment = 50;
  let upCount = 0;
  let downCount = 0;
  let avgChange = 0;

  if (hasLiveChanges) {
    upCount = changeValues.filter(c => c > 0).length;
    downCount = changeValues.filter(c => c < 0).length;
    avgChange = changeValues.reduce((sum, c) => sum + c, 0) / changeValues.length;
    sentiment = Math.round((upCount / changeValues.length) * 100);
    sentiment = Math.max(5, Math.min(95, sentiment));
  }

  const isBullish = sentiment >= 50;
  const rotation = Math.round((sentiment / 100) * 180);

  // Gauge arc color based on sentiment
  const gaugeColor = isBullish ? '#10b981' : '#ef4444';
  const gaugeGradient = isBullish
    ? 'from-emerald-500 via-emerald-400 to-emerald-600'
    : 'from-rose-500 via-rose-400 to-rose-600';

  return (
    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] overflow-hidden">
      {/* Subtle ambient glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: gaugeColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-1.5">
          <Activity size={12} className="text-gold/70" />
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Market Sentiment</span>
        </div>
        {hasLiveChanges && (
          <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        )}
      </div>

      {/* Gauge */}
      <div className="gauge-container mb-2 relative">
        <div className="gauge-arc" />
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="gauge-progress"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${gaugeColor} 100%)` }}
        />

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-end justify-center pb-3 pr-2">
          <div className="text-center w-full">
            <motion.span
              key={sentiment}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="block text-3xl font-bold font-mono tracking-tight"
              style={{ color: hasLiveChanges ? gaugeColor : '#64748b' }}
            >
              {hasLiveChanges ? `${sentiment}%` : '--'}
            </motion.span>
            <span className={`text-[10px] font-bold flex items-center gap-1 justify-center mt-0.5 ${hasLiveChanges ? (isBullish ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'}`}>
              {hasLiveChanges ? (
                <>
                  {isBullish ? <TrendingUp size={10} /> : <TrendingDown size={10} className="rotate-180" />}
                  {isBullish ? 'Bullish' : 'Bearish'}
                </>
              ) : (
                'No live data'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {hasLiveChanges && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-1.5 mt-3 relative z-10"
        >
          <div className="text-center rounded-lg bg-emerald-500/5 border border-emerald-500/10 py-1.5">
            <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-400/70">Up</p>
            <p className="text-[14px] font-bold font-mono text-emerald-400">{upCount}</p>
          </div>
          <div className="text-center rounded-lg bg-white/5 border border-white/10 py-1.5">
            <p className="text-[8px] font-bold uppercase tracking-wider text-white/50">Avg</p>
            <p className={`text-[14px] font-bold font-mono ${avgChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
            </p>
          </div>
          <div className="text-center rounded-lg bg-rose-500/5 border border-rose-500/10 py-1.5">
            <p className="text-[8px] font-bold uppercase tracking-wider text-rose-400/70">Down</p>
            <p className="text-[14px] font-bold font-mono text-rose-400">{downCount}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// UI/UX update: 2026-07-01T12:41:59Z
