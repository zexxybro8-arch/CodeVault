import React, { useState } from 'react';
import { api } from '../services/api';
import { User, Lock, Eye, EyeOff, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

interface AdminSignInProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const AdminSignIn: React.FC<AdminSignInProps> = ({ onSuccess, onCancel }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!userId.trim() || !password.trim()) {
      setErrorMsg('Please enter both User ID and Password.');
      return;
    }

    setIsLoading(true);
    const res = await api.adminLogin({ userId: userId.trim(), password: password.trim() });
    setIsLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg('Invalid User ID or Password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-6 selection:bg-blue-600 selection:text-white w-full max-w-full overflow-x-hidden">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 max-w-md w-full space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Brand Lockup */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 text-white font-black text-xl sm:text-2xl flex items-center justify-center mx-auto shadow-md tracking-tighter">
            CV
          </div>
          <div>
            <span className="font-display font-black text-2xl text-slate-900 tracking-tight">
              <span className="text-blue-600">C</span>ode <span className="text-blue-600">V</span>ault
            </span>
            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">
              PREPAID PLATFORM MANAGEMENT
            </span>
          </div>

          <div className="pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>ADMIN SIGN IN</span>
            </div>
          </div>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          
          {/* User ID / Username */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              User ID / Username
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter Admin User ID"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all min-h-[44px]"
                autoComplete="off"
                autoFocus
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all min-h-[44px]"
                autoComplete="off"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-slate-400 hover:text-slate-600 absolute right-2 top-2 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 min-h-[48px]"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <span>SIGN IN TO ADMIN PANEL →</span>
            )}
          </button>

        </form>

        {/* Footer Note & Marketplace Link */}
        <div className="space-y-3 text-center">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors py-1 inline-block"
            >
              ← Continue to Customer Marketplace
            </button>
          )}
          <p className="text-[11px] font-semibold text-slate-400">
            Code Vault Secure Server Session • 256-Bit Encrypted
          </p>
        </div>

      </div>
    </div>
  );
};
