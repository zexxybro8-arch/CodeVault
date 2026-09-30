import React from 'react';
import { Tag, Smartphone, User, CreditCard, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react';

export const HowToRedeemView: React.FC = () => {
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
      desc: 'Enter your Google Play code, tap Redeem, and confirm the Google Account.',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="py-16 bg-white min-h-[500px] animate-fadeIn">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide uppercase">
            <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>REDEMPTION GUIDE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
            How to Redeem a Google Play Code?
          </h2>

          <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed max-w-xl mx-auto">
            Redeem your Google Play code and add the balance to your Google Play account in just a few simple steps.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(st => {
            const IconComp = st.icon;
            return (
              <div
                key={st.num}
                className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {st.num}
                    </span>
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <IconComp className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base">
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

        {/* Account Note & Action Banner */}
        <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-3 text-xs text-slate-700 font-medium leading-relaxed">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-sm mb-0.5">Account Verification</span>
              Make sure you redeem the code on the correct Google Account. Once redeemed, the balance will be added to that account.
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
    </div>
  );
};
