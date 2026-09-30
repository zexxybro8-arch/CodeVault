import React from 'react';
import { ShieldCheck, Zap, Lock, RefreshCw, CheckCircle2, ShoppingBag } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const highlights = [
    {
      title: 'Instant Digital Delivery',
      desc: 'Receive your Google Play digital code instantly on screen and via email confirmation.',
      icon: Zap
    },
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
      title: '24/7 Order Tracking',
      desc: 'Access and view all your past digital code purchases anytime in your MY ORDERS portal.',
      icon: RefreshCw
    }
  ];

  const infoBlocks = [
    {
      title: 'VERIFIED SALES',
      desc: 'Thousands of successful digital-code orders delivered to customers.',
      icon: ShoppingBag
    },
    {
      title: 'INSTANT DELIVERY',
      desc: 'Receive your digital redeem code quickly after a successful order.',
      icon: Zap
    },
    {
      title: 'ORDER TRACKING',
      desc: 'Track your order status from the MY ORDERS section.',
      icon: ShieldCheck
    }
  ];

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>PREMIUM GUARANTEE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
            WHY CHOOSE BLACK X?
          </h2>

          <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
            The most trusted marketplace for instant, secure, and 100% verified digital Google Play recharge codes.
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item, idx) => {
            const IconC = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:bg-white hover:shadow-md transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <IconC className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* 3 Detailed Info Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {infoBlocks.map((block, idx) => {
            const IconC = block.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-start gap-4"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <IconC className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                    {block.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                    {block.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
