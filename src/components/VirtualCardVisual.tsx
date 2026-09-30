import React from 'react';

interface VirtualCardVisualProps {
  cardType?: string;
  cardName?: string;
  maskedNumber?: string;
  holderName?: string;
  expiry?: string;
  limit?: number;
  themeGradient?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VirtualCardVisual: React.FC<VirtualCardVisualProps> = ({
  cardType = 'VISA',
  cardName = 'BLACK X CARD',
  maskedNumber = '4532 •••• •••• 8821',
  holderName = 'BLACK X HOLDER',
  expiry = '12/28',
  limit,
  themeGradient,
  size = 'md'
}) => {
  const isPlayStore = cardType.toUpperCase() === 'PLAY STORE';

  // Default clean modern blue-indigo gradient if none passed
  const gradientClass = themeGradient || 'from-blue-700 via-blue-800 to-indigo-950';

  const sizeClasses = {
    sm: 'p-3 rounded-xl min-h-[140px] text-xs',
    md: 'p-5 rounded-2xl min-h-[190px] text-sm',
    lg: 'p-6 rounded-2xl min-h-[220px] text-base'
  };

  return (
    <div
      className={`relative w-full bg-gradient-to-br ${gradientClass} text-white shadow-lg overflow-hidden flex flex-col justify-between border border-blue-400/20 transition-all duration-300 group-hover:shadow-blue-500/10 ${sizeClasses[size]}`}
    >
      {/* Glossy Sheen Overlay */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
      
      {/* Top Row: Logo & Card Brand */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="font-extrabold tracking-wider text-xs uppercase opacity-90 font-display">
            BLACK <span className="text-blue-300">X</span>
          </span>
        </div>
        <div className="font-bold text-xs uppercase px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 tracking-wider">
          {cardType}
        </div>
      </div>

      {/* Middle Row: Chip & NFC Icon or Play Store Code */}
      <div className="my-3 z-10 flex items-center justify-between">
        {!isPlayStore ? (
          <div className="flex items-center gap-3">
            {/* Realistic SIM Chip */}
            <div className="w-10 h-7 bg-amber-200/90 rounded-md border border-amber-300/80 shadow-inner flex flex-col justify-between p-1">
              <div className="w-full h-0.5 bg-amber-400/60" />
              <div className="w-full h-0.5 bg-amber-400/60" />
            </div>
            {/* Contactless Waves */}
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.117 8.117a8 8 0 0111.766 0M10.946 10.946a4 4 0 015.657 0M13.775 13.775a1 1 0 010 1.414" />
            </svg>
          </div>
        ) : (
          <div className="text-xs font-mono bg-white/10 px-3 py-1 rounded-md text-cyan-200 border border-cyan-300/30">
            GIFT VOUCHER CARD
          </div>
        )}

        {limit !== undefined && (
          <div className="text-right">
            <span className="text-[10px] uppercase text-blue-200 tracking-wider block font-medium">Limit</span>
            <span className="font-bold font-mono text-emerald-300 text-sm">₹{limit.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* Card Number */}
      <div className="z-10 tracking-widest font-mono font-semibold text-white/95 text-base md:text-lg my-1">
        {maskedNumber}
      </div>

      {/* Bottom Row: Holder & Expiry */}
      <div className="flex items-end justify-between z-10 text-xs text-white/80 pt-2 border-t border-white/10">
        <div>
          <span className="text-[9px] uppercase tracking-widest text-blue-200 block font-medium">Cardholder</span>
          <span className="font-semibold text-white tracking-wide uppercase text-xs truncate max-w-[140px] block">
            {holderName}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase tracking-widest text-blue-200 block font-medium">Expires</span>
          <span className="font-semibold font-mono text-white text-xs">{expiry}</span>
        </div>
      </div>
    </div>
  );
};
