import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { X, Search, ShoppingBag, Copy, Check, ShieldCheck, RefreshCw, Loader2, Ticket } from 'lucide-react';

interface MyOrdersModalProps {
  onClose: () => void;
  recentOrders?: Order[];
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({ onClose, recentOrders = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [orders, setOrders] = useState<Order[]>(recentOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchUserOrders = async () => {
    setIsLoading(true);
    try {
      const q = searchQuery.trim();
      let res: Order[] = [];
      if (q.includes('@')) {
        res = await api.getOrders({ email: q });
      } else if (q.startsWith('CV-') || q.startsWith('BX-') || q.length >= 4) {
        res = await api.getOrders({ orderId: q });
      } else {
        res = await api.getOrders();
      }
      setOrders(res.length ? res : recentOrders);
    } catch (err) {
      console.error('Fetch user orders error', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      const timer = setTimeout(() => {
        fetchUserOrders();
      }, 400);
      return () => clearTimeout(timer);
    } else if (!searchQuery.trim() && recentOrders.length > 0) {
      setOrders(recentOrders);
    }
  }, [searchQuery]);

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'All' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.items.some(i => i.productName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopyCode = (order: Order) => {
    if (!order.fullRedeemCode) return;
    navigator.clipboard.writeText(order.fullRedeemCode);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn w-full max-w-full">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-none">MY ORDERS & CODES</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Track status & view unlocked redeem codes</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-3.5 sm:p-4 bg-white border-b border-slate-100 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Order ID (e.g. CV-58192) or Email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
              />
            </div>

            <button
              onClick={fetchUserOrders}
              className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {['All', 'Completed', 'Processing', 'Pending', 'Cancelled'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 min-h-[32px] ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-semibold">Loading order history...</span>
            </div>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <div
                key={order.id}
                className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-blue-300 transition-all space-y-3"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-slate-900 text-xs sm:text-sm">{order.id}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusBadgeColor(
                        order.status
                      )}`}
                    >
                      ● {order.status}
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Items & Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Purchased Voucher
                    </span>
                    {order.items.map((it, idx) => (
                      <div key={idx} className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                        {it.productName} ({it.category})
                      </div>
                    ))}
                    <div className="text-slate-500 text-[11px] mt-0.5 truncate">
                      {order.customerName} ({order.customerEmail})
                    </div>
                  </div>

                  <div className="sm:text-right space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Amount Paid
                    </span>
                    <span className="font-mono font-black text-blue-600 text-sm sm:text-base block">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Paid via: {order.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Unlocked Full Redeem Code Panel */}
                {order.fullRedeemCode && (
                  <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-1.5 font-mono text-xs border border-blue-400/30 shadow-sm">
                    <div className="flex items-center justify-between text-[11px] text-blue-300">
                      <span className="flex items-center gap-1 font-sans font-bold">
                        <Ticket className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        UNLOCKED CODE
                      </span>
                      <button
                        onClick={() => handleCopyCode(order)}
                        className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors font-sans text-[11px] font-bold min-h-[30px]"
                      >
                        {copiedId === order.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === order.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="text-base sm:text-xl font-bold tracking-widest text-emerald-300 pt-0.5 break-all">
                      {order.fullRedeemCode}
                    </div>
                  </div>
                )}

              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500">
              <ShoppingBag className="w-9 h-9 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">No orders found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Enter your email address or Order ID in the search bar above to fetch your orders.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors min-h-[40px]"
          >
            Close Portal
          </button>
        </div>

      </div>
    </div>
  );
};
