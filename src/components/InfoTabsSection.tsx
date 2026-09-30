import React, { useState } from 'react';
import { Tag, HelpCircle, ShieldCheck, CheckCircle2, ExternalLink, Smartphone, User, CreditCard, ShoppingBag, Zap, RefreshCw, Lock } from 'lucide-react';

export const InfoTabsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'redeem' | 'how' | 'why'>('redeem');

  return (
    <section className="py-12 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* TAB BUTTONS HEADER */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-x-auto max-w-full no-scrollbar">
            
            {/* TAB 1: REDEEM CODE */}
            <button
              onClick={() => setActiveTab('redeem')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'redeem'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>REDEEM CODE</span>
            </button>

            {/* TAB 2: HOW TO REDEEM */}
            <button
              onClick={() => setActiveTab('how')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'how'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>HOW TO REDEEM</span>
            </button>

            {/* TAB 3: WHY CHOOSE US */}
            <button
              onClick={() => setActiveTab('why')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                activeTab === 'why'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>WHY CHOOSE US</span>
            </button>

          </div>
        </div>

        {/* TAB CONTENT PANELS */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm min-h-[320px] transition-all duration-300">
          
          {/* ==================== TAB 1: REDEEM CODE ==================== */}
          {activeTab === 'redeem' && (
            <div className="animate-fadeIn space-y-6 max-w-3xl mx-auto text-center sm:text-left">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Play Balance</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                  Google Play Redeem Codes
                </h3>
                <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
                  Get verified Google Play redeem codes with instant digital delivery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  'Verified digital codes',
                  'Instant delivery',
                  'Multiple denominations',
                  'Secure order tracking'
                ].map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 font-extrabold text-xs sm:text-sm text-slate-800"
                  >
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== TAB 2: HOW TO REDEEM ==================== */}
          {activeTab === 'how' && (
            <div className="animate-fadeIn space-y-8 max-w-4xl mx-auto">
              <div className="text-center space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                  How to Redeem a Google Play Code?
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Follow these 4 simple steps to add balance to your account.
                </p>
              </div>

              {/* 4 Steps Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
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
                ].map(st => {
                  const IconC = st.icon;
                  return (
                    <div
                      key={st.num}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-black text-xs flex items-center justify-center">
                          {st.num}
                        </span>
                        <IconC className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{st.title}</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{st.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <p className="text-xs font-bold text-slate-700 text-center sm:text-left">
                   Make sure you redeem the code on the correct Google Account.
                </p>
                <a
                  href="https://play.google.com/store/redeem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5 shrink-0"
                >
                  <span>OPEN GOOGLE PLAY</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* ==================== TAB 3: WHY CHOOSE US ==================== */}
          {activeTab === 'why' && (
            <div className="animate-fadeIn space-y-8 max-w-4xl mx-auto">
              <div className="text-center space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                  Why Choose <span className="text-blue-600">C</span>ode <span className="text-blue-600">V</span>ault?
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                  Trusted digital voucher platform delivering 100% verified codes.
                </p>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                  <div className="font-display font-black text-2xl sm:text-3xl text-blue-600">50,000+</div>
                  <div className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">VERIFIED SALES</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                  <div className="font-display font-black text-2xl sm:text-3xl text-blue-600">Instant</div>
                  <div className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">DIGITAL DELIVERY</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                  <div className="font-display font-black text-2xl sm:text-3xl text-blue-600">100%</div>
                  <div className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">ORDER TRACKING</div>
                </div>
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  'Verified Redeem Codes',
                  'Secure & Reliable',
                  'Fast Digital Delivery',
                  '24/7 Order Tracking'
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center font-extrabold text-xs text-slate-800 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
