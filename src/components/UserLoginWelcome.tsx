import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { UserSession } from '../types';
import { LogIn, Mail, Lock, Eye, EyeOff, ShieldCheck, Zap, Sparkles, CheckCircle2 } from 'lucide-react';

interface UserLoginWelcomeProps {
  onLoginSuccess: (user: UserSession) => void;
  onOpenAdmin?: () => void;
  logoutMessage?: string | null;
}

export const UserLoginWelcome: React.FC<UserLoginWelcomeProps> = ({
  onLoginSuccess,
  onOpenAdmin,
  logoutMessage
}) => {
  const [emailOrPhone, setEmailOrPhone] = useState('alex.mercer@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Discreet 3-tap counter on logo badge for authenticated admin access
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoTap = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      if (onOpenAdmin) onOpenAdmin();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1500);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!emailOrPhone.trim()) {
      setErrorMsg('Please enter your email or mobile phone.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.userLogin(emailOrPhone.trim(), password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Unable to sign in. Please verify your details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmailOrPhone('alex.mercer@example.com');
    setPassword('password123');
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.userLogin('alex.mercer@example.com', 'password123');
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 font-sans text-slate-100 selection:bg-blue-600 selection:text-white w-full max-w-full overflow-x-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        
        {/* Brand Lockup */}
        <div className="text-center space-y-3">
          <button 
            type="button"
            onClick={handleLogoTap}
            title="Code Vault (Tap 3x for Admin)"
            className="inline-flex items-center gap-3 p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl group transition-transform active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-600/30 group-hover:bg-blue-500 transition-colors shrink-0">
              CV
            </div>
            <div className="text-left">
              <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white leading-none">
                <span className="text-blue-500">C</span>ode <span className="text-blue-500">V</span>ault
              </h1>
              <p className="text-[10px] font-extrabold tracking-widest uppercase text-blue-400 mt-1">
                PREPAID PLATFORM
              </p>
            </div>
          </button>
          
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            Sign in to access your prepaid marketplace, orders, and instant redeem vouchers.
          </p>
        </div>

        {/* LOGOUT SUCCESS NOTIFICATION */}
        {logoutMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fadeIn shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{logoutMessage}</span>
          </div>
        )}

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Sign In Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 p-5 sm:p-7 rounded-3xl shadow-2xl space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div>
              <h2 className="text-base font-black text-white">Customer Sign In</h2>
              <p className="text-[11px] text-slate-400 font-medium">Welcome back! Access your account</p>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-extrabold">
              USER PORTAL
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4 text-xs font-bold">
            
            {/* Email or Phone Input */}
            <div className="space-y-1.5">
              <label className="text-slate-300 block text-[11px] uppercase tracking-wider font-extrabold">
                Email Address or Mobile Phone
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. alex.mercer@example.com"
                  value={emailOrPhone}
                  onChange={e => setEmailOrPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 block text-[11px] uppercase tracking-wider font-extrabold">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all min-h-[46px] disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Signing In...' : 'Sign In to Code Vault'}</span>
            </button>

            {/* Quick Demo Customer Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white font-extrabold text-[11px] rounded-xl border border-slate-600/50 flex items-center justify-center gap-2 transition-colors min-h-[40px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Quick Sign In: Demo Customer (Alex Mercer)</span>
              </button>
            </div>

          </form>

        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400 font-bold">
          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Instant Delivery</span>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Codes</span>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Safe & Secure</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 font-semibold">
          Code Vault • Trusted Digital Prepaid Marketplace
        </div>

      </div>

    </div>
  );
};
