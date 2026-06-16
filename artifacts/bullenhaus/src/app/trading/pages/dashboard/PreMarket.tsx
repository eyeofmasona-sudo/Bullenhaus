import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTradingStore } from '../../stores/tradingStore';
import { toast } from 'sonner';
import { Rocket, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PreMarket: React.FC = () => {
  const { t } = useTranslation('common');
  const wallet = useTradingStore(s => s.wallet);
  const buyAsset = useTradingStore(s => s.buyAsset);
  
  const [amount, setAmount] = useState<string>('1');
  const [isBuying, setIsBuying] = useState(false);

  // Hardcoded Pre-Market Asset: Neuralink
  const asset = {
    symbol: 'NRLK',
    name: 'Neuralink',
    price: 15.50,
    description: 'Pre-IPO shares of Neuralink Corp.',
  };

  const parsedAmount = parseFloat(amount);
  const totalCost = isNaN(parsedAmount) ? 0 : parsedAmount * asset.price;
  const availableBalance = Math.max(0, wallet.balance - wallet.marginUsed);
  const canAfford = availableBalance >= totalCost && totalCost > 0;

  const handleBuy = async () => {
    if (!canAfford || isNaN(parsedAmount) || parsedAmount <= 0) return;
    
    setIsBuying(true);
    
    // Simulate slight network delay for better UX
    setTimeout(() => {
      const success = buyAsset(asset.symbol, asset.name, asset.price, parsedAmount);
      setIsBuying(false);
      
      if (success) {
        toast.success(`Successfully purchased ${parsedAmount} ${asset.symbol}`);
        setAmount('1');
      } else {
        toast.error('Insufficient funds to complete this purchase');
      }
    }, 800);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <Rocket className="text-accent-primary" size={28} />
            Pre-Market
          </h2>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-accent-secondary" />
            Exclusive access to pre-IPO opportunities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Asset Card */}
        <div className="glass-card border-accent-primary/20 relative overflow-hidden group flex flex-col">
          {/* Top Image Poster */}
          <div className="w-full h-[350px] relative overflow-hidden shrink-0 bg-[#0A0E17]">
            <img 
              src="/neuralink-poster.png" 
              alt="Neuralink Poster" 
              className="w-full h-full object-cover object-center opacity-100 transition-transform duration-700 group-hover:scale-105"
            />
            {/* Smooth transition gradient into the card body */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17] via-[#0A0E17]/60 to-transparent" />
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Card Content - lifted slightly to overlap the fade */}
          <div className="p-8 relative z-10 flex flex-col flex-1 -mt-32">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center font-bold text-white text-xl shadow-[0_0_15px_rgba(212,175,55,0.2)] backdrop-blur-md">
                    N
                  </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">{asset.name}</h3>
                  <p className="text-xs font-bold text-accent-primary uppercase tracking-widest">{asset.symbol}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Fixed Price</p>
              <p className="text-3xl font-mono font-bold text-white">${asset.price.toFixed(2)}</p>
            </div>
          </div>
          
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            {asset.description} Participate in the early stages of next-generation brain-computer interface technology before public listing.
          </p>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount to buy (Shares)</label>
                <span className="text-xs text-slate-500 font-mono">Available: ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <input 
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-accent-primary/50 transition-colors"
                placeholder="Enter amount"
              />
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Cost</span>
                <span className="font-mono font-bold text-white">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {!canAfford && totalCost > 0 && (
                <div className="flex items-center gap-2 text-xs text-red-400 pt-2 border-t border-white/5">
                  <AlertCircle size={14} />
                  Insufficient available balance
                </div>
              )}
            </div>

            <button
              onClick={handleBuy}
              disabled={!canAfford || isBuying || totalCost <= 0}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
                canAfford && !isBuying 
                  ? 'bg-accent-primary text-black hover:bg-accent-primary/90 shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                  : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
              }`}
            >
              {isBuying ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Buy {asset.symbol}
                </>
              )}
            </button>
          </div>
          </div>
        </div>

        {/* Info / FAQ */}
        <div className="space-y-6 flex flex-col justify-end">
          <div className="glass-card p-6 border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">About Pre-Market</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pre-Market trading allows eligible clients to acquire shares of highly anticipated companies before their Initial Public Offering (IPO). Prices are fixed by our liquidity providers and settlement is guaranteed.
            </p>
          </div>
          <div className="glass-card p-6 border-white/5 bg-black/20">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Terms & Conditions</h3>
            <ul className="text-xs text-slate-500 space-y-3 list-disc list-inside">
              <li>Purchased assets will appear in your Portfolio immediately.</li>
              <li>Pre-Market assets cannot be sold until the official IPO date.</li>
              <li>Margin cannot be used for Pre-Market purchases; only available wallet balance is accepted.</li>
              <li>All purchases are final and non-refundable.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
