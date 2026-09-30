import React from 'react';
import { ShoppingBag, Zap, ShieldCheck } from 'lucide-react';

export const Stats: React.FC = () => {
  const statsList = [
    {
      number: '50,000+',
      label: 'VERIFIED SALES',
      subtext: 'Delivered to satisfied global members',
      icon: ShoppingBag
    },
    {
      number: 'Instant',
      label: 'DELIVERY',
      subtext: 'Automated 24/7 virtual card issuance',
      icon: Zap
    },
    {
      number: '100%',
      label: 'ORDER TRACKING',
      subtext: 'Encrypted code & card status portal',
      icon: ShieldCheck
    }
  ];

  return (
    <section className="bg-slate-50 py-12 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsList.map((stat, idx) => {
            const IconComp = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="font-display font-black text-3xl sm:text-4xl text-blue-600 tracking-tight">
                    {stat.number}
                  </div>
                  <div className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                    {stat.label}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {stat.subtext}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <IconComp className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
