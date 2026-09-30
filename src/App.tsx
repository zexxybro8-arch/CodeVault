import React, { useState, useEffect } from 'react';
import { Product, Category, Order, UserSession } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { MainNavigation, MainViewTab } from './components/MainNavigation';
import { RedeemCodeView } from './components/views/RedeemCodeView';
import { HowToRedeemView } from './components/views/HowToRedeemView';
import { WhyChooseUsView } from './components/views/WhyChooseUsView';
import { CheckoutModal } from './components/CheckoutModal';
import { MyOrdersModal } from './components/MyOrdersModal';
import { RedeemModal } from './components/RedeemModal';
import { AdminSignIn } from './components/AdminSignIn';
import { AdminPanel } from './components/AdminPanel';
import { UserLoginWelcome } from './components/UserLoginWelcome';
import { Footer } from './components/Footer';
import { LogOut } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<MainViewTab>('REDEEM CODE');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Normal Customer Authentication State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    return api.getUserSession();
  });
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(() => {
    return Boolean(api.getUserToken());
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutToastMessage, setLogoutToastMessage] = useState<string | null>(null);

  // Admin Auth & View State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return Boolean(api.getAdminToken());
  });

  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('admin') || window.location.hash === '#admin') return true;
    }
    return Boolean(api.getAdminToken());
  });

  // Modals state
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<Product | null>(null);
  const [showMyOrdersModal, setShowMyOrdersModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Listen to browser navigation (Back / Forward) to protect authenticated pages
  useEffect(() => {
    const handlePopState = () => {
      const token = api.getUserToken();
      if (!token) {
        setIsUserLoggedIn(false);
        setCurrentUser(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch Initial Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, cRes, oRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getOrders()
      ]);
      setProducts(pRes);
      setCategories(cRes);
      setRecentOrders(oRes);
    } catch (err) {
      console.error('Error initializing application data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When order completed in checkout
  const handleOrderCompleted = (newOrder: Order) => {
    setRecentOrders(prev => [newOrder, ...prev]);
    fetchData();
  };

  // Normal User Login Handler
  const handleUserLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    setIsUserLoggedIn(true);
    setLogoutToastMessage(null);
    fetchData();
  };

  // Normal User Logout Confirmation Handler
  const handleConfirmLogout = () => {
    api.userLogout();
    setIsUserLoggedIn(false);
    setCurrentUser(null);
    setShowLogoutConfirm(false);
    setLogoutToastMessage('Logged out successfully.');

    // Prevent returning to authenticated pages via browser Back button
    if (typeof window !== 'undefined') {
      window.history.replaceState({ loggedOut: true }, '', window.location.pathname);
    }
  };

  // 1. If Admin Sign-In page is active and admin is not logged in
  if (showAdminPanel && !isAdminLoggedIn) {
    return (
      <AdminSignIn
        onSuccess={() => {
          setIsAdminLoggedIn(true);
        }}
        onCancel={() => {
          setShowAdminPanel(false);
        }}
      />
    );
  }

  // 2. If Admin is logged in and viewing the Admin Dashboard
  if (showAdminPanel && isAdminLoggedIn) {
    return (
      <AdminPanel
        onLogout={() => {
          api.clearAdminToken();
          setIsAdminLoggedIn(false);
          setShowAdminPanel(false);
        }}
        onDataChanged={fetchData}
      />
    );
  }

  // 3. If Normal User is NOT logged in -> Show Login/Welcome Screen
  if (!isUserLoggedIn) {
    return (
      <UserLoginWelcome
        onLoginSuccess={handleUserLoginSuccess}
        onOpenAdmin={() => setShowAdminPanel(true)}
        logoutMessage={logoutToastMessage}
      />
    );
  }

  // 4. Authenticated Customer View
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans w-full max-w-full overflow-x-hidden">
      
      {/* HEADER (Customer View with ☰ hamburger menu & Log Out option) */}
      <Header
        orderCount={recentOrders.length}
        onOpenMyOrders={() => setShowMyOrdersModal(true)}
        onOpenAdmin={() => setShowAdminPanel(true)}
        onOpenRedeem={() => setShowRedeemModal(true)}
        onNavigateMarketplace={() => setActiveView('REDEEM CODE')}
        onRequestLogout={() => setShowLogoutConfirm(true)}
        currentUser={currentUser}
      />

      {/* THREE-BUTTON NAVIGATION BAR [ REDEEM CODE | HOW TO REDEEM | WHY CHOOSE US ] */}
      <MainNavigation
        activeView={activeView}
        onSelectView={setActiveView}
      />

      {/* CURRENTLY SELECTED VIEW */}
      <main className="flex-1">
        {activeView === 'REDEEM CODE' && (
          <RedeemCodeView
            products={products}
            categories={categories}
            onBuyNow={prod => setSelectedProductForCheckout(prod)}
            isLoading={isLoading}
            onRedeemModalOpen={() => setShowRedeemModal(true)}
          />
        )}

        {activeView === 'HOW TO REDEEM' && (
          <HowToRedeemView />
        )}

        {activeView === 'WHY CHOOSE US' && (
          <WhyChooseUsView />
        )}
      </main>

      {/* FOOTER */}
      <Footer
        onOpenAdmin={() => setShowAdminPanel(true)}
        onOpenRedeem={() => setShowRedeemModal(true)}
        onOpenMyOrders={() => setShowMyOrdersModal(true)}
      />

      {/* --- CONFIRMATION DIALOG: USER LOG OUT --- */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <LogOut className="w-6 h-6 text-rose-600" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900">Log Out</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to log out?
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs sm:text-sm min-h-[44px] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-xs sm:text-sm min-h-[44px] shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. Checkout / Order Modal */}
      {selectedProductForCheckout && (
        <CheckoutModal
          product={selectedProductForCheckout}
          onClose={() => setSelectedProductForCheckout(null)}
          onOrderCompleted={handleOrderCompleted}
        />
      )}

      {/* 2. My Orders Portal Modal */}
      {showMyOrdersModal && (
        <MyOrdersModal
          onClose={() => setShowMyOrdersModal(false)}
          recentOrders={recentOrders}
        />
      )}

      {/* 3. Redeem Voucher Code Modal */}
      {showRedeemModal && (
        <RedeemModal
          onClose={() => setShowRedeemModal(false)}
        />
      )}

    </div>
  );
}
