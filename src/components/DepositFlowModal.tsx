import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet, QrCode, Clock, CheckCircle2, Copy, Check,
  AlertCircle, ArrowRight, ArrowLeft, X, ShieldAlert, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { User, DepositAmount, DepositRequest } from '../types';

interface DepositFlowModalProps {
  user: User;
  onClose: () => void;
  onDepositSubmitted: (newDeposit: DepositRequest) => void;
}

export const DepositFlowModal: React.FC<DepositFlowModalProps> = ({
  user,
  onClose,
  onDepositSubmitted
}) => {
  const [step, setStep] = useState<'SELECT_AMOUNT' | 'PAYMENT_QR' | 'CONFIRMATION'>('SELECT_AMOUNT');
  const [depositAmounts, setDepositAmounts] = useState<DepositAmount[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<DepositAmount | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Payment Session & 5-Minute Timer
  const [sessionId, setSessionId] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 300 seconds = 5 mins
  const [isExpired, setIsExpired] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDeposit, setSubmittedDeposit] = useState<DepositRequest | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load configured deposit amounts from DB
  useEffect(() => {
    const loadAmounts = async () => {
      setIsLoading(true);
      try {
        const amounts = await api.getDepositAmounts({ forAdmin: false });
        setDepositAmounts(amounts);
        if (amounts.length > 0) {
          // Check for existing pending session
          const existingSession = api.getPaymentSession();
          if (existingSession && existingSession.expiresAt > Date.now()) {
            const matchAmt = amounts.find(a => a.id === existingSession.depositAmountId || a.amount === existingSession.amount);
            if (matchAmt) {
              setSelectedAmount(matchAmt);
              setSessionId(existingSession.sessionId);
              setExpiresAt(existingSession.expiresAt);
              setStep('PAYMENT_QR');
            } else {
              setSelectedAmount(amounts[0]);
            }
          } else {
            // Default select ₹500 if available or first
            const default500 = amounts.find(a => a.amount === 500) || amounts[0];
            setSelectedAmount(default500);
          }
        }
      } catch (err) {
        console.error('Failed to load deposit amounts', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAmounts();
  }, []);

  // 5-Minute Timer Countdown Effect
  useEffect(() => {
    if (step === 'PAYMENT_QR' && expiresAt > 0) {
      if (timerRef.current) clearInterval(timerRef.current);

      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeft(diff);

        if (diff <= 0) {
          setIsExpired(true);
          api.clearPaymentSession();
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setIsExpired(false);
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [step, expiresAt]);

  // Start Payment Session
  const handleProceedToPayment = () => {
    if (!selectedAmount && !customAmount) return;

    let targetAmt = selectedAmount;
    const numCustom = Number(customAmount);
    if (numCustom && numCustom > 0) {
      targetAmt = {
        id: `dep_amt_custom_${numCustom}`,
        amount: numCustom,
        qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=codevault.pay@okaxis&pn=CodeVault%20Official&am=${numCustom}&cu=INR`,
        upiId: 'codevault.pay@okaxis',
        receiverName: `CodeVault Official (₹${numCustom})`,
        enabled: true,
        displayOrder: 99,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSelectedAmount(targetAmt);
    }

    if (!targetAmt) return;

    const newSessionId = `sess_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const expiry = Date.now() + 300 * 1000; // 5 minutes exactly

    setSessionId(newSessionId);
    setExpiresAt(expiry);
    setTimeLeft(300);
    setIsExpired(false);
    setQrImageError(false);

    api.savePaymentSession({
      sessionId: newSessionId,
      amount: targetAmt.amount,
      depositAmountId: targetAmt.id,
      expiresAt: expiry
    });

    setStep('PAYMENT_QR');
  };

  // Format Timer mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy UPI
  const handleCopyUpi = (upi: string) => {
    navigator.clipboard.writeText(upi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Submit "I HAVE PAID"
  const handleConfirmPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired || !selectedAmount) return;

    setIsSubmitting(true);
    try {
      const deposit = await api.createDepositRequest({
        userId: user.id,
        amount: selectedAmount.amount,
        depositAmountId: selectedAmount.id,
        paymentSessionId: sessionId || `sess_${Date.now()}`,
        utrNumber: utrNumber.trim()
      });

      setSubmittedDeposit(deposit);
      onDepositSubmitted(deposit);
      setStep('CONFIRMATION');
    } catch (err) {
      console.error('Failed to submit deposit', err);
      alert('Failed to submit deposit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effective QR URL with robust fallback
  const getQrUrl = () => {
    if (!selectedAmount) return '';
    if (qrImageError || !selectedAmount.qrUrl) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${encodeURIComponent(selectedAmount.upiId || 'codevault.pay@okaxis')}&pn=${encodeURIComponent(selectedAmount.receiverName || 'CodeVault Official')}&am=${selectedAmount.amount}&cu=INR`;
    }
    return selectedAmount.qrUrl;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full space-y-5 shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">Add Money to Wallet</h3>
              <p className="text-[11px] font-semibold text-slate-400">Direct UPI Deposit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- STEP 1: SELECT DEPOSIT AMOUNT --- */}
        {step === 'SELECT_AMOUNT' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Select Deposit Amount (₹)
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {depositAmounts.map(amt => {
                  const isSelected = selectedAmount?.id === amt.id && !customAmount;
                  return (
                    <button
                      key={amt.id}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`p-3 rounded-2xl border-2 font-mono font-black text-sm transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer min-h-[56px] ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <span className="text-base font-black">₹{amt.amount}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Fast QR</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount option */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Or Enter Other Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-mono font-bold text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={customAmount}
                  onChange={e => {
                    setCustomAmount(e.target.value);
                    if (e.target.value) setSelectedAmount(null);
                  }}
                  className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Summary preview */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
              <span className="font-bold text-slate-600">Deposit Total:</span>
              <span className="font-mono font-black text-base text-blue-600">
                ₹{customAmount ? Number(customAmount) || 0 : (selectedAmount?.amount || 0)}
              </span>
            </div>

            <button
              onClick={handleProceedToPayment}
              disabled={(!selectedAmount && !customAmount) || isLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[48px]"
            >
              <span>CONTINUE TO PAYMENT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- STEP 2: PAYMENT QR & 5-MINUTE COUNTDOWN --- */}
        {step === 'PAYMENT_QR' && selectedAmount && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Top Back & Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('SELECT_AMOUNT')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Amount</span>
              </button>
              <span className="text-xs font-mono font-bold text-slate-400">
                ID: {sessionId.slice(0, 14)}
              </span>
            </div>

            {/* Amount Banner */}
            <div className="text-center bg-blue-50 border border-blue-100 rounded-2xl p-3">
              <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider block">Total Payable</span>
              <div className="text-3xl font-mono font-black text-slate-900 tracking-tight">
                ₹{selectedAmount.amount}
              </div>
            </div>

            {/* 5-Minute Timer Banner */}
            <div className={`p-3 rounded-2xl border text-center space-y-0.5 transition-colors ${
              isExpired
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : timeLeft < 60
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
                <Clock className={`w-4 h-4 ${isExpired ? 'text-rose-600' : 'text-blue-600'}`} />
                <span>{isExpired ? 'Payment Session Expired' : 'Complete your payment within'}</span>
              </div>
              <div className={`font-mono font-black text-xl tracking-wider ${isExpired ? 'text-rose-600' : 'text-blue-600'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3 shadow-2xs">
              <div className="relative inline-block bg-white p-2 rounded-2xl shadow-inner border border-slate-100">
                <img
                  src={getQrUrl()}
                  alt={`UPI QR for ₹${selectedAmount.amount}`}
                  onError={() => setQrImageError(true)}
                  className={`w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded-xl ${
                    isExpired ? 'opacity-20 blur-xs' : ''
                  }`}
                />
                {isExpired && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/60 rounded-xl text-white text-center space-y-1">
                    <ShieldAlert className="w-8 h-8 text-rose-400" />
                    <span className="text-xs font-extrabold">SESSION EXPIRED</span>
                    <button
                      onClick={handleProceedToPayment}
                      className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg shadow-xs mt-1"
                    >
                      Start New Session
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-extrabold text-slate-800">
                  Scan the QR code using your UPI app
                </p>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Google Pay, PhonePe, Paytm, BHIM, CRED
                </p>
              </div>

              {/* UPI ID Details */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2">
                <div className="text-left truncate">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">UPI ID</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px] truncate block">
                    {selectedAmount.upiId || 'codevault.pay@okaxis'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyUpi(selectedAmount.upiId || 'codevault.pay@okaxis')}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-[11px] text-blue-600 flex items-center gap-1 shrink-0"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleConfirmPaid} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  UPI Reference / UTR Number (Optional, for faster verification)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 519283746192 (12-digit UTR)"
                  value={utrNumber}
                  onChange={e => setUtrNumber(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono text-xs font-bold"
                  disabled={isExpired}
                />
              </div>

              <button
                type="submit"
                disabled={isExpired || isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[48px]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Request...' : 'I HAVE PAID'}</span>
              </button>

              <p className="text-[10px] text-center text-slate-400 font-medium leading-tight">
                After clicking "I HAVE PAID", our automated admin verification team verifies the transaction and credits your wallet within a few minutes.
              </p>
            </form>
          </div>
        )}

        {/* --- STEP 3: CONFIRMATION VIEW --- */}
        {step === 'CONFIRMATION' && submittedDeposit && (
          <div className="space-y-5 text-center py-3 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">Deposit Request Submitted</h3>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                Your deposit of <strong className="text-slate-900">₹{submittedDeposit.amount}</strong> is received and pending admin approval.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-left space-y-2 font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-500">Request ID:</span>
                <span className="font-mono text-slate-900 font-bold">{submittedDeposit.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-mono text-emerald-600 font-bold">₹{submittedDeposit.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                  PENDING VERIFICATION
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date / Time:</span>
                <span className="text-slate-700">{new Date(submittedDeposit.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-xs transition-all cursor-pointer"
            >
              Back to CodeVault
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
