import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: () => void;
  assetId?: string;
  contractUrl?: string;
}

export const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose, onSign, assetId, contractUrl }) => {
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    setSigning(true);
    try {
      if (!assetId || assetId === 'hardcoded-nrlk') {
        const { error } = await supabase.rpc('sign_premarket_contract', { 
          version: 'v1.0' 
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('sign_premarket_asset_contract', { 
          p_asset_id: assetId 
        });
        if (error) throw error;
      }
      
      toast.success('Contract signed successfully. You may now proceed with your purchase.');
      onSign();
      onClose();
    } catch (err) {
      console.error('Error signing contract:', err);
      toast.error('Failed to sign contract. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  if (!isOpen) return null;

  const actualContractUrl = contractUrl || '/premarket_contract_v1.pdf';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#121214] border border-white/10 rounded-xl w-full max-w-4xl flex flex-col h-[85vh] shadow-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0a0a0b] rounded-t-xl">
          <h2 className="text-xl font-bold text-white tracking-wide">Premarket Investment Contract</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden p-6 bg-slate-900/50">
           {/* Simulate PDF using object or iframe, fallback to a message if missing */}
           <object data={actualContractUrl} type="application/pdf" className="w-full h-full rounded-lg bg-white border border-white/5">
             <div className="flex items-center justify-center h-full text-slate-400 p-8 text-center flex-col gap-4">
                <p>PDF viewer not available. Please ensure you have read the contract.</p>
                <a href={actualContractUrl} target="_blank" className="text-accent-primary underline">Download Contract</a>
             </div>
           </object>
        </div>

        <div className="p-6 border-t border-white/10 bg-[#0a0a0b] rounded-b-xl space-y-4">
           <label className="flex items-center gap-3 cursor-pointer select-none">
             <input 
               type="checkbox" 
               checked={agreed} 
               onChange={e => setAgreed(e.target.checked)} 
               className="w-5 h-5 rounded border-white/20 bg-black/50 text-accent-primary focus:ring-accent-primary focus:ring-offset-0" 
             />
             <span className="text-slate-300 font-medium">I Have Read and Accept the Contract</span>
           </label>
           
           <div className="flex justify-end gap-4 pt-2">
             <button 
               onClick={onClose} 
               className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
             >
               Cancel
             </button>
             <button 
               disabled={!agreed || signing} 
               onClick={handleSign} 
               className="btn-primary px-8 py-2.5 text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
             >
               {signing ? (
                 <span className="animate-pulse">Signing...</span>
               ) : (
                 'Sign Contract'
               )}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};
