import React, { useState } from 'react';
import { Product, Order, CustomerSession } from '../types';
import { api } from '../services/api';
import { X, CheckCircle2, QrCode, CreditCard, ArrowRight, Copy, Check, Loader2 } from 'lucide-react';
import { CategoryBrandLogo } from './CategoryIcons';

interface CheckoutModalProps {
  product: Product | null;
  onClose: () => void;
  onOrderCompleted: (order: Order) => void;
  customerSession?: CustomerSession | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  onClose,
  onOrderCompleted,
  customerSession = null
}) => {
  if (!product) return null;

  const [customerName, setCustomerName] = useState(() => customerSession?.name || '');
  const [customerEmail, setCustomerEmail] = useState(() => customerSession?.email || '');
  const [customerPhone, setCustomerPhone] = useState(() => customerSession?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('UPI QR Code');
  
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

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setIsValidatingPromo(true);
    setPromoMessage(null);
    try {
      const res = await api.redeemCode(promoCodeInput.trim());
      if (res.success && res.promoCode) {
        let calcDiscount = 0;
        if (res.promoCode.discountType === 'percentage') {
          calcDiscount = Math.round((rawTotal * res.promoCode.discountValue) / 100);
        } else {
          calcDiscount = res.promoCode.discountValue;
        }
        setAppliedPromo({ code: res.promoCode.code, discount: calcDiscount });
        setPromoMessage(`Code '${res.promoCode.code}' applied successfully!`);
      } else {
        setAppliedPromo(null);
        setPromoMessage(res.message || 'Invalid promotion code');
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
      const orderRes = await api.createOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        items: [{ productId: product.id, productName: product.name }],
        paymentMethod,
        promoCodeUsed: appliedPromo?.code,
        discountAmount: appliedPromo?.discount
      });

      if (orderRes) {
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
                  <span className="shrink-0">Value: <strong className="text-blue-600 font-mono text-sm sm:text-base">₹{product.price.toLocaleString('en-IN')}</strong></span>
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

              {/* Payment Options */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  2. Payment Method
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI QR Code', icon: QrCode, label: 'UPI QR' },
                    { id: 'Net Banking', icon: CreditCard, label: 'Net Banking' },
                    { id: 'Card', icon: CreditCard, label: 'Debit/Credit' }
                  ].map(opt => {
                    const IconC = opt.icon;
                    const isSelected = paymentMethod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPaymentMethod(opt.id)}
                        className={`p-2 sm:p-2.5 rounded-xl border text-left flex items-center gap-1.5 sm:gap-2 transition-all min-h-[42px] ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 font-medium'
                        }`}
                      >
                        <IconC className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="text-[11px] sm:text-xs truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Promo Code (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. CODEVAULT2026"
                    value={promoCodeInput}
                    onChange={e => setPromoCodeInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase min-h-[40px]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={isValidatingPromo || !promoCodeInput.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-colors shrink-0 min-h-[40px]"
                  >
                    {isValidatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {promoMessage && (
                  <p className={`text-xs font-semibold ${appliedPromo ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {promoMessage}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Code Price:</span>
                  <span className="font-mono text-slate-900 font-semibold">₹{rawTotal.toLocaleString('en-IN')}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Promo Discount ({appliedPromo.code}):</span>
                    <span className="font-mono">-₹{appliedPromo.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Amount Payable:</span>
                  <span className="font-mono text-blue-600 text-base sm:text-lg">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Payment & Code...</span>
                  </>
                ) : (
                  <>
                    <span>CONFIRM & PAY ₹{finalTotal.toLocaleString('en-IN')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

            </form>
          ) : (
            /* Order Completed View */
            <div className="p-5 sm:p-6 space-y-5 text-center">
              
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <div>
                <span className="text-[11px] sm:text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  ● Redeem Code Issued
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display mt-2">
                  Order Completed!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your full digital redeem code has been unlocked. Keep it safe!
                </p>
              </div>

              {/* Revealed Code Display Box */}
              <div className="bg-slate-900 text-white p-4 sm:p-6 rounded-2xl shadow-xl text-center space-y-3 max-w-md mx-auto border border-blue-500/30">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block font-mono">
                  YOUR UNLOCKED REDEEM CODE
                </span>

                <div className="font-mono font-black text-lg sm:text-2xl tracking-widest text-emerald-300 bg-slate-800/90 py-3 px-3 sm:px-4 rounded-xl border border-emerald-500/30 break-all">
                  {completedOrder.fullRedeemCode || 'GPRC-9012-8K4P-29X7'}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-slate-800">
                  <span>ORDER: {completedOrder.id}</span>
                  <span className="text-emerald-400 font-bold">COMPLETED</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={handleCopyCode}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                >
                  {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedText ? 'Copied Code!' : 'Copy Redeem Code'}</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs min-h-[44px]"
                >
                  Done & Close
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
