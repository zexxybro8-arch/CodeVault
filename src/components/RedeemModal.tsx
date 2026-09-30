import React, { useState } from 'react';
import { api } from '../services/api';
import { PromoCode } from '../types';
import { X, Tag, Sparkles, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

interface RedeemModalProps {
  onClose: () => void;
  onCodeRedeemed?: (promo: PromoCode) => void;
}

export const RedeemModal: React.FC<RedeemModalProps> = ({ onClose, onCodeRedeemed }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; promo?: PromoCode } | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setIsLoading(true);
    setResult(null);

    try {
      const res = await api.redeemCode(code.trim());
      setResult(res);
      if (res.success && res.promoCode && onCodeRedeemed) {
        onCodeRedeemed(res.promoCode);
      }
    } catch (err) {
      setResult({ success: false, message: 'Server verification error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-blue-600 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
            <Tag className="w-5 h-5 text-white" />
          </div>

          <h3 className="text-xl font-black font-display tracking-tight">Redeem Gift / Voucher Code</h3>
          <p className="text-xs text-blue-100 font-medium mt-1">
            Enter your BLACK X promotional voucher code to claim instant checkout discounts.
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleRedeem} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              PROMO / VOUCHER CODE
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BLACKX2026 or WELCOME100"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-wider font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Sample test codes: <strong className="text-slate-700 font-mono">BLACKX2026</strong> (15% OFF) or <strong className="text-slate-700 font-mono">WELCOME100</strong> (₹100 OFF)
            </p>
          </div>

          {result && (
            <div
              className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-2.5 ${
                result.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{result.message}</p>
                {result.success && (
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Your promo discount has been saved! Simply click "BUY NOW" on any card to apply it at checkout.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>REDEEM CODE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
