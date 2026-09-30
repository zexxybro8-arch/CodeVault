import React from 'react';
import { Tag, ExternalLink, AlertCircle, Smartphone, User, CreditCard, CheckCircle2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Open Google Play',
      desc: 'Open the Google Play Store app on your Android device.',
      icon: Smartphone
    },
    {
      num: '02',
      title: 'Open Your Profile',
      desc: 'Tap your profile picture in the top-right corner.',
      icon: User
    },
    {
      num: '03',
      title: 'Select Redeem Code',
      desc: 'Tap Payments & subscriptions, then select Redeem code.',
      icon: CreditCard
    },
    {
      num: '04',
      title: 'Enter & Redeem',
      desc: 'Enter your Google Play code, tap Redeem, and confirm the Google Account where you want to add the balance.',
      icon: CheckCircle2
    }
  ];

  return (
    <section id="how-it-works" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide uppercase shadow-2xs">
            <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>HOW TO REDEEM</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
            How to Redeem a Google Play Code?
          </h2>

          <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
            Redeem your Google Play code and add the balance to your Google Play account in just a few simple steps.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st) => {
            const IconComp = st.icon;
            return (
              <div
                key={st.num}
                className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-blue-600 text-white font-mono font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {st.num}
                    </span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <IconComp className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base pt-1">
                    {st.title}
                  </h3>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note & Action Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
          <div className="flex items-start gap-3.5 text-xs text-slate-700 font-medium leading-relaxed">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0 border border-amber-200/80 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-sm mb-0.5">Important Redemption Note</span>
              Make sure you are redeeming the code on the correct Google Account. Once redeemed, the balance will be added to that account.
            </div>
          </div>

          <a
            href="https://play.google.com/store/redeem"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
          >
            <span>OPEN GOOGLE PLAY</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

      </div>
    </section>
  );
};
