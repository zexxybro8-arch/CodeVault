import React from 'react';
import { LogOut, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  onCancel,
  onConfirm
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn w-full max-w-full"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
    >
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto p-6 sm:p-7 text-center space-y-4 animate-scaleIn">
        
        {/* Close Icon Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Logout Icon Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <LogOut className="w-6 h-6" />
        </div>

        {/* Text */}
        <div className="space-y-1">
          <h3
            id="logout-confirm-title"
            className="text-base sm:text-lg font-black text-slate-900 tracking-tight"
          >
            Confirm Log Out
          </h3>
          <p className="text-sm text-slate-600 font-semibold">
            Are you sure you want to log out?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-extrabold text-xs sm:text-sm rounded-xl transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};
