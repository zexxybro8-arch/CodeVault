import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { authenticateWithGoogle, checkRedirectAuthResult } from '../services/firebaseAuth';
import { User } from '../types';

interface UserLoginPageProps {
  onLoginSuccess: (user: User) => void;
  onOpenAdminLogin?: () => void;
  logoUrl?: string;
}

export const UserLoginPage: React.FC<UserLoginPageProps> = ({
  onLoginSuccess,
  onOpenAdminLogin,
  logoUrl
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  // Discreet tap counter on brand badge for authorized admin access
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for redirect result on mount (useful for mobile browsers utilizing redirect flow)
  useEffect(() => {
    let isMounted = true;
    const checkRedirect = async () => {
      try {
        const profile = await checkRedirectAuthResult();
        if (profile && isMounted) {
          setIsLoading(true);
          const res = await api.signInWithGoogle(profile);
          if (res.success && res.user && isMounted) {
            onLoginSuccess(res.user);
          }
        }
      } catch (err: any) {
        console.error('Redirect sign-in resolution error:', err);
        if (isMounted) {
          setErrorMessage(err?.message || 'Authentication failed. Please try again.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    checkRedirect();
    return () => {
      isMounted = false;
    };
  }, [onLoginSuccess]);

  const handleLogoTap = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 4) {
      clickCountRef.current = 0;
      if (onOpenAdminLogin) {
        onOpenAdminLogin();
      } else if (typeof window !== 'undefined') {
        window.location.hash = '#admin';
      }
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1500);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Launch official Google OAuth account chooser
      const profile = await authenticateWithGoogle();

      // 2. If user cancelled / closed Google account chooser window
      if (!profile) {
        setIsLoading(false);
        return;
      }

      // 3. Create or find CodeVault user account from official Google profile
      const res = await api.signInWithGoogle({
        googleId: profile.googleId,
        name: profile.name,
        email: profile.email,
        profileImage: profile.profileImage
      });

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage('Failed to initialize CodeVault session. Please try again.');
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setErrorMessage(err?.message || 'Google authentication encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-blue-600 selection:text-white font-sans">
      
      {/* Subtle Premium Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-50/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Login Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-white rounded-3xl sm:rounded-[32px] border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-9 space-y-7 animate-fadeIn">
        
        {/* ================================================== */}
        {/* 1. TOP BRANDING SECTION                            */}
        {/* ================================================== */}
        <div className="text-center space-y-3">
          
          {/* Logo Badge (with discreet multi-tap for staff) */}
          <button
            type="button"
            onClick={handleLogoTap}
            className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl mx-auto group cursor-pointer transition-transform active:scale-95"
            title="CodeVault"
          >
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl}
                alt="CodeVault Logo"
                onError={() => setLogoFailed(true)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain bg-white p-1 border border-slate-200 shadow-md shadow-slate-200/50"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-md shadow-blue-600/25 group-hover:bg-blue-700 transition-colors tracking-tighter">
                CV
              </div>
            )}
          </button>

          {/* Platform Title */}
          <div>
            <h1 className="font-display font-black text-2xl sm:text-[28px] tracking-tight text-slate-900 leading-none">
              <span className="text-blue-600">C</span>ode <span className="text-blue-600">V</span>ault
            </h1>
            <span className="block text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] uppercase text-slate-400 mt-1.5 leading-none">
              PREPAID PLATFORM
            </span>
          </div>

          {/* Professional Description */}
          <p className="text-xs sm:text-[13px] text-slate-500 font-medium leading-relaxed max-w-[290px] mx-auto pt-0.5">
            Your secure destination for digital redeem codes and prepaid products.
          </p>
        </div>

        {/* Subtle Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
        </div>

        {/* ================================================== */}
        {/* 2. GOOGLE LOGIN SECTION                            */}
        {/* ================================================== */}
        <div className="space-y-4">
          
          {/* Welcome & Prompt */}
          <div className="text-center space-y-1">
            <h2 className="text-xs font-black tracking-wider uppercase text-slate-800">
              WELCOME TO CODEVAULT
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sign in to continue
            </p>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Large Google Authentication Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100/90 border border-slate-200 text-slate-700 font-bold text-sm sm:text-[15px] rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer min-h-[52px] group"
          >
            {isLoading ? (
              <div className="flex items-center gap-2.5 text-slate-600">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                {/* Official Google Multi-Color G Icon */}
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
                <span className="text-slate-800 font-semibold tracking-tight">
                  Continue with Google
                </span>
              </>
            )}
          </button>

        </div>

        {/* ================================================== */}
        {/* 3. TRUST SECTION                                   */}
        {/* ================================================== */}
        <div className="pt-2 text-center space-y-1.5 border-t border-slate-100">
          
          <div className="inline-flex items-center justify-center gap-1.5 text-blue-600 font-black text-[11px] sm:text-xs tracking-wider uppercase">
            <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white shrink-0" />
            <span>TRUSTED BY THOUSANDS</span>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            Secure access &bull; Protected account
          </p>

        </div>

      </div>

    </div>
  );
};
