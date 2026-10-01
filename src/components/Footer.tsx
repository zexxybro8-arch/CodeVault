import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
  onOpenRedeem?: () => void;
  onOpenMyOrders?: () => void;
  logoUrl?: string;
}

export const Footer: React.FC<FooterProps> = ({ logoUrl }) => {
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  return (
    <footer className="bg-white border-t border-slate-200/90 py-6 sm:py-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-center flex-wrap">
          
          {/* Code Vault Logo Badge */}
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt="Code Vault Logo"
              onError={() => setLogoFailed(true)}
              className="w-6 h-6 rounded-md object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs tracking-tighter">
              CV
            </div>
          )}

          {/* Code Vault Bold Text with C and V in Blue */}
          <span className="font-display font-black text-sm sm:text-base text-slate-900 tracking-tight">
            <span className="text-blue-600">C</span>ode <span className="text-blue-600">V</span>ault
          </span>

          {/* Bullet Separator */}
          <span className="text-slate-300 font-bold text-sm select-none">•</span>

          {/* TRUSTED BY THOUSANDS Text */}
          <span className="font-extrabold text-xs sm:text-sm text-slate-800 tracking-wider uppercase">
            TRUSTED BY THOUSANDS
          </span>

          {/* Small Blue Verification Badge / Checkmark Tick */}
          <span className="inline-flex items-center justify-center w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-blue-600 text-white shadow-2xs shrink-0">
            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
          </span>

        </div>
      </div>
    </footer>
  );
};
