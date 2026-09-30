import React, { useState, useEffect } from 'react';
import { Product, Category, Order, User } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { MainNavigation, MainViewTab } from './components/MainNavigation';
import { RedeemCodeView } from './components/views/RedeemCodeView';
import { HowToRedeemView } from './components/views/HowToRedeemView';
import { WhyChooseUsView } from './components/views/WhyChooseUsView';
import { CheckoutModal } from './components/CheckoutModal';
import { MyOrdersModal } from './components/MyOrdersModal';
import { RedeemModal } from './components/RedeemModal';
import { UserLoginPage } from './components/UserLoginPage';
import { signOutFromGoogle } from './services/firebaseAuth';
import { WalletModal } from './components/WalletModal';
import { DepositFlowModal } from './components/DepositFlowModal';
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return api.getCurrentUser();
  });
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
    return Boolean(api.getAdminToken());
  });

  // Modals state
  const [selectedProductForCheckout, setSelectedProductForCheckout] = useState<Product | null>(null);
  const [showMyOrdersModal, setShowMyOrdersModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch Initial Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, cRes, oRes] = await Promise.all([
        api.getProducts({ forAdmin: false }),
        api.getCategories(),
        api.getOrders()
      ]);
      setProducts(pRes);
      setCategories(cRes);
      setRecentOrders(oRes);
      
      const freshUser = api.getCurrentUser();
      setCurrentUser(freshUser);
    } catch (err) {
      console.error('Error initializing application data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Security: Sync with browser navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const userActive = api.isUserLoggedIn();
      setIsUserLoggedIn(userActive);
      setCurrentUser(api.getCurrentUser());

      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const search = window.location.search;
        if (hash === '#admin' || search.includes('admin')) {
          setShowAdminPanel(true);
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
    signOutFromGoogle();
    api.clearUserSession();
    setCurrentUser(null);
    setIsUserLoggedIn(false);

    // 2. Ensure Admin token is cleared as well
    api.clearAdminToken();
    setIsAdminLoggedIn(false);

    // 3. Close open user modals
    setShowLogoutConfirm(false);
    setShowMyOrdersModal(false);
    setShowRedeemModal(false);
    setShowWalletModal(false);
    setShowDepositModal(false);
    setSelectedProductForCheckout(null);

    // 4. Redirect to home/login view
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setShowAdminPanel(false);
  };

  // If Admin Sign-In page is active and user is not logged in
  if (showAdminPanel && !isAdminLoggedIn) {
    return (
      <AdminSignIn
        onSuccess={() => {
          setIsAdminLoggedIn(true);
        }}
        onCancel={() => {
          setShowAdminPanel(false);
          fetchData();
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
          fetchData();
          if (typeof window !== 'undefined' && window.location.hash === '#admin') {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        onDataChanged={fetchData}
      />
    );
  }

  // =========================================================================
  // AUTHENTICATION GATE: Full-screen Login Page for unauthenticated visitors
  // =========================================================================
  if (!isUserLoggedIn || !currentUser) {
    return (
      <UserLoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsUserLoggedIn(true);
          fetchData();
        }}
        onOpenAdminLogin={() => {
          setShowAdminPanel(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans w-full max-w-full overflow-x-hidden">
      
      {/* 1. HEADER (Pure User View) */}
      <Header
        orderCount={recentOrders.length}
        currentUser={currentUser}
        onOpenMyOrders={() => setShowMyOrdersModal(true)}
        onOpenAdmin={() => setShowAdminPanel(true)}
        onOpenRedeem={() => setShowRedeemModal(true)}
        onNavigateMarketplace={() => setActiveView('REDEEM CODE')}
        onOpenWallet={() => setShowWalletModal(true)}
        onOpenDeposit={() => setShowDepositModal(true)}
        onOpenUserLogin={() => {}}
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
          onOpenDeposit={() => {
            setSelectedProductForCheckout(null);
            setShowDepositModal(true);
          }}
        />
      )}

      {/* 2. My Orders Portal Modal */}
      {showMyOrdersModal && (
        <MyOrdersModal
          onClose={() => setShowMyOrdersModal(false)}
          recentOrders={recentOrders}
          customerSession={currentUser}
          onCustomerLogin={() => {}}
          onCustomerLogout={handleConfirmLogout}
        />
      )}

      {/* 3. Redeem Voucher Code Modal */}
      {showRedeemModal && (
        <RedeemModal
          onClose={() => setShowRedeemModal(false)}
        />
      )}

      {/* 4. User Wallet Modal */}
      {showWalletModal && currentUser && (
        <WalletModal
          user={currentUser}
          onClose={() => setShowWalletModal(false)}
          onOpenDeposit={() => {
            setShowWalletModal(false);
            setShowDepositModal(true);
          }}
          onRefreshData={fetchData}
        />
      )}

      {/* 5. Deposit Flow Modal */}
      {showDepositModal && currentUser && (
        <DepositFlowModal
          user={currentUser}
          onClose={() => setShowDepositModal(false)}
          onDepositSubmitted={() => {
            setShowDepositModal(false);
            fetchData();
          }}
        />
      )}

      {/* 6. User Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleConfirmLogout}
        />
      )}

    </div>
  );
}
