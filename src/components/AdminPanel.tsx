import React, { useState, useEffect, useRef } from 'react';
import { api, parseNumeric } from '../services/api';
import {
  Category, Denomination, RedeemCodeItem, Product, Order,
  DashboardStats, MarketplaceSettings, CodeStatus,
  User, DepositAmount, DepositRequest, WalletTransaction
} from '../types';
import { Header } from './Header';
import { MainNavigation, MainViewTab } from './MainNavigation';
import { HowToRedeemView } from './views/HowToRedeemView';
import { WhyChooseUsView } from './views/WhyChooseUsView';
import { Marketplace } from './Marketplace';
import { Footer } from './Footer';

import {
  LayoutDashboard, Users, CreditCard, Wallet, QrCode,
  FolderTree, Layers, KeyRound, ShoppingBag, Package,
  Settings, LogOut, Plus, Search, Edit, Trash2, Eye,
  Upload, RefreshCw, X, Menu, Monitor, ChevronRight,
  CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft,
  ShieldCheck, XCircle, Clock, Check, Copy, ExternalLink
} from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
  onDataChanged: () => void;
  logoUrl?: string;
  onSettingsUpdated?: (settings: MarketplaceSettings) => void;
}

type AdminTab =
  | 'dashboard'
  | 'users'
  | 'deposits'
  | 'wallets'
  | 'depositAmounts'
  | 'products'
  | 'categories'
  | 'denominations'
  | 'codes'
  | 'orders'
  | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, onDataChanged, logoUrl, onSettingsUpdated }) => {
  // Mode switcher: ADMIN PANEL vs USER PREVIEW
  const [viewMode, setViewMode] = useState<'ADMIN' | 'USER_PREVIEW'>('ADMIN');
  const [previewSubTab, setPreviewSubTab] = useState<MainViewTab>('REDEEM CODE');
  const [adminLogoFailed, setAdminLogoFailed] = useState(false);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Data states
  const [settings, setSettings] = useState<MarketplaceSettings | null>(null);

  // Logo Upload & URL Validation States
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoInputUrl, setLogoInputUrl] = useState<string>('');
  const [urlValidationError, setUrlValidationError] = useState<string | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState<boolean>(false);

  useEffect(() => {
    setAdminLogoFailed(false);
  }, [logoUrl]);

  useEffect(() => {
    if (settings?.logoUrl !== undefined) {
      setLogoInputUrl(settings.logoUrl || '');
    }
  }, [settings?.logoUrl]);

  // Apply Logo URL (Validation)
  const handleApplyLogoUrl = () => {
    setUrlValidationError(null);
    const cleanUrl = logoInputUrl.trim();
    if (!cleanUrl) {
      setSettings(prev => prev ? { ...prev, logoUrl: '' } : prev);
      setLogoPreviewError(false);
      showToast('success', 'Logo URL cleared. Using default CV badge.');
      return;
    }

    setIsValidatingUrl(true);
    const img = new Image();
    img.onload = () => {
      setIsValidatingUrl(false);
      setLogoPreviewError(false);
      setUrlValidationError(null);
      setSettings(prev => prev ? { ...prev, logoUrl: cleanUrl } : prev);
      showToast('success', 'Logo URL verified & applied to preview!');
    };
    img.onerror = () => {
      setIsValidatingUrl(false);
      setUrlValidationError('Failed to load image from URL. Please ensure URL is accessible and points to a valid image.');
      showToast('error', 'Invalid logo image URL.');
    };
    img.src = cleanUrl;
  };

  // Upload Logo from Device (Base64 file reader)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File size exceeds 5MB limit.');
      return;
    }

    setUrlValidationError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        setLogoInputUrl(base64Data);
        setLogoPreviewError(false);
        setSettings(prev => prev ? { ...prev, logoUrl: base64Data } : prev);
        showToast('success', 'Image uploaded! Click "SAVE LOGO" to commit changes globally.');
      }
    };
    reader.onerror = () => {
      showToast('error', 'Error reading image file.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Reset to Default Logo
  const handleResetLogo = () => {
    setLogoInputUrl('');
    setLogoPreviewError(false);
    setUrlValidationError(null);
    setSettings(prev => prev ? { ...prev, logoUrl: '' } : prev);
    showToast('success', 'Logo reset to default CV badge.');
  };

  // Sidebar Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [depositAmounts, setDepositAmounts] = useState<DepositAmount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCodeItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // User Detail Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTransactions, setUserTransactions] = useState<WalletTransaction[]>([]);
  const [userDepositsList, setUserDepositsList] = useState<DepositRequest[]>([]);
  const [showWalletAdjustModal, setShowWalletAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState('');

  // Deposit Amount & QR Modal State
  const [showDepositAmountModal, setShowDepositAmountModal] = useState(false);
  const [editingDepositAmount, setEditingDepositAmount] = useState<DepositAmount | null>(null);
  const [depAmountVal, setDepAmountVal] = useState('500');
  const [depQrUrlVal, setDepQrUrlVal] = useState('');
  const [depUpiIdVal, setDepUpiIdVal] = useState('codevault.pay@okaxis');
  const [depReceiverVal, setDepReceiverVal] = useState('CodeVault Official');
  const [depEnabledVal, setDepEnabledVal] = useState(true);
  const [depOrderVal, setDepOrderVal] = useState('1');

  // Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catIconInput, setCatIconInput] = useState('');

  // Denomination Modal
  const [showDenomModal, setShowDenomModal] = useState(false);
  const [editingDenom, setEditingDenom] = useState<Denomination | null>(null);
  const [denomCategory, setDenomCategory] = useState('GOOGLE PLAY');
  const [denomValue, setDenomValue] = useState('500');

  // Product Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodNameInput, setProdNameInput] = useState('Google Play Recharge Code');
  const [prodCategoryInput, setProdCategoryInput] = useState('GOOGLE PLAY');
  const [prodDenomInput, setProdDenomInput] = useState('200');
  const [prodPriceInput, setProdPriceInput] = useState('3000');
  const [prodBalanceInput, setProdBalanceInput] = useState('3000');
  const [prodEnabledInput, setProdEnabledInput] = useState(true);

  // Redeem Code Modal
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [editingCode, setEditingCode] = useState<RedeemCodeItem | null>(null);
  const [codeCategory, setCodeCategory] = useState('GOOGLE PLAY');
  const [codeDenom, setCodeDenom] = useState('500');
  const [codeString, setCodeString] = useState('');
  const [codePrice, setCodePrice] = useState('450');
  const [codeBalance, setCodeBalance] = useState('500');
  const [codeStatus, setCodeStatus] = useState<CodeStatus>('Available');
  const [codeNote, setCodeNote] = useState('');

  // Bulk Import state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState<{ imported: number; failed: number; errors: string[] } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [depositFilter, setDepositFilter] = useState<string>('ALL');

  // Selected Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Delete Confirmations
  const [codeToDelete, setCodeToDelete] = useState<RedeemCodeItem | null>(null);
  const [isDeletingCode, setIsDeletingCode] = useState(false);

  // Toast Notifications
  const [toast, setToast] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: `toast-${Date.now()}`, type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [sRes, uRes, depRes, depAmtRes, cRes, dRes, rcRes, pRes, uPRes, oRes, setRes] = await Promise.all([
        api.getDashboardStats(),
        api.getAllUsers(),
        api.getDepositRequests(),
        api.getDepositAmounts({ forAdmin: true }),
        api.getCategories(),
        api.getDenominations(),
        api.getRedeemCodes(),
        api.getProducts({ forAdmin: true }),
        api.getProducts({ forAdmin: false }),
        api.getOrders(),
        api.getSettings()
      ]);
      setStats(sRes);
      setUsers(uRes);
      setDeposits(depRes);
      setDepositAmounts(depAmtRes);
      setCategories(cRes);
      setDenominations(dRes);
      setRedeemCodes(rcRes);
      setProducts(pRes);
      setUserProducts(uPRes);
      setOrders(oRes);
      if (setRes) setSettings(setRes);
    } catch (err) {
      console.error('Error loading admin dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Deposit Actions ---
  const handleApproveDeposit = async (depositId: string) => {
    try {
      await api.approveDeposit(depositId, 'Admin');
      await loadAdminData();
      onDataChanged();
      showToast('success', 'Deposit approved! User wallet credited.');
    } catch (err: any) {
      console.error('Failed to approve deposit', err);
      showToast('error', err?.message || 'Failed to approve deposit.');
    }
  };

  const handleRejectDeposit = async (depositId: string) => {
    try {
      await api.rejectDeposit(depositId, 'Rejected by Admin');
      await loadAdminData();
      onDataChanged();
      showToast('success', 'Deposit request marked as rejected.');
    } catch (err: any) {
      console.error('Failed to reject deposit', err);
      showToast('error', err?.message || 'Failed to reject deposit.');
    }
  };

  // --- Deposit Amount & QR Actions ---
  const handleSaveDepositAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseNumeric(depAmountVal);
    if (numAmt <= 0) return;
    try {
      if (editingDepositAmount) {
        await api.updateDepositAmount(editingDepositAmount.id, {
          amount: numAmt,
          qrUrl: depQrUrlVal.trim(),
          upiId: depUpiIdVal.trim(),
          receiverName: depReceiverVal.trim(),
          enabled: depEnabledVal,
          displayOrder: parseNumeric(depOrderVal)
        });
        showToast('success', 'Deposit amount & QR updated successfully.');
      } else {
        await api.createDepositAmount({
          amount: numAmt,
          qrUrl: depQrUrlVal.trim(),
          upiId: depUpiIdVal.trim(),
          receiverName: depReceiverVal.trim(),
          enabled: depEnabledVal,
          displayOrder: parseNumeric(depOrderVal)
        });
        showToast('success', 'New deposit amount & QR added successfully.');
      }
      setShowDepositAmountModal(false);
      setEditingDepositAmount(null);
      await loadAdminData();
      onDataChanged();
    } catch (err: any) {
      console.error('Failed to save deposit amount', err);
      showToast('error', 'Failed to save deposit amount.');
    }
  };

  const handleDeleteDepositAmount = async (id: string) => {
    if (confirm('Delete this deposit amount configuration?')) {
      await api.deleteDepositAmount(id);
      await loadAdminData();
      onDataChanged();
      showToast('success', 'Deposit amount removed.');
    }
  };

  const handleToggleDepositAmount = async (amt: DepositAmount) => {
    await api.updateDepositAmount(amt.id, { enabled: !amt.enabled });
    await loadAdminData();
    onDataChanged();
  };

  // --- User Profile Drawer & Manual Wallet Adjust ---
  const handleOpenUserDetail = async (user: User) => {
    setSelectedUser(user);
    try {
      const walletData = await api.getWalletData(user.id);
      setUserTransactions(walletData.transactions);
      setUserDepositsList(walletData.deposits);
    } catch (err) {
      console.error('Failed to load user detail', err);
    }
  };

  const handleSaveWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !adjustAmount) return;
    try {
      await api.adjustUserWallet(selectedUser.id, parseNumeric(adjustAmount), adjustType, adjustReason);
      setShowWalletAdjustModal(false);
      setAdjustAmount('');
      setAdjustReason('');
      await loadAdminData();
      // reload user modal data
      handleOpenUserDetail(selectedUser);
      onDataChanged();
      showToast('success', `Wallet balance updated (${adjustType} ₹${adjustAmount}).`);
    } catch (err: any) {
      showToast('error', 'Failed to adjust wallet balance.');
    }
  };

  // --- Product & Denomination Edit ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await api.updateProduct(editingProduct.id, {
        name: prodNameInput.trim() || 'Google Play Recharge Code',
        category: prodCategoryInput.trim().toUpperCase(),
        denomination: parseNumeric(prodDenomInput),
        price: parseNumeric(prodPriceInput),
        balance: parseNumeric(prodBalanceInput),
        enabled: prodEnabledInput
      });
      setShowProductModal(false);
      setEditingProduct(null);
      await loadAdminData();
      onDataChanged();
      showToast('success', 'Product updated successfully.');
    } catch (err) {
      showToast('error', 'Failed to update product. Please try again.');
    }
  };

  // --- Categories & Denominations ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;
    if (editingCat) {
      await api.updateCategory(editingCat.id, {
        name: catNameInput.toUpperCase().trim(),
        iconUrl: catIconInput
      });
    } else {
      await api.createCategory({
        name: catNameInput.toUpperCase().trim(),
        iconUrl: catIconInput,
        enabled: true
      });
    }
    setShowCatModal(false);
    setEditingCat(null);
    setCatNameInput('');
    setCatIconInput('');
    await loadAdminData();
    onDataChanged();
    showToast('success', 'Category saved successfully.');
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category?')) {
      await api.deleteCategory(id);
      await loadAdminData();
      onDataChanged();
      showToast('success', 'Category deleted.');
    }
  };

  const handleSaveDenomination = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseNumeric(denomValue);
    if (val <= 0) return;
    if (editingDenom) {
      await api.updateDenomination(editingDenom.id, {
        categoryName: denomCategory,
        value: val,
        label: `₹${val}`
      });
    } else {
      await api.createDenomination({
        categoryName: denomCategory,
        value: val,
        label: `₹${val}`,
        enabled: true
      });
    }
    setShowDenomModal(false);
    setEditingDenom(null);
    await loadAdminData();
    onDataChanged();
    showToast('success', 'Denomination saved.');
  };

  const handleDeleteDenom = async (id: string) => {
    if (confirm('Delete this denomination?')) {
      await api.deleteDenomination(id);
      await loadAdminData();
      onDataChanged();
    }
  };

  // --- Redeem Codes ---
  const handleSaveRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeString.trim()) return;
    try {
      if (editingCode) {
        await api.updateRedeemCode(editingCode.id, {
          code: codeString.toUpperCase().trim(),
          category: codeCategory,
          denomination: parseNumeric(codeDenom),
          price: parseNumeric(codePrice),
          balance: parseNumeric(codeBalance),
          status: codeStatus,
          note: codeNote
        });
        showToast('success', 'Redeem code updated successfully.');
      } else {
        await api.createRedeemCode({
          code: codeString.toUpperCase().trim(),
          category: codeCategory,
          denomination: parseNumeric(codeDenom),
          price: parseNumeric(codePrice),
          balance: parseNumeric(codeBalance),
          status: codeStatus,
          note: codeNote
        });
        showToast('success', 'Redeem code added successfully.');
      }
      setShowCodeModal(false);
      setEditingCode(null);
      setCodeString('');
      setCodeNote('');
      await loadAdminData();
      onDataChanged();
    } catch (err: any) {
      showToast('error', 'Failed to save redeem code.');
    }
  };

  const handleConfirmDeleteCode = async () => {
    if (!codeToDelete) return;
    setIsDeletingCode(true);
    try {
      await api.deleteRedeemCode(codeToDelete.id);
      setCodeToDelete(null);
      await loadAdminData();
      onDataChanged();
      showToast('success', 'Redeem code deleted.');
    } catch (err) {
      showToast('error', 'Failed to delete code.');
    } finally {
      setIsDeletingCode(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.bulkImportRedeemCodes(bulkText);
      setBulkResult({ imported: res.imported, failed: res.failed, errors: res.errors || [] });
      if (res.imported > 0) {
        setBulkText('');
        setShowBulkModal(false);
        await loadAdminData();
        onDataChanged();
        if (res.failed > 0) {
          showToast('success', `${res.imported} codes imported successfully. ${res.failed} failed.`);
        } else {
          showToast('success', `${res.imported} codes imported successfully.`);
        }
      } else {
        showToast('error', `Failed to import codes. ${res.errors?.[0] || 'Verify code format.'}`);
      }
    } catch (err) {
      showToast('error', 'Failed to process bulk import.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Settings ---
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;
    setIsSavingSettings(true);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      showToast('success', 'Platform settings & brand logo saved successfully.');
      await loadAdminData();
      onDataChanged();
      if (onSettingsUpdated) onSettingsUpdated(updated);
    } catch (err) {
      showToast('error', 'Failed to save settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
  });

  const filteredDeposits = deposits.filter(d => {
    if (depositFilter !== 'ALL' && d.status !== depositFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return d.userName.toLowerCase().includes(q) || d.userEmail.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || (d.utrNumber && d.utrNumber.toLowerCase().includes(q));
    }
    return true;
  });

  const filteredCodes = redeemCodes.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.code.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.denomination.toString().includes(q);
    }
    return true;
  });

  const filteredProducts = products.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.denomination && p.denomination.toString().includes(q));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-extrabold flex items-center gap-2 animate-fadeIn ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ADMIN HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5">
            {logoUrl && !adminLogoFailed ? (
              <img
                src={logoUrl}
                alt="CodeVault Logo"
                onError={() => setAdminLogoFailed(true)}
                className="w-9 h-9 rounded-xl object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-sm">
                CV
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base leading-none">CodeVault</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  Admin Pro
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Management & Verification Dashboard</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin vs User Storefront Preview Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl hidden sm:flex items-center text-xs font-bold">
            <button
              onClick={() => setViewMode('ADMIN')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'ADMIN' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ADMIN DASHBOARD
            </button>
            <button
              onClick={() => setViewMode('USER_PREVIEW')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'USER_PREVIEW' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>LIVE USER STORE</span>
            </button>
          </div>

          <button
            onClick={onLogout}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-rose-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* VIEW 1: ADMIN CONTROL CENTER */}
      {viewMode === 'ADMIN' && (
        <div className="flex-1 flex flex-col md:flex-row max-w-full">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 space-y-1 transform transition-transform duration-200 md:relative md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 md:hidden">
              <span className="font-extrabold text-xs text-slate-400 uppercase">Navigation</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-0.5 text-xs font-bold">
              {[
                { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
                { id: 'users', label: 'Registered Users', icon: Users, badge: users.length },
                { id: 'deposits', label: 'Deposit Requests', icon: CreditCard, badge: deposits.filter(d => d.status === 'PENDING').length, badgeColor: 'bg-amber-100 text-amber-800' },
                { id: 'wallets', label: 'User Wallets', icon: Wallet },
                { id: 'depositAmounts', label: 'Deposit Amounts & QR', icon: QrCode },
                { id: 'products', label: 'Products & Pricing', icon: Package },
                { id: 'categories', label: 'Categories', icon: FolderTree },
                { id: 'denominations', label: 'Denominations', icon: Layers },
                { id: 'codes', label: 'Redeem Codes (Stock)', icon: KeyRound, badge: stats?.availableCodes },
                { id: 'orders', label: 'Orders & Sales', icon: ShoppingBag, badge: orders.length },
                { id: 'settings', label: 'Admin Settings', icon: Settings }
              ].map(item => {
                const IconC = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as AdminTab);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconC className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-white/20 text-white' : (item.badgeColor || 'bg-slate-100 text-slate-700')
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
            
            {/* 1. DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">CodeVault Overview</h2>
                  <p className="text-xs font-semibold text-slate-500">Real-time system, user wallet, and deposit analytics</p>
                </div>

                {/* 6 Primary Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  
                  {/* TOTAL USERS */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">TOTAL USERS</span>
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-slate-900">{stats?.totalUsers || users.length}</div>
                    <p className="text-[10px] text-emerald-600 font-bold">Google Authenticated Accounts</p>
                  </div>

                  {/* TOTAL DEPOSIT REQUESTS */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">TOTAL DEPOSITS</span>
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-slate-900">{stats?.totalDepositRequests || deposits.length}</div>
                    <p className="text-[10px] text-slate-500 font-bold">All Time UPI Inward Requests</p>
                  </div>

                  {/* PENDING DEPOSITS */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">PENDING DEPOSITS</span>
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-amber-600">
                      {deposits.filter(d => d.status === 'PENDING').length}
                    </div>
                    <button
                      onClick={() => setActiveTab('deposits')}
                      className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Review In Queue &rarr;</span>
                    </button>
                  </div>

                  {/* APPROVED DEPOSITS */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">APPROVED DEPOSITS</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-600">
                      {deposits.filter(d => d.status === 'APPROVED').length}
                    </div>
                    <p className="text-[10px] text-emerald-600 font-bold">Successfully Verified</p>
                  </div>

                  {/* TOTAL WALLET BALANCE */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">TOTAL WALLET BALANCE</span>
                      <Wallet className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-slate-900">
                      ₹{users.reduce((sum, u) => sum + (u.walletBalance || 0), 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold">User Balances in Circulation</p>
                  </div>

                  {/* TOTAL DEPOSIT VALUE */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">TOTAL DEPOSIT VALUE</span>
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-slate-900">
                      ₹{deposits.filter(d => d.status === 'APPROVED').reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold">Total Inflow Collected</p>
                  </div>

                </div>

                {/* Secondary Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Available Codes</span>
                    <div className="text-lg font-mono font-black text-emerald-600">{stats?.availableCodes} In Stock</div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Sold Codes</span>
                    <div className="text-lg font-mono font-black text-blue-600">{stats?.soldCodes} Delivered</div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Orders</span>
                    <div className="text-lg font-mono font-black text-slate-900">{orders.length}</div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Voucher Sales</span>
                    <div className="text-lg font-mono font-black text-slate-900">₹{stats?.totalSales.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Quick Pending Deposits Section */}
                {deposits.filter(d => d.status === 'PENDING').length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Pending Deposit Requests ({deposits.filter(d => d.status === 'PENDING').length})</h3>
                      </div>
                      <button onClick={() => setActiveTab('deposits')} className="text-xs text-blue-600 font-bold hover:underline">
                        View All
                      </button>
                    </div>

                    <div className="space-y-2">
                      {deposits.filter(d => d.status === 'PENDING').slice(0, 3).map(dep => (
                        <div key={dep.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{dep.userName}</span>
                            <span className="text-slate-400 text-[11px] block">{dep.userEmail} • ID: {dep.id}</span>
                            {dep.utrNumber && <span className="text-[10px] font-mono text-blue-600 font-bold">UTR: {dep.utrNumber}</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-base text-emerald-600">₹{dep.amount}</span>
                            <button
                              onClick={() => handleApproveDeposit(dep.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                            >
                              APPROVE
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(dep.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200"
                            >
                              REJECT
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 2. USER MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Registered Users</h3>
                    <p className="text-xs text-slate-500">All Google-authenticated user accounts and wallet profiles</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search name, email, user ID..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-3">User Profile</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Google ID</th>
                          <th className="p-3">Wallet Balance</th>
                          <th className="p-3">Total Deposits</th>
                          <th className="p-3">Joined Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/80">
                            <td className="p-3 flex items-center gap-2.5">
                              <img src={u.profileImage} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                              <span className="font-extrabold text-slate-900">{u.name}</span>
                            </td>
                            <td className="p-3 font-mono text-slate-600">{u.email}</td>
                            <td className="p-3 font-mono text-slate-400 text-[11px] truncate max-w-[120px]">{u.googleId}</td>
                            <td className="p-3 font-mono font-black text-emerald-600 text-sm">₹{u.walletBalance || 0}</td>
                            <td className="p-3 font-mono font-bold text-slate-800">₹{u.totalDeposits || 0}</td>
                            <td className="p-3 text-slate-400 text-[11px]">{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                {u.status || 'Active'}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleOpenUserDetail(u)}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Profile & Wallet</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. DEPOSIT REQUESTS MANAGEMENT */}
            {activeTab === 'deposits' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Deposit Requests</h3>
                    <p className="text-xs text-slate-500">Verify and approve user UPI inward wallet deposits</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={depositFilter}
                      onChange={e => setDepositFilter(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="ALL">Status: All</option>
                      <option value="PENDING">Pending Only</option>
                      <option value="APPROVED">Approved Only</option>
                      <option value="REJECTED">Rejected Only</option>
                    </select>

                    <div className="relative w-48">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search deposits..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Request ID</th>
                          <th className="p-3">User & Email</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">UTR Reference</th>
                          <th className="p-3">Date / Time</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold">
                        {filteredDeposits.map(d => (
                          <tr key={d.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-mono font-bold text-slate-900">{d.id}</td>
                            <td className="p-3">
                              <span className="font-extrabold text-slate-900 block">{d.userName}</span>
                              <span className="text-slate-400 text-[11px]">{d.userEmail}</span>
                            </td>
                            <td className="p-3 font-mono font-black text-sm text-emerald-600">₹{d.amount}</td>
                            <td className="p-3 font-mono text-blue-600 text-xs">{d.utrNumber || '—'}</td>
                            <td className="p-3 text-slate-500 text-[11px]">{new Date(d.createdAt).toLocaleString()}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                d.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : d.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="p-3">
                              {d.status === 'PENDING' ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleApproveDeposit(d.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px]"
                                  >
                                    APPROVE
                                  </button>
                                  <button
                                    onClick={() => handleRejectDeposit(d.id)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 text-[10px]"
                                  >
                                    REJECT
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-semibold">
                                  {d.status === 'APPROVED' ? `Credited (${d.approvedBy || 'Admin'})` : 'Closed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. WALLETS MANAGEMENT */}
            {activeTab === 'wallets' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">User Wallets</h3>
                    <p className="text-xs text-slate-500">View user balances and execute authorized credit/debit adjustments</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {users.map(u => (
                    <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-3">
                        <img src={u.profileImage} alt={u.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">{u.name}</h4>
                          <p className="text-[11px] text-slate-400 font-semibold truncate">{u.email}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Balance:</span>
                        <span className="font-mono font-black text-base text-emerald-600">₹{(u.walletBalance || 0).toFixed(2)}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleOpenUserDetail(u)}
                          className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl"
                        >
                          View Transactions
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowWalletAdjustModal(true);
                          }}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
                        >
                          Adjust
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. DEPOSIT AMOUNTS & QR MANAGEMENT */}
            {activeTab === 'depositAmounts' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Deposit Amounts & QR Codes</h3>
                    <p className="text-xs text-slate-500">Configure deposit buttons and assign specific UPI QR images</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingDepositAmount(null);
                      setDepAmountVal('500');
                      setDepQrUrlVal(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=codevault.pay@okaxis&pn=CodeVault%20Official&am=500&cu=INR`);
                      setDepUpiIdVal('codevault.pay@okaxis');
                      setDepReceiverVal('CodeVault Official (₹500)');
                      setDepEnabledVal(true);
                      setDepOrderVal((depositAmounts.length + 1).toString());
                      setShowDepositAmountModal(true);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ ADD AMOUNT</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {depositAmounts.map(amt => (
                    <div key={amt.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xl text-slate-900">₹{amt.amount}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          amt.enabled !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {amt.enabled !== false ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      {/* QR Preview */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center space-y-2">
                        <img
                          src={amt.qrUrl}
                          alt={`QR for ₹${amt.amount}`}
                          className="w-28 h-28 object-contain mx-auto rounded-lg bg-white p-1 border"
                          onError={e => {
                            (e.target as HTMLElement).classList.add('hidden');
                          }}
                        />
                        <div className="text-left text-[11px] font-semibold text-slate-600 truncate">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">UPI ID</span>
                          <span className="font-mono text-slate-800 truncate block">{amt.upiId || 'codevault.pay@okaxis'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setEditingDepositAmount(amt);
                            setDepAmountVal(amt.amount.toString());
                            setDepQrUrlVal(amt.qrUrl);
                            setDepUpiIdVal(amt.upiId || 'codevault.pay@okaxis');
                            setDepReceiverVal(amt.receiverName || `CodeVault Official (₹${amt.amount})`);
                            setDepEnabledVal(amt.enabled !== false);
                            setDepOrderVal((amt.displayOrder || 1).toString());
                            setShowDepositAmountModal(true);
                          }}
                          className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleToggleDepositAmount(amt)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold ${
                            amt.enabled !== false ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {amt.enabled !== false ? 'Disable' : 'Enable'}
                        </button>

                        <button
                          onClick={() => handleDeleteDepositAmount(amt.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. PRODUCTS MANAGEMENT */}
            {activeTab === 'products' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden w-full">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Product Title</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Denomination</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Balance</th>
                          <th className="p-3">Availability / Stock</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold">
                        {filteredProducts.map(p => {
                          const isOutOfStock = (p.stock || 0) === 0;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/80">
                              <td className="p-3 font-extrabold text-slate-900">{p.name}</td>
                              <td className="p-3 font-bold text-blue-600">{p.category}</td>
                              <td className="p-3 font-mono font-extrabold text-slate-700">₹{p.denomination || p.price}</td>
                              <td className="p-3 font-mono font-extrabold text-slate-900">₹{p.price}</td>
                              <td className="p-3 font-mono font-extrabold text-emerald-600">₹{p.balance}</td>
                              <td className="p-3">
                                {!isOutOfStock ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {p.stock} Available
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                                    OUT OF STOCK
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  p.enabled !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-300'
                                }`}>
                                  {p.enabled !== false ? 'Live' : 'Disabled'}
                                </span>
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setProdNameInput(p.name || 'Google Play Recharge Code');
                                    setProdCategoryInput(p.category || 'GOOGLE PLAY');
                                    setProdDenomInput((p.denomination || p.price || 500).toString());
                                    setProdPriceInput((p.price || 500).toString());
                                    setProdBalanceInput((p.balance || p.price || 500).toString());
                                    setProdEnabledInput(p.enabled !== false);
                                    setShowProductModal(true);
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded min-w-[32px] min-h-[32px] flex items-center justify-center transition-colors"
                                  title="Edit Product"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 7. CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900">Categories</h3>
                  <button
                    onClick={() => {
                      setEditingCat(null);
                      setCatNameInput('');
                      setCatIconInput('');
                      setShowCatModal(true);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map(c => (
                    <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        {c.iconUrl ? (
                          <img src={c.iconUrl} alt={c.name} className="w-8 h-8 rounded-lg object-contain" />
                        ) : (
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                            {c.name.slice(0, 2)}
                          </div>
                        )}
                        <span className="font-extrabold text-sm text-slate-900">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCat(c);
                            setCatNameInput(c.name);
                            setCatIconInput(c.iconUrl || '');
                            setShowCatModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. DENOMINATIONS */}
            {activeTab === 'denominations' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900">Denominations</h3>
                  <button
                    onClick={() => {
                      setEditingDenom(null);
                      setDenomValue('500');
                      setShowDenomModal(true);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Denomination</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {denominations.map(d => (
                    <div key={d.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-extrabold text-blue-600 uppercase block">{d.categoryName}</span>
                        <span className="text-lg font-mono font-black text-slate-900">{d.label}</span>
                      </div>
                      <button onClick={() => handleDeleteDenom(d.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. REDEEM CODES (STOCK & BULK IMPORT) */}
            {activeTab === 'codes' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search redeem codes..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="ALL">All Status</option>
                      <option value="Available">Available</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBulkModal(true)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>Bulk Import</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingCode(null);
                        setCodeString('');
                        setCodePrice('450');
                        setCodeBalance('500');
                        setShowCodeModal(true);
                      }}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Code</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Category</th>
                          <th className="p-3">Denom</th>
                          <th className="p-3">Redeem Code</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Balance</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold">
                        {filteredCodes.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-bold text-blue-600">{c.category}</td>
                            <td className="p-3 font-mono font-bold">₹{c.denomination}</td>
                            <td className="p-3 font-mono font-black text-slate-900 tracking-wider">{c.code}</td>
                            <td className="p-3 font-mono font-bold">₹{c.price}</td>
                            <td className="p-3 font-mono font-bold text-emerald-600">₹{c.balance}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                c.status === 'Available' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-3 flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingCode(c);
                                  setCodeCategory(c.category);
                                  setCodeDenom(c.denomination.toString());
                                  setCodeString(c.code);
                                  setCodePrice(c.price.toString());
                                  setCodeBalance(c.balance.toString());
                                  setCodeStatus(c.status);
                                  setCodeNote(c.note || '');
                                  setShowCodeModal(true);
                                }}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setCodeToDelete(c)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 10. ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900">Orders & Sales</h3>
                  <span className="text-xs font-bold text-slate-500">Total: {orders.length} orders</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[650px]">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Payment Method</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold">
                        {orders.map(o => (
                          <tr key={o.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-mono font-bold text-slate-900">{o.id}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">{o.customerName}</span>
                              <span className="text-slate-400 text-[11px]">{o.customerEmail}</span>
                            </td>
                            <td className="p-3 font-mono font-black text-emerald-600">₹{o.totalAmount}</td>
                            <td className="p-3 text-slate-700">{o.paymentMethod}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                {o.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 text-[11px]">{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td className="p-3">
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 11. SETTINGS */}
            {activeTab === 'settings' && settings && (
              <div className="space-y-6 animate-fadeIn max-w-2xl">
                
                {/* BRANDING / LOGO SETTINGS CARD */}
                <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 uppercase tracking-wide">
                        BRANDING / LOGO SETTINGS
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Customize the website header icon, login page logo & footer across CodeVault
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase shrink-0">
                      Global Branding
                    </span>
                  </div>

                  {/* 1. Header Live Preview Mockup */}
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Header Live Preview Mockup
                    </label>
                    <div className="p-4 bg-slate-900/95 rounded-2xl border border-slate-800 text-white shadow-inner">
                      <div className="flex items-center justify-between">
                        {/* Logo + Title Combo */}
                        <div className="flex items-center gap-2.5">
                          {settings.logoUrl && !logoPreviewError ? (
                            <img
                              src={settings.logoUrl}
                              alt="Brand Logo"
                              onError={() => setLogoPreviewError(true)}
                              className="w-9 h-9 rounded-xl object-contain bg-slate-50 border border-slate-200/80 p-0.5 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0 tracking-tighter">
                              CV
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-display font-black text-lg tracking-tight text-white leading-none">
                              <span className="text-blue-500">C</span>ode <span className="text-blue-500">V</span>ault
                            </span>
                            <span className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400 leading-none mt-1">
                              PREPAID PLATFORM
                            </span>
                          </div>
                        </div>

                        {/* Sample Header Badge */}
                        <div className="px-3 py-1.5 bg-blue-600 rounded-xl text-xs font-black text-white hidden sm:block">
                          MY ORDERS
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      This live mockup displays exactly how your logo appears next to the CodeVault title in the header.
                    </p>
                  </div>

                  {/* 2. Logo Source Input Options */}
                  <div className="space-y-4 pt-1">
                    
                    {/* Option A: Logo URL Field + Apply Button */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        Option A: Enter Image URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/logo.png"
                          value={logoInputUrl}
                          onChange={e => {
                            setLogoInputUrl(e.target.value);
                            setUrlValidationError(null);
                          }}
                          className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleApplyLogoUrl}
                          disabled={isValidatingUrl}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                        >
                          {isValidatingUrl ? 'Testing...' : 'Apply Logo'}
                        </button>
                      </div>
                      {urlValidationError && (
                        <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{urlValidationError}</span>
                        </p>
                      )}
                    </div>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">OR</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {/* Option B: Device File Upload */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                        Option B: Upload Image File from Device
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 px-4 bg-blue-50/80 hover:bg-blue-100 border-2 border-dashed border-blue-300 rounded-2xl text-blue-700 font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer group"
                      >
                        <Upload className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                        <span>Upload File from Device (PNG, JPG, SVG, WebP)</span>
                      </button>
                    </div>

                  </div>

                  {/* 3. Action Buttons (Save Logo & Reset) */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-extrabold text-xs rounded-xl border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                    >
                      Reset to Default Logo
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveSettings()}
                      disabled={isSavingSettings}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{isSavingSettings ? 'Saving Logo...' : 'SAVE LOGO'}</span>
                    </button>
                  </div>

                </div>

                {/* PLATFORM SETTINGS */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider">PLATFORM SETTINGS</h3>
                  <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs font-semibold">
                    <div>
                      <label className="block text-slate-600 mb-1">Platform Title</label>
                      <input
                        type="text"
                        value={settings.title}
                        onChange={e => setSettings({ ...settings, title: e.target.value })}
                        className="w-full p-2.5 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">Description / Tagline</label>
                      <input
                        type="text"
                        value={settings.description}
                        onChange={e => setSettings({ ...settings, description: e.target.value })}
                        className="w-full p-2.5 border rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1">Default UPI ID</label>
                        <input
                          type="text"
                          value={settings.defaultUpiId || 'codevault.pay@okaxis'}
                          onChange={e => setSettings({ ...settings, defaultUpiId: e.target.value })}
                          className="w-full p-2.5 border rounded-xl font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Receiver Name</label>
                        <input
                          type="text"
                          value={settings.defaultUpiName || 'CodeVault Official Payment'}
                          onChange={e => setSettings({ ...settings, defaultUpiName: e.target.value })}
                          className="w-full p-2.5 border rounded-xl"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs"
                    >
                      {isSavingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </form>
                </div>

              </div>
            )}

          </main>
        </div>
      )}

      {/* VIEW 2: USER PREVIEW MODE */}
      {viewMode === 'USER_PREVIEW' && (
        <div className="flex-1 flex flex-col bg-white">
          <div className="bg-blue-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
            <span>Live User Storefront Simulation</span>
            <button
              onClick={() => setViewMode('ADMIN')}
              className="bg-white text-blue-700 px-3 py-1 rounded-lg text-xs font-extrabold"
            >
              Back to Admin Panel &rarr;
            </button>
          </div>

          <Header
            logoUrl={settings?.logoUrl || logoUrl}
            orderCount={orders.length}
            currentUser={users[0] || null}
            onOpenMyOrders={() => alert('Orders opened in preview')}
            onOpenAdmin={() => setViewMode('ADMIN')}
            onOpenRedeem={() => alert('Redeem code modal')}
            onNavigateMarketplace={() => setPreviewSubTab('REDEEM CODE')}
            onOpenWallet={() => alert('Wallet in preview')}
            onOpenDeposit={() => alert('Deposit in preview')}
            onOpenUserLogin={() => alert('User login')}
          />

          <MainNavigation
            activeView={previewSubTab}
            onSelectView={setPreviewSubTab}
          />

          <main className="flex-1">
            {previewSubTab === 'REDEEM CODE' && (
              <div>
                <Marketplace
                  products={userProducts}
                  categories={categories}
                  onBuyNow={() => alert('Checkout simulation in preview')}
                  isLoading={isLoading}
                />
              </div>
            )}
            {previewSubTab === 'HOW TO REDEEM' && <HowToRedeemView />}
            {previewSubTab === 'WHY CHOOSE US' && <WhyChooseUsView />}
          </main>

          <Footer logoUrl={settings?.logoUrl || logoUrl} onOpenAdmin={() => setViewMode('ADMIN')} onOpenRedeem={() => {}} onOpenMyOrders={() => {}} />
        </div>
      )}

      {/* --- MODALS --- */}

      {/* MODAL: USER PROFILE & WALLET DRAWER */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <img src={selectedUser.profileImage} alt={selectedUser.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border">
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Current Balance</span>
                <span className="font-mono font-black text-emerald-600 text-lg">₹{(selectedUser.walletBalance || 0).toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Total Inward Deposits</span>
                <span className="font-mono font-black text-slate-900 text-lg">₹{selectedUser.totalDeposits || 0}</span>
              </div>
            </div>

            {/* Wallet Adjust Trigger */}
            <button
              onClick={() => setShowWalletAdjustModal(true)}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs rounded-xl border border-blue-200"
            >
              Manual Balance Adjustment (Credit / Debit)
            </button>

            {/* User Transactions */}
            <div className="space-y-2 pt-2 border-t text-xs">
              <span className="font-extrabold text-slate-900 block">Recent User Transactions</span>
              {userTransactions.length === 0 ? (
                <p className="text-slate-400 text-[11px]">No transactions yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {userTransactions.map(t => (
                    <div key={t.id} className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-[11px] font-semibold">
                      <div>
                        <span className="font-bold text-slate-800 block">{t.description}</span>
                        <span className="text-slate-400 text-[9px]">{new Date(t.createdAt).toLocaleString()}</span>
                      </div>
                      <span className={`font-mono font-black ${t.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {t.amount > 0 ? `+₹${t.amount}` : `-₹${Math.abs(t.amount)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WALLET ADJUSTMENT */}
      {showWalletAdjustModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-slate-900 text-base">Adjust Wallet Balance</h3>
            <p className="text-xs text-slate-500 font-semibold">User: {selectedUser.name}</p>

            <form onSubmit={handleSaveWalletAdjustment} className="space-y-3 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`py-2 rounded-xl font-bold ${adjustType === 'credit' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  + Credit (Add)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`py-2 rounded-xl font-bold ${adjustType === 'debit' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  - Debit (Deduct)
                </button>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Manual promotional credit"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWalletAdjustModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT DEPOSIT AMOUNT & QR */}
      {showDepositAmountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-slate-900 text-base">
              {editingDepositAmount ? 'Edit Deposit Amount & QR' : 'Add Deposit Amount & QR'}
            </h3>

            <form onSubmit={handleSaveDepositAmount} className="space-y-3 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={depAmountVal}
                    onChange={e => setDepAmountVal(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={depOrderVal}
                    onChange={e => setDepOrderVal(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">QR Image URL *</label>
                <input
                  type="url"
                  placeholder="https://example.com/qr-500.png"
                  value={depQrUrlVal}
                  onChange={e => setDepQrUrlVal(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono text-[11px]"
                  required
                />
              </div>

              {/* QR Live Preview inside Admin */}
              {depQrUrlVal && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Live QR Preview</span>
                  <img
                    src={depQrUrlVal}
                    alt="QR Preview"
                    className="w-28 h-28 mx-auto object-contain bg-white rounded-lg p-1 border shadow-xs"
                    onError={e => {
                      (e.target as HTMLElement).classList.add('hidden');
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={depUpiIdVal}
                    onChange={e => setDepUpiIdVal(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Receiver Name</label>
                  <input
                    type="text"
                    value={depReceiverVal}
                    onChange={e => setDepReceiverVal(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Status</label>
                <select
                  value={depEnabledVal ? 'true' : 'false'}
                  onChange={e => setDepEnabledVal(e.target.value === 'true')}
                  className="w-full p-2.5 border rounded-xl"
                >
                  <option value="true">Enabled (Live for users)</option>
                  <option value="false">Disabled (Hidden)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositAmountModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl"
                >
                  Save Amount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-3.5 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-slate-900 text-base">Edit Product & Pricing</h3>
            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Product Title</label>
                <input
                  type="text"
                  value={prodNameInput}
                  onChange={e => setProdNameInput(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Category</label>
                  <select
                    value={prodCategoryInput}
                    onChange={e => setProdCategoryInput(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Denomination (₹)</label>
                  <input
                    type="number"
                    value={prodDenomInput}
                    onChange={e => setProdDenomInput(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={prodPriceInput}
                    onChange={e => setProdPriceInput(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Redeem Balance (₹)</label>
                  <input
                    type="number"
                    value={prodBalanceInput}
                    onChange={e => setProdBalanceInput(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono font-bold text-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Status</label>
                <select
                  value={prodEnabledInput ? 'true' : 'false'}
                  onChange={e => setProdEnabledInput(e.target.value === 'true')}
                  className="w-full p-2.5 border rounded-xl"
                >
                  <option value="true">Live (Enabled)</option>
                  <option value="false">Disabled (Hidden)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CATEGORY */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-extrabold text-slate-900">{editingCat ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Category Name"
                value={catNameInput}
                onChange={e => setCatNameInput(e.target.value)}
                className="w-full p-3 border rounded-xl"
                required
              />
              <input
                type="text"
                placeholder="Icon URL"
                value={catIconInput}
                onChange={e => setCatIconInput(e.target.value)}
                className="w-full p-3 border rounded-xl"
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DENOMINATION */}
      {showDenomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-extrabold text-slate-900">{editingDenom ? 'Edit Denomination' : 'Add Denomination'}</h3>
            <form onSubmit={handleSaveDenomination} className="space-y-3 text-xs">
              <select value={denomCategory} onChange={e => setDenomCategory(e.target.value)} className="w-full p-2.5 border rounded-xl">
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <input
                type="number"
                placeholder="Value Amount"
                value={denomValue}
                onChange={e => setDenomValue(e.target.value)}
                className="w-full p-2.5 border rounded-xl font-mono font-bold"
                required
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowDenomModal(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REDEEM CODE */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-slate-900">{editingCode ? 'Edit Redeem Code' : 'Add Redeem Code'}</h3>
            <form onSubmit={handleSaveRedeemCode} className="space-y-3 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <select value={codeCategory} onChange={e => setCodeCategory(e.target.value)} className="w-full p-2.5 border rounded-xl">
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Denom"
                  value={codeDenom}
                  onChange={e => setCodeDenom(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Redeem Code String</label>
                <input
                  type="text"
                  placeholder="GPRC-XXXX-XXXX-XXXX"
                  value={codeString}
                  onChange={e => setCodeString(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono font-bold uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Price"
                  value={codePrice}
                  onChange={e => setCodePrice(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono"
                  required
                />
                <input
                  type="number"
                  placeholder="Balance"
                  value={codeBalance}
                  onChange={e => setCodeBalance(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono text-emerald-600 font-bold"
                  required
                />
              </div>

              <select value={codeStatus} onChange={e => setCodeStatus(e.target.value as CodeStatus)} className="w-full p-2.5 border rounded-xl">
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
              </select>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCodeModal(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK IMPORT */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-slate-900">Bulk Import Redeem Codes</h3>
            <p className="text-xs text-slate-500">
              Format: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">CODE | CATEGORY | DENOMINATION | PRICE | BALANCE</code>
            </p>
            <form onSubmit={handleBulkImport} className="space-y-3">
              <textarea
                rows={6}
                placeholder={`GPRC-9000-1111-9000 | GOOGLE PLAY | 900 | 900 | 900\nGPRC-5000-2222-5000 | GOOGLE PLAY | 5000 | 5000 | 5000`}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                className="w-full p-3 border rounded-xl font-mono text-xs uppercase"
              />

              {bulkResult && (
                <div className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1">
                  <p className="font-bold text-emerald-600">Imported: {bulkResult.imported}</p>
                  <p className="font-bold text-rose-600">Failed: {bulkResult.failed}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold text-xs">Close</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl">Start Import</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ORDER DETAIL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900">Order Detail: {selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs font-semibold text-slate-700">
              <p>Customer: <strong>{selectedOrder.customerName}</strong></p>
              <p>Email: {selectedOrder.customerEmail}</p>
              <p>Total Amount: <strong className="text-emerald-600 font-mono">₹{selectedOrder.totalAmount}</strong></p>
              <p>Payment: {selectedOrder.paymentMethod}</p>
              <p>Status: <span className="text-emerald-600 font-bold">{selectedOrder.status}</span></p>
              {selectedOrder.fullRedeemCode && (
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-sm font-bold text-center">
                  {selectedOrder.fullRedeemCode}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CODE CONFIRMATION */}
      {codeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Delete Redeem Code?</h3>
            <p className="text-xs text-slate-500 font-semibold font-mono bg-slate-50 p-2 rounded-xl">
              {codeToDelete.code} (₹{codeToDelete.denomination})
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCodeToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCode}
                disabled={isDeletingCode}
                className="flex-1 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl"
              >
                {isDeletingCode ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
