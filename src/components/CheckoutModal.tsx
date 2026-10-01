import React, { useState, useEffect } from 'react';
import { Product, Order } from '../types';
import { api } from '../services/api';
import { X, CheckCircle2, ArrowRight, Copy, Check, Loader2, Wallet } from 'lucide-react';
import { CategoryBrandLogo } from './CategoryIcons';

interface CheckoutModalProps {
  product: Product | null;
  onClose: () => void;
  onOrderCompleted: (order: Order) => void;
  onOpenDeposit?: () => void;
  logoUrl?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  onClose,
  onOrderCompleted,
  onOpenDeposit,
  logoUrl
}) => {
  if (!product) return null;

  const currentUser = api.getCurrentUser();
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Calculations
  const finalTotal = product.price;
  const walletBalance = currentUser?.walletBalance || 0;
  const hasEnoughWallet = walletBalance >= finalTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser) {
      setErrorMsg('Please sign in to complete your purchase.');
      return;
    }

    if (!hasEnoughWallet) {
      setErrorMsg(`Insufficient wallet balance. You have ₹${walletBalance.toFixed(2)}, need ₹${finalTotal.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const orderRes = await api.createOrder({
        userId: currentUser.id,
        customerName: currentUser.name || 'CodeVault Customer',
        customerEmail: currentUser.email || 'customer@example.com',
        customerPhone: '',
        items: [{
          productId: product.id,
          productName: product.name,
          denomination: product.denomination,
          price: product.price,
          category: product.category,
          maskedCode: product.maskedCode
        }],
        totalAmount: finalTotal,
        paymentMethod: 'CodeVault Wallet',
        fullRedeemCode: product.fullCode || `GPRC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
      });

      if (orderRes) {
        await api.payWithWallet(currentUser.id, finalTotal, orderRes.id, `Payment for ${product.name}`);
        setCompletedOrder(orderRes);
        onOrderCompleted(orderRes);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!completedOrder || !completedOrder.fullRedeemCode) return;
    navigator.clipboard.writeText(completedOrder.fullRedeemCode);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn w-full max-w-full">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl}
                alt="CodeVault Logo"
                onError={() => setLogoFailed(true)}
                className="w-7 h-7 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 tracking-tighter">
                CV
              </div>
            )}
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
                {completedOrder ? 'Digital Code Issued' : 'Instant Redeem Code Checkout'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {completedOrder ? `Order ID: ${completedOrder.id}` : 'Instant Wallet Payment & Automated Delivery'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1">
          {!completedOrder ? (
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              
              {/* Product Summary */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryBrandLogo category={product.category} className="w-4 h-4" />
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      {product.category}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Instant Digital Delivery
                  </span>
                </div>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900">{product.name}</h4>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80 text-slate-600">
                  <span className="truncate mr-2">Code: <strong className="font-mono text-slate-900">{product.maskedCode}</strong></span>
                  <span className="shrink-0">Price: <strong className="text-blue-600 font-mono text-sm sm:text-base">₹{product.price.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                  {errorMsg}
                </div>
              )}

              {/* Wallet Payment Method */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Payment Method
                </label>
                
                <div className="p-3.5 rounded-2xl border border-blue-600 bg-blue-50/80 text-blue-900 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block text-slate-900">CodeVault Wallet</span>
                      <span className="text-[11px] text-slate-600 font-mono">Available Balance: ₹{walletBalance.toFixed(2)}</span>
                    </div>
                  </div>
                  {hasEnoughWallet ? (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full uppercase">
                      Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-1 rounded-full uppercase">
                      Low Balance
                    </span>
                  )}
                </div>

                {/* Insufficient wallet alert with direct Deposit button */}
                {!hasEnoughWallet && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900">
                    <span className="font-semibold">Need ₹{(finalTotal - walletBalance).toFixed(2)} more in your wallet</span>
                    {onOpenDeposit && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDeposit();
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs transition-colors shrink-0"
                      >
                        + Add Money
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Product Price:</span>
                  <span className="font-mono font-bold">₹{product.price.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="font-mono text-blue-600 text-base">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !hasEnoughWallet}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[48px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deducting Wallet & Issuing Code...</span>
                    </>
                  ) : (
                    <>
                      <span>PAY ₹{finalTotal.toLocaleString('en-IN')} WITH WALLET</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            /* Order Completed & Revealed Voucher View */
            <div className="p-6 text-center space-y-5 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-xl text-slate-900">Voucher Code Delivered!</h4>
                <p className="text-xs text-slate-500">Your digital code is ready below. Copy and redeem instantly.</p>
              </div>

              {/* Revealed Code Card */}
              <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3 shadow-xl text-left">
                <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-blue-400">
                  <span>Digital Redeem Voucher</span>
                  <span className="text-emerald-400 font-bold">Paid with Wallet</span>
                </div>
                
                <div className="font-mono font-black text-xl sm:text-2xl text-emerald-400 tracking-wider select-all py-2 px-3 bg-white/5 rounded-xl border border-white/10">
                  {completedOrder.fullRedeemCode}
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedText ? 'Copied to Clipboard!' : 'Copy Redeem Code'}</span>
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-left space-y-1.5 text-slate-600">
                <div className="flex justify-between font-bold">
                  <span>Order Reference:</span>
                  <span className="font-mono text-slate-900">{completedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="text-slate-800">{completedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-mono text-emerald-600 font-bold">₹{completedOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="text-slate-800">{completedOrder.paymentMethod}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer"
              >
                Close & Return to Marketplace
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
