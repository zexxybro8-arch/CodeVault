import React, { useState, useEffect } from 'react';
import {
  Wallet, Plus, History, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, Clock, XCircle, X, Shield, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { User, WalletTransaction, DepositRequest } from '../types';

interface WalletModalProps {
  user: User;
  onClose: () => void;
  onOpenDeposit: () => void;
  onRefreshData?: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  user,
  onClose,
  onOpenDeposit,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TRANSACTIONS'>('OVERVIEW');
  const [balance, setBalance] = useState<number>(user.walletBalance || 0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWallet = async () => {
    setIsLoading(true);
    try {
      const data = await api.getWalletData(user.id);
      setBalance(data.balance);
      setTransactions(data.transactions);
      setDeposits(data.deposits);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Error fetching wallet data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [user.id]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl leading-tight">CodeVault Wallet</h2>
              <p className="text-xs font-semibold text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === 'OVERVIEW'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            WALLET BALANCE
          </button>
          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            TRANSACTIONS ({transactions.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Big Balance Card */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
                <div className="flex items-center justify-between text-blue-100 text-xs font-extrabold uppercase tracking-wider mb-2">
                  <span>Current Balance</span>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Protected</span>
                  </div>
                </div>
                
                <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight mb-4">
                  ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDeposit();
                    }}
                    className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-blue-700 font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>+ ADD MONEY</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('TRANSACTIONS')}
                    className="py-3 px-4 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                    <span>History</span>
                  </button>
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
                <h4 className="font-extrabold text-slate-900 flex items-center justify-between">
                  <span>Prepaid Wallet Benefits</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Instant Checkout</span>
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  Use your wallet balance to instantly redeem and purchase Google Play vouchers without repeatedly entering bank details.
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px] font-bold text-slate-600 border-t border-slate-200/60">
                  <span>Total Deposits Made:</span>
                  <span className="font-mono text-slate-900">₹{(user.totalDeposits || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Pending Deposits Notice if any */}
              {deposits.filter(d => d.status === 'PENDING').length > 0 && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Deposit Under Verification</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    You have {deposits.filter(d => d.status === 'PENDING').length} pending deposit request(s). Balance will credit once verified by Admin.
                  </p>
                </div>
              )}

            </div>
          )}

          {activeTab === 'TRANSACTIONS' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="font-bold">Transaction History</span>
                <button onClick={loadWallet} className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-400 space-y-2">
                  <History className="w-8 h-8 mx-auto opacity-40" />
                  <p className="font-bold text-xs">No transactions recorded yet.</p>
                  <p className="text-[11px]">Add money to your wallet to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(txn => {
                    const isPositive = txn.amount > 0;
                    return (
                      <div
                        key={txn.id}
                        className="bg-white p-3.5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-xs truncate">{txn.description}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                              <span>{new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-500">{txn.referenceId || txn.id}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className={`font-mono font-black text-sm ${
                            isPositive ? 'text-emerald-600' : 'text-slate-900'
                          }`}>
                            {isPositive ? `+₹${txn.amount}` : `-₹${Math.abs(txn.amount)}`}
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase mt-0.5 ${
                            txn.status === 'Approved' || txn.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : txn.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {txn.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
