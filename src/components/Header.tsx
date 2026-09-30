import React, { useState, useRef } from 'react';
import { ShoppingBag, Menu, X, Tag, LogOut, User } from 'lucide-react';
import { CustomerSession } from '../types';

interface HeaderProps {
  orderCount: number;
  onOpenMyOrders: () => void;
  onOpenAdmin: () => void;
  onOpenRedeem: () => void;
  onNavigateMarketplace: () => void;
  customerSession?: CustomerSession | null;
  onCustomerLogout?: () => void;
  onCustomerLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  orderCount,
  onOpenMyOrders,
  onOpenAdmin,
  onOpenRedeem,
  onNavigateMarketplace,
  customerSession = null,
  onCustomerLogout,
  onCustomerLogin
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Discreet 3-tap counter on logo badge for authenticated admin access
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoTap = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      onOpenAdmin();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1500);
      onNavigateMarketplace();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Subtitle */}
        <div className="flex items-center gap-4 sm:gap-8">
          <button 
            onClick={handleLogoTap}
            className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-0.5 group"
            title="Code Vault"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-xs group-hover:bg-blue-700 transition-colors shrink-0 tracking-tighter">
              CV
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-lg sm:text-xl tracking-tight text-slate-900 leading-none">
                <span className="text-blue-600">C</span>ode <span className="text-blue-600">V</span>ault
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase text-slate-400 leading-none mt-1">
                PREPAID PLATFORM
              </span>
            </div>
          </button>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
            <button 
              onClick={onNavigateMarketplace} 
              className="hover:text-blue-600 transition-colors uppercase tracking-wider min-h-[44px] flex items-center"
            >
              Marketplace
            </button>
            <a 
              href="#how-it-works" 
              className="hover:text-blue-600 transition-colors uppercase tracking-wider min-h-[44px] flex items-center"
            >
              How It Works
            </a>
            <button 
              onClick={onOpenRedeem} 
              className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors text-slate-700 font-bold uppercase tracking-wider min-h-[44px]"
            >
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              Redeem Code
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* MY ORDERS Button */}
          <button
            onClick={onOpenMyOrders}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[40px]"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="text-xs sm:text-sm">MY ORDERS</span>
            {orderCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black bg-white text-blue-700 rounded-full min-w-[18px]">
                {orderCount}
              </span>
            )}
          </button>

          {/* Customer / User Log Out / Sign In Button */}
          {customerSession ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-xl truncate max-w-[130px]">
                <User className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="truncate">{customerSession.name.split(' ')[0]}</span>
              </span>

              <button
                onClick={onCustomerLogout}
                title={`Log out (${customerSession.name})`}
                className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-extrabold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 active:bg-rose-700 border border-rose-200 hover:border-rose-600 rounded-xl shadow-2xs transition-all whitespace-nowrap min-h-[40px]"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">LOG OUT</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onCustomerLogin}
              title="Customer Sign In"
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-extrabold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all whitespace-nowrap min-h-[40px]"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">SIGN IN</span>
            </button>
          )}

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-4 space-y-2.5 shadow-lg animate-fadeIn max-w-full">
          
          {/* Customer Profile & Log Out in Mobile Menu */}
          {customerSession ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {customerSession.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-black text-slate-900 truncate">{customerSession.name}</p>
                  <p className="text-[10px] font-semibold text-slate-500 truncate">{customerSession.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onCustomerLogout?.();
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-extrabold flex items-center gap-1 shrink-0 border border-rose-200 transition-colors min-h-[36px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onCustomerLogin?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl uppercase tracking-wider min-h-[40px] mb-2"
            >
              <User className="w-4 h-4" />
              <span>Sign In as Customer</span>
            </button>
          )}

          <button
            onClick={() => {
              onNavigateMarketplace();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left px-3.5 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-100 rounded-xl uppercase tracking-wider min-h-[44px]"
          >
            Explore Marketplace
          </button>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-left px-3.5 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-100 rounded-xl uppercase tracking-wider min-h-[44px]"
          >
            How It Works
          </a>
          <button
            onClick={() => {
              onOpenRedeem();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full text-left px-3.5 py-3 text-xs font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl uppercase tracking-wider min-h-[44px]"
          >
            <Tag className="w-4 h-4" />
            Redeem Code
          </button>
        </div>
      )}
    </header>
  );
};
