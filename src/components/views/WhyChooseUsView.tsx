import React from 'react';
import { ShieldCheck, Zap, Lock, RefreshCw, CheckCircle2, ShoppingBag } from 'lucide-react';

export const WhyChooseUsView: React.FC = () => {
  const features = [
    {
      title: 'Verified Redeem Codes',
      desc: '100% genuine and verified Google Play recharge codes directly issued for instant balance.',
      icon: CheckCircle2
    },
    {
      title: 'Secure & Reliable',
      desc: 'Bank-grade 256-bit encryption ensuring safe transactions and protected code delivery.',
      icon: Lock
    },
    {
      title: 'Instant Digital Delivery',
      desc: 'Receive your digital redeem code quickly after a successful order.',
      icon: Zap
    },
    {
      title: '24/7 Order Tracking',
      desc: 'Track your order status and access all past codes anytime from the MY ORDERS section.',
      icon: RefreshCw
    }
  ];

  return (
    <div className="py-10 sm:py-16 bg-white min-h-[500px] animate-fadeIn w-full max-w-full overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>PLATFORM GUARANTEE</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
            Why Choose <span className="text-blue-600">C</span>ode <span className="text-blue-600">V</span>ault?
          </h2>

          <p className="text-slate-600 text-xs sm:text-base font-medium leading-relaxed max-w-xl mx-auto">
            The most trusted marketplace for instant, secure, and 100% verified digital Google Play recharge codes.
          </p>
        </div>

        {/* 3 Large Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex items-center justify-between">
            <div>
              <div className="font-display font-black text-2xl sm:text-4xl text-blue-600 tracking-tight">
                50,000+
              </div>
              <div className="font-extrabold text-xs uppercase tracking-wider text-slate-800 mt-1">
                VERIFIED SALES
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Delivered to satisfied global members
              </div>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex items-center justify-between">
            <div>
              <div className="font-display font-black text-2xl sm:text-4xl text-blue-600 tracking-tight">
                Instant
              </div>
              <div className="font-extrabold text-xs uppercase tracking-wider text-slate-800 mt-1">
                DIGITAL DELIVERY
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Automated 24/7 virtual issuance
              </div>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex items-center justify-between col-span-1 sm:col-span-2 lg:col-span-1">
            <div>
              <div className="font-display font-black text-2xl sm:text-4xl text-blue-600 tracking-tight">
                100%
              </div>
              <div className="font-extrabold text-xs uppercase tracking-wider text-slate-800 mt-1">
                ORDER TRACKING
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Encrypted status tracking portal
              </div>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* 4 Feature Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4 border-t border-slate-100">
          {features.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200/80 space-y-3"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <IconComp className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
