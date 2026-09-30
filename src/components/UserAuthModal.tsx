import React, { useState } from 'react';
import { Shield, Sparkles, AlertCircle, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface UserAuthModalProps {
  onSuccess: (user: User) => void;
  onCancel: () => void;
  onOpenAdminLogin?: () => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  onSuccess,
  onCancel,
  onOpenAdminLogin
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Direct Google Identity Simulation & OAuth Payload
      // Normal users authenticate with their Google Profile
      const randomGoogleId = `10${Math.floor(10000000000000000 + Math.random() * 90000000000000000)}`;
      const sampleNames = ['Aarav Sharma', 'Priya Patel', 'Rohan Verma', 'Ananya Iyer', 'Vikram Malhotra', 'Siddharth Rao'];
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const sampleEmail = `${randomName.toLowerCase().replace(' ', '.')}${Math.floor(10 + Math.random() * 90)}@gmail.com`;
      const sampleAvatars = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
      ];
      const randomAvatar = sampleAvatars[Math.floor(Math.random() * sampleAvatars.length)];

      const res = await api.signInWithGoogle({
        googleId: randomGoogleId,
        name: randomName,
        email: sampleEmail,
        profileImage: randomAvatar
      });

      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setError('Failed to authenticate with Google. Please try again.');
      }
    } catch (err: any) {
      console.error('Google Sign-In error', err);
      setError(err?.message || 'Google authentication encountered an issue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/25 mx-auto">
            CV
          </div>
          <div>
            <h2 className="font-display font-black text-2xl text-slate-900 tracking-tight">
              Sign In to <span className="text-blue-600">CodeVault</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              The Most Trusted Premium Card & Digital Code Platform
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Benefits Cards */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2.5 font-bold text-slate-800">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-[10px]">✓</div>
            <span>Instant Digital Wallet & Recharge Vouchers</span>
          </div>
          <div className="flex items-center gap-2.5 font-bold text-slate-800">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-[10px]">✓</div>
            <span>Fast & Secure Deposit via UPI QR</span>
          </div>
          <div className="flex items-center gap-2.5 font-bold text-slate-800">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-[10px]">✓</div>
            <span>Real-time Order History & Revealed Code Access</span>
          </div>
        </div>

        {/* Dedicated "Continue with Google" Authentication */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 text-slate-800 font-extrabold text-sm rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer min-h-[50px] group"
          >
            {/* Google G Logo SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isLoading ? 'Connecting with Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Terms footer */}
        <p className="text-[11px] text-center text-slate-400 font-medium">
          By continuing, you agree to CodeVault's Terms of Service and Privacy Policy.
        </p>

        {/* Optional Admin Link for staff */}
        {onOpenAdminLogin && (
          <div className="border-t border-slate-100 pt-3 text-center">
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors"
            >
              Administrator Sign In &rarr;
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
