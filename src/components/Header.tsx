import React, { useState } from 'react';
import { ShoppingBag, Settings, Menu, X, Tag, KeyRound } from 'lucide-react';

interface HeaderProps {
  orderCount: number;
  onOpenMyOrders: () => void;
  onOpenAdmin: () => void;
  onOpenRedeem: () => void;
  onNavigateMarketplace: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  orderCount,
  onOpenMyOrders,
  onOpenAdmin,
  onOpenRedeem,
  onNavigateMarketplace
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Subtitle */}
        <div className="flex items-center gap-8">
          <button 
            onClick={onNavigateMarketplace}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-0.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-xs group-hover:bg-blue-700 transition-colors shrink-0">
              X
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-xl tracking-tight text-slate-900 leading-none">
                BLACK <span className="text-blue-600">X</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 leading-none mt-1">
                PREPAID PLATFORM
              </span>
            </div>
          </button>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <button 
              onClick={onNavigateMarketplace} 
              className="hover:text-blue-600 transition-colors uppercase tracking-wider"
            >
              Marketplace
            </button>
            <a 
              href="#how-it-works" 
              className="hover:text-blue-600 transition-colors uppercase tracking-wider"
            >
              How It Works
            </a>
            <button 
              onClick={onOpenRedeem} 
              className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors text-slate-700 font-bold uppercase tracking-wider"
            >
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              Redeem Code
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          
          {/* MY ORDERS Button */}
          <button
            onClick={onOpenMyOrders}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>MY ORDERS</span>
            {orderCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black bg-white text-blue-700 rounded-full min-w-[18px]">
                {orderCount}
              </span>
            )}
          </button>

          {/* Settings / Admin Icon */}
          <button
            onClick={onOpenAdmin}
            title="Admin Console"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2 shadow-lg animate-fadeIn">
          <button
            onClick={() => {
              onNavigateMarketplace();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg uppercase tracking-wider"
          >
            Explore Marketplace
          </button>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg uppercase tracking-wider"
          >
            How It Works
          </a>
          <button
            onClick={() => {
              onOpenRedeem;
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg uppercase tracking-wider"
          >
            <Tag className="w-4 h-4" />
            Redeem Code
          </button>
          <button
            onClick={() => {
              onOpenAdmin();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg uppercase tracking-wider"
          >
            <KeyRound className="w-4 h-4 text-slate-500" />
            Admin Dashboard
          </button>
        </div>
      )}
    </header>
  );
};
