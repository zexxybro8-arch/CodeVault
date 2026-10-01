import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag, Menu, X, Tag, LogOut, Wallet, Plus,
  User as UserIcon, ChevronDown, Shield, History
} from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  orderCount: number;
  currentUser: User | null;
  logoUrl?: string;
  onOpenMyOrders: () => void;
  onOpenAdmin: () => void;
  onOpenRedeem: () => void;
  onNavigateMarketplace: () => void;
  onOpenWallet: () => void;
  onOpenDeposit: () => void;
  onOpenUserLogin: () => void;
  onOpenLogoutConfirm?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  orderCount,
  currentUser,
  logoUrl,
  onOpenMyOrders,
  onOpenAdmin,
  onOpenRedeem,
  onNavigateMarketplace,
  onOpenWallet,
  onOpenDeposit,
  onOpenUserLogin,
  onOpenLogoutConfirm
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);
  
  // Discreet 3-tap counter on logo badge for authenticated admin access
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoTap = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 4) {
      clickCountRef.current = 0;
      onOpenAdmin();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1500);
      onNavigateMarketplace();
    }
  };

  const walletBalance = currentUser?.walletBalance || 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Subtitle */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            onClick={handleLogoTap}
            className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-0.5 group"
            title="Code Vault (Triple tap for Admin)"
          >
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl}
                alt="Code Vault Logo"
                onError={() => setLogoFailed(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain bg-slate-50 border border-slate-200/80 p-0.5 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-xs group-hover:bg-blue-700 transition-colors shrink-0 tracking-tighter">
                CV
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-display font-black text-lg sm:text-xl tracking-tight text-slate-900 leading-none">
                <span className="text-blue-600">C</span>ode <span className="text-blue-600">V</span>ault
              </span>
              <span className="text-[8px] sm:text-[9px] font-extrabold tracking-wider uppercase text-slate-400 leading-none mt-1">
                PREPAID PLATFORM
              </span>
            </div>
          </button>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-slate-600">
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
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* USER WALLET BADGE */}
          {currentUser && (
            <button
              onClick={onOpenWallet}
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-2xl transition-all shadow-2xs group cursor-pointer"
              title="Open Wallet"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div className="text-left leading-none">
                <span className="text-[9px] font-extrabold text-blue-600 block uppercase tracking-tighter">WALLET</span>
                <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
                  ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </button>
          )}

          {/* MY ORDERS Button */}
          <button
            onClick={onOpenMyOrders}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all whitespace-nowrap min-h-[38px]"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="text-xs sm:text-sm hidden xs:inline">MY ORDERS</span>
            {orderCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-black bg-white text-blue-700 rounded-full min-w-[16px]">
                {orderCount}
              </span>
            )}
          </button>

          {/* Logged in User Profile Avatar Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1 p-0.5 rounded-full border-2 border-slate-200 hover:border-blue-500 transition-all focus:outline-none"
              >
                <img
                  src={currentUser.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 space-y-1 z-50 animate-fadeIn text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-extrabold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 font-semibold truncate">{currentUser.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenWallet();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-blue-600" />
                      <span>Wallet Balance</span>
                    </div>
                    <span className="font-mono text-blue-600 font-extrabold">₹{walletBalance.toFixed(2)}</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenDeposit();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>+ Add Money</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenMyOrders();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 text-slate-600" />
                    <span>My Orders</span>
                  </button>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onOpenLogoutConfirm) onOpenLogoutConfirm();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hamburger Menu (☰) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0 min-w-[38px] min-h-[38px] flex items-center justify-center border border-transparent hover:border-slate-200"
            aria-label="Toggle menu"
            title="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Hamburger Menu Drawer */}
      {mobileMenuOpen && (
        <div className="bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2 shadow-lg animate-fadeIn max-w-full">
          {currentUser && (
            <button
              onClick={() => {
                onOpenWallet();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3.5 py-3 bg-slate-50 text-slate-800 font-extrabold text-xs rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span>Wallet Balance</span>
              </div>
              <span className="font-mono text-blue-600 font-black">₹{walletBalance.toFixed(2)}</span>
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
            className="block w-full text-left px-3.5 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-100 rounded-xl uppercase tracking-wider min-h-[44px]"
          >
            Redeem Voucher Code
          </button>

          {currentUser && onOpenLogoutConfirm && (
            <div className="border-t border-slate-100 pt-2">
              <button
                onClick={() => {
                  onOpenLogoutConfirm();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs font-extrabold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
