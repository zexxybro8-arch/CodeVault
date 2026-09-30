import React from 'react';
import { Tag, HelpCircle, ShieldCheck } from 'lucide-react';

export type MainViewTab = 'REDEEM CODE' | 'HOW TO REDEEM' | 'WHY CHOOSE US';

interface MainNavigationProps {
  activeView: MainViewTab;
  onSelectView: (view: MainViewTab) => void;
}

export const MainNavigation: React.FC<MainNavigationProps> = ({ activeView, onSelectView }) => {
  const tabs: { id: MainViewTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'REDEEM CODE', label: 'REDEEM CODE', icon: Tag },
    { id: 'HOW TO REDEEM', label: 'HOW TO REDEEM', icon: HelpCircle },
    { id: 'WHY CHOOSE US', label: 'WHY CHOOSE US', icon: ShieldCheck }
  ];

  return (
    <nav className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 py-3 px-4 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="inline-flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 max-w-full overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectView(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center gap-2 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
