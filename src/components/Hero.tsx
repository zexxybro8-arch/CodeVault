import React from 'react';
import { Play, ShieldCheck, Zap, Lock } from 'lucide-react';

interface HeroProps {
  onExploreCards: () => void;
  onRedeemCode: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreCards, onRedeemCode }) => {
  return (
    <section className="relative bg-white pt-12 pb-12 md:pt-16 md:pb-16 border-b border-slate-100 overflow-hidden">
      {/* Background Radial Dots Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        {/* Small Rounded Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>THE MOST TRUSTED PREMIUM CARD PLATFORM</span>
        </div>

        {/* Hero Headline */}
        <div className="space-y-2">
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
            <span className="text-slate-900">BLACK <span className="text-blue-600">X</span></span>
            <br />
            <span className="text-slate-900 font-black">Digital Redeem Codes</span>
          </h1>
        </div>

        {/* Supporting Subtitle */}
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl font-medium leading-relaxed mx-auto">
          Secure. Flexible. Ready for everyday spending.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 max-w-md mx-auto">
          <button
            onClick={onExploreCards}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-sm hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span>EXPLORE CARDS →</span>
          </button>

          <button
            onClick={onRedeemCode}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-blue-50/80 border-2 border-blue-600 text-blue-600 font-extrabold text-sm sm:text-base rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Play className="w-4 h-4 fill-blue-600" />
            <span>Redeem Code</span>
          </button>
        </div>

        {/* Feature Items Row below buttons */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-bold text-slate-600 border-t border-slate-100 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600 shrink-0" />
            <span>⚡ Instant Digital Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>🔒 100% Encrypted & Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>✓ 24/7 Buyer Guarantee</span>
          </div>
        </div>

      </div>
    </section>
  );
};
