import React, { useState, useEffect } from 'react';
import { Product, Order, User } from '../types';
import { api } from '../services/api';
import { X, CheckCircle2, QrCode, CreditCard, ArrowRight, Copy, Check, Loader2, Wallet, Plus } from 'lucide-react';
import { CategoryBrandLogo } from './CategoryIcons';

interface CheckoutModalProps {
  product: Product | null;
  onClose: () => void;
  onOrderCompleted: (order: Order) => void;
  onOpenDeposit?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  onClose,
  onOrderCompleted,
  onOpenDeposit
}) => {
  if (!product) return null;

  const currentUser = api.getCurrentUser();

  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [paymentMethod, setPaymentMethod] = useState(currentUser && (currentUser.walletBalance || 0) >= product.price ? 'Wallet' : 'UPI QR Code');
  
  // Promo code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Calculations
  const rawTotal = product.price;
  const discountAmount = appliedPromo ? appliedPromo.discount : 0;
  const finalTotal = Math.max(0, rawTotal - discountAmount);
  const walletBalance = currentUser?.walletBalance || 0;
  const hasEnoughWallet = walletBalance >= finalTotal;

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setIsValidatingPromo(true);
    setPromoMessage(null);
    try {
      const code = promoCodeInput.trim().toUpperCase();
      if (code === 'VAULT10' || code === 'CODEVAULT2026') {
        const discount = Math.round(rawTotal * 0.1);
        setAppliedPromo({ code, discount });
        setPromoMessage(`Promo code '${code}' applied! Saved ₹${discount}`);
      } else if (code === 'SAVE50') {
        const discount = Math.min(50, rawTotal);
        setAppliedPromo({ code, discount });
        setPromoMessage(`Promo code '${code}' applied! Saved ₹${discount}`);
      } else {
        setAppliedPromo(null);
        setPromoMessage('Invalid promo code');
      }
    } catch (err) {
      setPromoMessage('Error validating code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setErrorMsg('Please complete all required contact fields');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // If paying with wallet, verify & deduct wallet balance first
      if (paymentMethod === 'Wallet') {
        if (!currentUser) {
          throw new Error('Please sign in to pay with your wallet.');
        }
        if (!hasEnoughWallet) {
          throw new Error(`Insufficient wallet balance. You have ₹${walletBalance.toFixed(2)}, need ₹${finalTotal}.`);
        }
      }

      const orderRes = await api.createOrder({
        userId: currentUser?.id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        items: [{
          productId: product.id,
          productName: product.name,
          denomination: product.denomination,
          price: product.price,
          category: product.category,
          maskedCode: product.maskedCode
        }],
        totalAmount: finalTotal,
        paymentMethod: paymentMethod === 'Wallet' ? 'CodeVault Wallet' : paymentMethod,
        promoCodeUsed: appliedPromo?.code,
        discountAmount: appliedPromo?.discount,
        fullRedeemCode: product.fullCode || `GPRC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
      });

      if (orderRes) {
        // If wallet was used, deduct on server
        if (paymentMethod === 'Wallet' && currentUser) {
          await api.payWithWallet(currentUser.id, finalTotal, orderRes.id, `Payment for ${product.name}`);
        }
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
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 tracking-tighter">
              CV
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
                {completedOrder ? 'Digital Code Issued' : 'Instant Redeem Code Checkout'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {completedOrder ? `Order ID: ${completedOrder.id}` : '24/7 Automated Delivery'}
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
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              
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

              {/* Recipient Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  1. Recipient Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Mercer"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address (Code Delivery) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone / Whatsapp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Options (including Wallet!) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    2. Payment Method
                  </h4>
                  {currentUser && (
                    <span className="text-[11px] font-bold text-slate-500">
                      Wallet: <strong className="font-mono text-slate-900">₹{walletBalance.toFixed(2)}</strong>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  
                  {/* CodeVault Wallet Option */}
                  {currentUser && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Wallet')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${
                        paymentMethod === 'Wallet'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className={`w-4 h-4 ${paymentMethod === 'Wallet' ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div>
                          <span className="text-xs font-bold block">CodeVault Wallet</span>
                          <span className="text-[10px] text-slate-500 font-mono">Balance: ₹{walletBalance.toFixed(2)}</span>
                        </div>
                      </div>
                      {hasEnoughWallet ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Ready</span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Low</span>
                      )}
                    </button>
                  )}

                  {/* UPI QR Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI QR Code')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      paymentMethod === 'UPI QR Code'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 font-medium'
                    }`}
                  >
                    <QrCode className={`w-4 h-4 ${paymentMethod === 'UPI QR Code' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block">Direct UPI QR</span>
                      <span className="text-[10px] text-slate-500">Scan & Pay</span>
                    </div>
                  </button>
                </div>

                {/* Insufficient wallet alert with direct Deposit button */}
                {paymentMethod === 'Wallet' && !hasEnoughWallet && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900">
                    <span>Insufficient balance (Need ₹{(finalTotal - walletBalance).toFixed(2)} more)</span>
                    {onOpenDeposit && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDeposit();
                        }}
                        className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[10px] hover:bg-blue-700"
                      >
                        + Add Money
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Promo Code Input */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Promo Code (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. VAULT10)"
                    value={promoCodeInput}
                    onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[38px]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={isValidatingPromo || !promoCodeInput.trim()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 min-h-[38px]"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <p className={`text-[11px] font-bold ${appliedPromo ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {promoMessage}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Product Price:</span>
                  <span className="font-mono font-bold">₹{rawTotal.toLocaleString('en-IN')}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount ({appliedPromo.code}):</span>
                    <span className="font-mono">-₹{appliedPromo.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="font-mono text-blue-600 text-base">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || (paymentMethod === 'Wallet' && !hasEnoughWallet)}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[48px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Instant Delivery...</span>
                    </>
                  ) : (
                    <>
                      <span>{paymentMethod === 'Wallet' ? `Pay ₹${finalTotal} with Wallet` : `Confirm Order (₹${finalTotal})`}</span>
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
                <p className="text-xs text-slate-500">
                  Your Google Play recharge code is ready to redeem.
                </p>
              </div>

              {/* Revealed Code Card */}
              <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3 shadow-xl">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400 block">
                  GOOGLE PLAY RECHARGE CODE
                </span>
                
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
