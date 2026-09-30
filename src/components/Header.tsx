import React, { useState, useRef } from 'react';
import { ShoppingBag, Menu, X, Tag, LogOut, User, Compass, HelpCircle } from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  orderCount: number;
  onOpenMyOrders: () => void;
  onOpenAdmin: () => void;
  onOpenRedeem: () => void;
  onNavigateMarketplace: () => void;
  onRequestLogout?: () => void;
  currentUser?: UserSession | null;
}

export const Header: React.FC<HeaderProps> = ({
  orderCount,
  onOpenMyOrders,
  onOpenAdmin,
  onOpenRedeem,
  onNavigateMarketplace,
  onRequestLogout,
  currentUser
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
            title="Code Vault (Tap 3x for Admin)"
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
        <div className="flex items-center gap-2">
          
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

          {/* Top-Right Hamburger Menu (☰) - Always visible for customer navigation & logout */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center border border-slate-200"
            aria-label="Toggle menu"
            title="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Hamburger Menu Drawer */}
      {mobileMenuOpen && (
        <div className="bg-white border-b border-slate-200 px-4 pt-3 pb-4 space-y-2 shadow-xl animate-fadeIn max-w-full">
          
          {/* Authenticated User Info Header */}
          {currentUser && (
            <div className="px-3.5 py-2.5 mb-2 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                <span className="text-xs font-black text-slate-900 truncate">{currentUser.name || 'Customer'}</span>
                <span className="text-[11px] text-slate-500 truncate">{currentUser.email || currentUser.phone}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200 shrink-0">
                Active
              </span>
            </div>
          )}

          {/* Navigation Links */}
          <button
            onClick={() => {
              onNavigateMarketplace();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 w-full text-left px-3.5 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-100 rounded-xl uppercase tracking-wider min-h-[44px] transition-colors"
          >
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Explore Marketplace</span>
          </button>

          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 w-full text-left px-3.5 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-100 rounded-xl uppercase tracking-wider min-h-[44px] transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>How It Works</span>
          </a>

          <button
            onClick={() => {
              onOpenRedeem();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 w-full text-left px-3.5 py-3 text-xs font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl uppercase tracking-wider min-h-[44px] transition-colors"
          >
            <Tag className="w-4 h-4 text-blue-600" />
            <span>Redeem Code</span>
          </button>

          <button
            onClick={() => {
              onOpenMyOrders();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 w-full text-left px-3.5 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-100 rounded-xl uppercase tracking-wider min-h-[44px] transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-slate-500" />
            <span>My Orders & Codes</span>
          </button>

          {/* USER LOG OUT ITEM WITH LOGOUT ICON */}
          {onRequestLogout && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onRequestLogout();
                }}
                className="flex items-center gap-2.5 w-full text-left px-3.5 py-3 text-xs font-black text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-xl uppercase tracking-wider min-h-[44px] transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Log Out</span>
              </button>
            </div>
          )}

        </div>
      )}
    </header>
  );
};
