import React, { useState, useEffect } from 'react';
import { Product, Category, Order } from './types';
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
import { Footer } from './components/Footer';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';

export default function App() {
  const [activeView, setActiveView] = useState<MainViewTab>('REDEEM CODE');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Normal User Session State
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(() => {
    return api.isUserLoggedIn();
  });

  // Admin Auth & View State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return Boolean(api.getAdminToken());
  });

  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('admin') || window.location.hash === '#admin') return true;
    }
    // If normal user is logged out, stay on existing authentication location
    if (!api.isUserLoggedIn() && !api.getAdminToken()) {
      return true;
    }
    return Boolean(api.getAdminToken());
  });

  // Modals state
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<Product | null>(null);
  const [showMyOrdersModal, setShowMyOrdersModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    if (api.isUserLoggedIn()) {
      api.initUserSession();
    }
    fetchData();
  }, []);

  // Security: Sync with browser navigation & prevent restoring session on Back if logged out
  useEffect(() => {
    const handleLocationChange = () => {
      const userActive = api.isUserLoggedIn();
      setIsUserLoggedIn(userActive);

      if (!userActive && !api.getAdminToken()) {
        setShowAdminPanel(true);
        if (typeof window !== 'undefined' && window.location.hash !== '#admin') {
          window.history.replaceState(null, '', '#admin');
        }
      } else {
        if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          const search = window.location.search;
          if (hash === '#admin' || search.includes('admin')) {
            setShowAdminPanel(true);
          }
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // When order completed in checkout
  const handleOrderCompleted = (newOrder: Order) => {
    setRecentOrders(prev => [newOrder, ...prev]);
    // Refresh stock and stats
    fetchData();
  };

  // Normal User Confirmed Logout Flow
  const handleConfirmLogout = () => {
    // 1. Completely log out current normal user and clear session
    api.clearUserSession();
    setIsUserLoggedIn(false);

    // 2. Ensure Admin token is cleared as well
    api.clearAdminToken();
    setIsAdminLoggedIn(false);

    // 3. Close open user modals
    setShowLogoutConfirm(false);
    setShowMyOrdersModal(false);
    setShowRedeemModal(false);
    setSelectedProductForCheckout(null);

    // 4. Redirect to the EXACT SAME existing Admin Login location (#admin)
    if (typeof window !== 'undefined') {
      window.location.hash = '#admin';
      window.history.replaceState(null, '', '#admin');
    }
    setShowAdminPanel(true);
  };

  // If Admin Sign-In page is active and user is not logged in
  if (showAdminPanel && !isAdminLoggedIn) {
    return (
      <AdminSignIn
        onSuccess={() => {
          setIsAdminLoggedIn(true);
        }}
        onCancel={() => {
          api.initUserSession();
          setIsUserLoggedIn(true);
          setShowAdminPanel(false);
          if (typeof window !== 'undefined' && window.location.hash === '#admin') {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
      />
    );
  }

  // If Admin is logged in and viewing the Admin Dashboard
  if (showAdminPanel && isAdminLoggedIn) {
    return (
      <AdminPanel
        onLogout={() => {
          api.clearAdminToken();
          setIsAdminLoggedIn(false);
          setShowAdminPanel(false);
          if (typeof window !== 'undefined' && window.location.hash === '#admin') {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        onDataChanged={fetchData}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans w-full max-w-full overflow-x-hidden">
      
      {/* 1. HEADER (Pure User View - No Admin Dashboard options visible) */}
      <Header
        orderCount={recentOrders.length}
        onOpenMyOrders={() => setShowMyOrdersModal(true)}
        onOpenAdmin={() => setShowAdminPanel(true)}
        onOpenRedeem={() => setShowRedeemModal(true)}
        onNavigateMarketplace={() => setActiveView('REDEEM CODE')}
        onOpenLogoutConfirm={() => setShowLogoutConfirm(true)}
      />

      {/* 2. THREE-BUTTON NAVIGATION BAR [ REDEEM CODE | HOW TO REDEEM | WHY CHOOSE US ] */}
      <MainNavigation
        activeView={activeView}
        onSelectView={setActiveView}
      />

      {/* 3. ONLY THE CURRENTLY SELECTED VIEW */}
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

      {/* 4. FOOTER */}
      <Footer
        onOpenAdmin={() => setShowAdminPanel(true)}
        onOpenRedeem={() => setShowRedeemModal(true)}
        onOpenMyOrders={() => setShowMyOrdersModal(true)}
      />

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

      {/* 4. User Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleConfirmLogout}
        />
      )}

    </div>
  );
}
