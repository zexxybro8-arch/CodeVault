import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Category, Denomination, RedeemCodeItem, Product, Order,
  DashboardStats, MarketplaceSettings, CodeStatus
} from '../types';
import { Header } from './Header';
import { Hero } from './Hero';
import { MainNavigation, MainViewTab } from './MainNavigation';
import { HowToRedeemView } from './views/HowToRedeemView';
import { WhyChooseUsView } from './views/WhyChooseUsView';
import { Marketplace } from './Marketplace';
import { Footer } from './Footer';

import {
  LayoutDashboard, FolderTree, Layers, KeyRound, ShoppingBag,
  Package, Settings, LogOut, Plus, Search,
  Edit, Trash2, Eye, Upload, RefreshCw, X, Menu, Monitor
} from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
  onDataChanged: () => void;
}

type AdminTab = 'dashboard' | 'categories' | 'denominations' | 'codes' | 'products' | 'orders' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, onDataChanged }) => {
  // Mode switcher: ADMIN PANEL vs USER PREVIEW
  const [viewMode, setViewMode] = useState<'ADMIN' | 'USER_PREVIEW'>('ADMIN');
  const [previewSubTab, setPreviewSubTab] = useState<MainViewTab>('REDEEM CODE');

  // Sidebar Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCodeItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<MarketplaceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modals & Form states
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catIconInput, setCatIconInput] = useState('');

  const [showDenomModal, setShowDenomModal] = useState(false);
  const [editingDenom, setEditingDenom] = useState<Denomination | null>(null);
  const [denomCategory, setDenomCategory] = useState('GOOGLE PLAY');
  const [denomValue, setDenomValue] = useState('500');

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

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [sRes, cRes, dRes, rcRes, pRes, oRes, setRes] = await Promise.all([
        api.getDashboardStats(),
        api.getCategories(),
        api.getDenominations(),
        api.getRedeemCodes(),
        api.getProducts(),
        api.getOrders(),
        api.getSettings()
      ]);
      setStats(sRes);
      setCategories(cRes);
      setDenominations(dRes);
      setRedeemCodes(rcRes);
      setProducts(pRes);
      setOrders(oRes);
      if (setRes) setSettings(setRes);
    } catch (err) {
      console.error('Error loading admin dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Category Actions ---
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
    loadAdminData();
    onDataChanged();
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await api.deleteCategory(id);
      loadAdminData();
      onDataChanged();
    }
  };

  const handleToggleCategory = async (cat: Category) => {
    await api.updateCategory(cat.id, { enabled: !cat.enabled });
    loadAdminData();
    onDataChanged();
  };

  // --- Denomination Actions ---
  const handleSaveDenomination = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(denomValue);
    if (!val) return;

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
    loadAdminData();
    onDataChanged();
  };

  const handleDeleteDenom = async (id: string) => {
    if (confirm('Delete this denomination?')) {
      await api.deleteDenomination(id);
      loadAdminData();
      onDataChanged();
    }
  };

  const handleToggleDenom = async (den: Denomination) => {
    await api.updateDenomination(den.id, { enabled: !den.enabled });
    loadAdminData();
    onDataChanged();
  };

  // --- Redeem Code Actions ---
  const handleSaveRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeString.trim()) return;
    try {
      if (editingCode) {
        await api.updateRedeemCode(editingCode.id, {
          code: codeString.toUpperCase().trim(),
          category: codeCategory,
          denomination: Number(codeDenom),
          price: Number(codePrice),
          balance: Number(codeBalance),
          status: codeStatus,
          note: codeNote
        });
      } else {
        await api.createRedeemCode({
          code: codeString.toUpperCase().trim(),
          category: codeCategory,
          denomination: Number(codeDenom),
          price: Number(codePrice),
          balance: Number(codeBalance),
          status: codeStatus,
          note: codeNote
        });
      }
      setShowCodeModal(false);
      setEditingCode(null);
      setCodeString('');
      loadAdminData();
      onDataChanged();
    } catch (err: any) {
      alert(err.message || 'Error saving code');
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (confirm('Delete this redeem code?')) {
      await api.deleteRedeemCode(id);
      loadAdminData();
      onDataChanged();
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    const res = await api.bulkImportRedeemCodes(bulkText);
    setBulkResult({ imported: res.imported, failed: res.failed, errors: res.errors || [] });
    if (res.imported > 0) {
      loadAdminData();
      onDataChanged();
    }
  };

  // --- Settings Save ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await api.updateSettings(settings);
    alert('Admin Settings updated successfully!');
    loadAdminData();
  };

  // Filtered Redeem Codes
  const filteredCodes = redeemCodes.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return c.code.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.denomination.toString().includes(q) ||
        c.price.toString().includes(q);
    }
    return true;
  });

  // Filtered Products
  const filteredProducts = products.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.price.toString().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      
      {/* TOP SAAS HEADER WITH MODE SWITCHER */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between shadow-md">
        
        {/* Left Brand Lockup */}
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-2xs">
              X
            </div>
            <div>
              <span className="font-display font-black text-lg tracking-tight text-white">
                BLACK <span className="text-blue-500">X</span>
              </span>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                ADMIN CONSOLE
              </span>
            </div>
          </div>
        </div>

        {/* Center Mode Switcher: [ ADMIN PANEL ] [ USER PREVIEW ] */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-800 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setViewMode('ADMIN')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              viewMode === 'ADMIN'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>ADMIN PANEL</span>
          </button>

          <button
            onClick={() => setViewMode('USER_PREVIEW')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              viewMode === 'USER_PREVIEW'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>USER PREVIEW</span>
          </button>
        </div>

        {/* Right Actions: Refresh & Logout */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            title="Refresh DB Data"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs rounded-lg transition-all shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

      </header>

      {/* MODE 1: ADMIN PANEL WITH SIDEBAR */}
      {viewMode === 'ADMIN' && (
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className={`fixed md:relative inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="p-4 space-y-6">
              
              <div className="md:hidden flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Admin Navigation</span>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1.5 text-xs font-bold">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'categories', label: 'Categories', icon: FolderTree },
                  { id: 'denominations', label: 'Sub Categories / Denominations', icon: Layers },
                  { id: 'codes', label: 'Redeem Codes', icon: KeyRound },
                  { id: 'products', label: 'Products', icon: Package },
                  { id: 'orders', label: 'Orders', icon: ShoppingBag },
                  { id: 'settings', label: 'Settings', icon: Settings },
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
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <IconC className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Logout Footer */}
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </aside>

          {/* MAIN ADMIN DASHBOARD CONTENT */}
          <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6">

            {/* 1. DASHBOARD HOME */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Stat Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Categories</span>
                    <div className="text-2xl font-black text-slate-900">{stats?.totalCategories ?? categories.length}</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Sub Categories / Denominations</span>
                    <div className="text-2xl font-black text-slate-900">{stats?.totalSubCategories ?? denominations.length}</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Available Codes</span>
                    <div className="text-2xl font-black text-emerald-600">{stats?.availableCodes ?? redeemCodes.filter(c => c.status === 'Available').length}</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Sold Codes</span>
                    <div className="text-2xl font-black text-blue-600">{stats?.soldCodes ?? redeemCodes.filter(c => c.status === 'Sold').length}</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Orders</span>
                    <div className="text-2xl font-black text-slate-900">{stats?.totalOrders ?? orders.length}</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1 col-span-2 lg:col-span-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Sales Revenue</span>
                    <div className="text-3xl font-black text-slate-900 font-mono">₹{(stats?.totalSales ?? 0).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Recent Orders Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-5">
                  <h3 className="font-extrabold text-slate-900 text-sm">Recent Activity / Orders</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {orders.slice(0, 5).map(o => (
                          <tr key={o.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-mono font-bold text-slate-900">{o.id}</td>
                            <td className="p-3">{o.customerName} ({o.customerEmail})</td>
                            <td className="p-3 font-mono font-bold">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {o.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* 2. CATEGORIES */}
            {activeTab === 'categories' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900">Marketplace Categories</h3>
                  <button
                    onClick={() => {
                      setEditingCat(null);
                      setCatNameInput('');
                      setCatIconInput('');
                      setShowCatModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Category Name</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-extrabold text-slate-900">{c.name}</td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleCategory(c)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                c.enabled !== false
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {c.enabled !== false ? 'Enabled' : 'Disabled'}
                            </button>
                          </td>
                          <td className="p-3 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingCat(c);
                                setCatNameInput(c.name);
                                setCatIconInput(c.iconUrl || '');
                                setShowCatModal(true);
                              }}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
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
            )}

            {/* 3. SUB CATEGORIES / DENOMINATIONS */}
            {activeTab === 'denominations' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Sub Categories / Denominations</h3>
                    <p className="text-xs text-slate-500">Manage denomination filters for Google Play and other categories</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingDenom(null);
                      setDenomValue('500');
                      setShowDenomModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Denomination</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {denominations.map(d => (
                    <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">{d.categoryName}</span>
                        <span className="text-xl font-mono font-black text-slate-900">{d.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleToggleDenom(d)} className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.enabled !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                          {d.enabled !== false ? 'Active' : 'Off'}
                        </button>
                        <button onClick={() => handleDeleteDenom(d.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. REDEEM CODES & BULK IMPORT */}
            {activeTab === 'codes' && (
              <div className="space-y-4 animate-fadeIn">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search code or denomination..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="ALL">Status: All</option>
                      <option value="Available">Available</option>
                      <option value="Sold">Sold</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBulkModal(true)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>Bulk Import Codes</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingCode(null);
                        setCodeString('');
                        setCodePrice('450');
                        setCodeBalance('500');
                        setShowCodeModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Single Code</span>
                    </button>
                  </div>
                </div>

                {/* Redeem Codes Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Category</th>
                          <th className="p-3">Denomination</th>
                          <th className="p-3">Redeem Code</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Balance</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCodes.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-extrabold text-blue-600">{c.category}</td>
                            <td className="p-3 font-mono font-extrabold">₹{c.denomination}</td>
                            <td className="p-3 font-mono font-black text-slate-900 tracking-wider">{c.code}</td>
                            <td className="p-3 font-mono font-extrabold text-slate-900">₹{c.price}</td>
                            <td className="p-3 font-mono font-extrabold text-emerald-600">₹{c.balance}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                c.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                c.status === 'Sold' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-3 flex items-center gap-1.5">
                              <button onClick={() => {
                                setEditingCode(c);
                                setCodeCategory(c.category);
                                setCodeDenom(c.denomination.toString());
                                setCodeString(c.code);
                                setCodePrice(c.price.toString());
                                setCodeBalance(c.balance.toString());
                                setCodeStatus(c.status);
                                setShowCodeModal(true);
                              }} className="p-1 text-slate-600 hover:bg-slate-100 rounded">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteCode(c.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded">
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* 5. PRODUCTS MANAGEMENT */}
            {activeTab === 'products' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Product Title</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Balance</th>
                        <th className="p-3">Masked Code</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-extrabold text-slate-900">{p.name}</td>
                          <td className="p-3 font-bold text-blue-600">{p.category}</td>
                          <td className="p-3 font-mono font-extrabold text-slate-900">₹{p.price}</td>
                          <td className="p-3 font-mono font-extrabold text-emerald-600">₹{p.balance}</td>
                          <td className="p-3 font-mono text-slate-600">{p.maskedCode}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Live on Marketplace
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. ORDERS MANAGEMENT */}
            {activeTab === 'orders' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Item / Category</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-mono font-bold text-slate-900">{o.id}</td>
                          <td className="p-3">{o.customerName} ({o.customerEmail})</td>
                          <td className="p-3 font-bold text-blue-600">{o.items[0]?.category || 'GOOGLE PLAY'}</td>
                          <td className="p-3 font-mono font-bold">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {o.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td className="p-3">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
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
            )}

            {/* 7. SETTINGS */}
            {activeTab === 'settings' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs max-w-xl mx-auto space-y-4 animate-fadeIn">
                <h3 className="text-base font-extrabold text-slate-900 border-b pb-3">Marketplace Settings</h3>
                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-700 mb-1">Marketplace Title</label>
                    <input
                      type="text"
                      value={settings?.title || ''}
                      onChange={e => setSettings(s => s ? { ...s, title: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={settings?.description || ''}
                      onChange={e => setSettings(s => s ? { ...s, description: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={settings?.currency || 'INR (₹)'}
                      onChange={e => setSettings(s => s ? { ...s, currency: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl"
                  >
                    Save Settings
                  </button>
                </form>
              </div>
            )}

          </main>
        </div>
      )}

      {/* MODE 2: LIVE USER PREVIEW IN ADMIN PANEL */}
      {viewMode === 'USER_PREVIEW' && (
        <div className="flex-1 bg-white overflow-y-auto animate-fadeIn">
          <div className="bg-blue-600 text-white text-xs font-bold py-2 px-4 text-center border-b border-blue-700 flex items-center justify-center gap-2">
            <Monitor className="w-4 h-4" />
            <span>LIVE USER PREVIEW — Viewing active marketplace using admin DB data</span>
          </div>

          <Header
            orderCount={orders.length}
            onOpenMyOrders={() => {}}
            onOpenAdmin={() => setViewMode('ADMIN')}
            onOpenRedeem={() => {}}
            onNavigateMarketplace={() => setPreviewSubTab('REDEEM CODE')}
          />

          <MainNavigation
            activeView={previewSubTab}
            onSelectView={setPreviewSubTab}
          />

          <main className="flex-1">
            {previewSubTab === 'REDEEM CODE' && (
              <div>
                <Hero
                  onExploreCards={() => {}}
                  onRedeemCode={() => {}}
                />
                <Marketplace
                  products={products}
                  categories={categories}
                  onBuyNow={() => alert('Order simulation in preview mode')}
                  isLoading={isLoading}
                />
              </div>
            )}

            {previewSubTab === 'HOW TO REDEEM' && <HowToRedeemView />}
            {previewSubTab === 'WHY CHOOSE US' && <WhyChooseUsView />}
          </main>

          <Footer />
        </div>
      )}

      {/* --- MODAL 1: ADD / EDIT CATEGORY --- */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-extrabold text-slate-900">{editingCat ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Category Name (e.g. GOOGLE PLAY)"
                value={catNameInput}
                onChange={e => setCatNameInput(e.target.value)}
                className="w-full p-2.5 border rounded-xl"
                required
              />
              <input
                type="text"
                placeholder="Icon / Logo Image URL (Optional)"
                value={catIconInput}
                onChange={e => setCatIconInput(e.target.value)}
                className="w-full p-2.5 border rounded-xl"
              />
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="flex-1 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD / EDIT DENOMINATION --- */}
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
                placeholder="Value Amount (e.g. 500)"
                value={denomValue}
                onChange={e => setDenomValue(e.target.value)}
                className="w-full p-2.5 border rounded-xl"
                required
              />
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={() => setShowDenomModal(false)} className="flex-1 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADD / EDIT SINGLE REDEEM CODE --- */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-extrabold text-slate-900">{editingCode ? 'Edit Redeem Code' : 'Add Single Redeem Code'}</h3>
            <form onSubmit={handleSaveRedeemCode} className="space-y-3 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Category</label>
                  <select value={codeCategory} onChange={e => setCodeCategory(e.target.value)} className="w-full p-2 border rounded-xl">
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Denomination</label>
                  <input type="number" value={codeDenom} onChange={e => setCodeDenom(e.target.value)} className="w-full p-2 border rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Redeem Code String</label>
                <input type="text" placeholder="XXXX XXXX XXXX XXXX" value={codeString} onChange={e => setCodeString(e.target.value)} className="w-full p-2.5 border rounded-xl font-mono font-bold" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Price (₹)</label>
                  <input type="number" value={codePrice} onChange={e => setCodePrice(e.target.value)} className="w-full p-2 border rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Balance (₹)</label>
                  <input type="number" value={codeBalance} onChange={e => setCodeBalance(e.target.value)} className="w-full p-2 border rounded-xl font-mono text-emerald-600 font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Status</label>
                <select value={codeStatus} onChange={e => setCodeStatus(e.target.value as CodeStatus)} className="w-full p-2 border rounded-xl">
                  <option value="Available">Available</option>
                  <option value="Sold">Sold</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={() => setShowCodeModal(false)} className="flex-1 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl">Save Code</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: BULK CODE IMPORT --- */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4">
            <h3 className="font-extrabold text-slate-900">Bulk Redeem Code Import</h3>
            <p className="text-xs text-slate-500">
              Paste multiple codes below (one per line). Format:<br />
              <code className="bg-slate-100 p-1 rounded font-mono text-blue-600">CODE | CATEGORY | DENOMINATION | PRICE | BALANCE</code>
            </p>

            <form onSubmit={handleBulkImport} className="space-y-3">
              <textarea
                rows={6}
                placeholder={`GPRC-1000-AAAA-1111 | GOOGLE PLAY | 500 | 450 | 500\nGPRC-2000-BBBB-2222 | GOOGLE PLAY | 1000 | 950 | 1000`}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl font-mono text-xs"
                required
              />

              {bulkResult && (
                <div className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1">
                  <p className="font-bold text-emerald-600">✓ Successfully Imported: {bulkResult.imported}</p>
                  {bulkResult.failed > 0 && <p className="font-bold text-rose-600">⚠ Failed / Duplicates: {bulkResult.failed}</p>}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setShowBulkModal(false); setBulkResult(null); }} className="flex-1 py-2 bg-slate-100 rounded-xl font-bold text-xs">Close</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl">Import All Codes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: ORDER DETAIL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900">Order #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <p><span className="font-bold">Customer:</span> {selectedOrder.customerName} ({selectedOrder.customerEmail})</p>
              <p><span className="font-bold">Phone:</span> {selectedOrder.customerPhone}</p>
              <p><span className="font-bold">Payment Method:</span> {selectedOrder.paymentMethod}</p>
              <p><span className="font-bold">Total Amount:</span> ₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</p>
              <p><span className="font-bold">Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Assigned Code</span>
                <span className="font-mono font-black text-slate-900 text-base">{selectedOrder.fullRedeemCode || 'GPRC-9012-8K4P-29X7'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
