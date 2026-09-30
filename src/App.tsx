import React, { useState, useEffect } from 'react';
import { Product, Category, Order, CustomerSession } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { MainNavigation, MainViewTab } from './components/MainNavigation';
import { RedeemCodeView } from './components/views/RedeemCodeView';
import { HowToRedeemView } from './components/views/HowToRedeemView';
import { WhyChooseUsView } from './components/views/WhyChooseUsView';
import { CheckoutModal } from './components/CheckoutModal';
import { MyOrdersModal } from './components/MyOrdersModal';
import { RedeemModal } from './components/RedeemModal';
import { CustomerSignInModal } from './components/CustomerSignInModal';
import { AdminSignIn } from './components/AdminSignIn';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';

export default function App() {
  const [activeView, setActiveView] = useState<MainViewTab>('REDEEM CODE');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Customer Session & Log Out State
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(() => {
    return api.getCustomerSession();
  });
  const [showCustomerSignInModal, setShowCustomerSignInModal] = useState(false);

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

  // Customer Auth Handlers
  const handleCustomerLogout = () => {
    api.customerLogout();
    setCustomerSession(null);
  };

  const handleCustomerLoginSuccess = (session: CustomerSession) => {
    api.setCustomerSession(session);
    setCustomerSession(session);
    fetchData();
  };

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
    // Refresh stock and stats
    fetchData();
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
        }}
        onDataChanged={fetchData}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans w-full max-w-full overflow-x-hidden">
      
      {/* 1. HEADER (Pure User View - With Customer Log Out / Sign In option) */}
      <Header
        orderCount={recentOrders.length}
        onOpenMyOrders={() => setShowMyOrdersModal(true)}
        onOpenAdmin={() => setShowAdminPanel(true)}
        onOpenRedeem={() => setShowRedeemModal(true)}
        onNavigateMarketplace={() => setActiveView('REDEEM CODE')}
        customerSession={customerSession}
        onCustomerLogout={handleCustomerLogout}
        onCustomerLogin={() => setShowCustomerSignInModal(true)}
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
          customerSession={customerSession}
        />
      )}

      {/* 2. My Orders Portal Modal */}
      {showMyOrdersModal && (
        <MyOrdersModal
          onClose={() => setShowMyOrdersModal(false)}
          recentOrders={recentOrders}
          customerSession={customerSession}
          onCustomerLogout={handleCustomerLogout}
          onCustomerLogin={() => setShowCustomerSignInModal(true)}
        />
      )}

      {/* 3. Redeem Voucher Code Modal */}
      {showRedeemModal && (
        <RedeemModal
          onClose={() => setShowRedeemModal(false)}
        />
      )}

      {/* 4. Customer Sign In Modal */}
      {showCustomerSignInModal && (
        <CustomerSignInModal
          onClose={() => setShowCustomerSignInModal(false)}
          onLoginSuccess={handleCustomerLoginSuccess}
        />
      )}

    </div>
  );
}
