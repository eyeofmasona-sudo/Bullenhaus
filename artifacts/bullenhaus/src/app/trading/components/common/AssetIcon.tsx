import React, { useState } from 'react';

/**
 * Unified asset icon. Resolves a real coin logo from /assets/coins/<base>.png
 * (30 crypto logos are bundled in public/assets/coins). For symbols without a
 * bundled logo — forex pairs, pre-market stocks — it falls back to the same
 * lettered square the platform used before.
 *
 * `symbol` accepts both raw pairs ("BTCUSDT") and plain tickers ("BTC").
 */

const baseOf = (symbol: string): string => {
  const s = (symbol || '').toUpperCase();
  return (s.endsWith('USDT') ? s.slice(0, -4) : s).toLowerCase();
};

interface AssetIconProps {
  symbol: string;
  /** Square size in px. Defaults to 32. */
  size?: number;
  className?: string;
}

export const AssetIcon: React.FC<AssetIconProps> = ({ symbol, size = 32, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const base = baseOf(symbol);

  if (failed || !base) {
    const label = (symbol || '?').toUpperCase().replace('USDT', '').substring(0, 3);
    return (
      <div
        style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.28)) }}
        className={`rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-white shrink-0 ${className}`}
      >
        {label}
      </div>
    );
  }

  return (
    <img
      src={`/assets/coins/${base}.png`}
      alt={symbol}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-full object-contain shrink-0 ${className}`}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
};
