import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with OpenID & Account Chooser prompt
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('openid');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface GoogleProfileResult {
  googleId: string;
  name: string;
  email: string;
  profileImage: string;
}

/**
 * Initiates the official Google Authentication / OAuth flow.
 * Displays Google's native account chooser with registered accounts on device.
 */
export async function authenticateWithGoogle(): Promise<GoogleProfileResult | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    if (!fbUser || !fbUser.email) {
      throw new Error('Google did not return an authorized email address.');
    }

    return {
      googleId: fbUser.uid,
      name: fbUser.displayName || fbUser.email.split('@')[0],
      email: fbUser.email,
      profileImage: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    };
  } catch (error: any) {
    // 1. User cancelled or closed the account selection window
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('closed-by-user')
    ) {
      return null;
    }

    // 2. Popup blocked on restrictive mobile environment - fallback to redirect flow
    if (error?.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr) {
        console.error('Redirect sign-in error:', redirectErr);
        throw new Error('Pop-up was blocked. Please allow pop-ups and try again.');
      }
    }

    // 3. Unauthorized domain error guidance
    if (error?.code === 'auth/unauthorized-domain') {
      console.warn('Firebase Auth: Current domain is not in authorized domains list.');
      throw new Error('Domain not authorized for Google Sign-In in Firebase Console. Please contact support or verify domain configuration.');
    }

    console.error('Firebase Google Sign-In error:', error);
    throw new Error(error?.message || 'Google authentication failed. Please try again.');
  }
}

/**
 * Checks for authentication result if redirect flow was triggered.
 */
export async function checkRedirectAuthResult(): Promise<GoogleProfileResult | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user && result.user.email) {
      const fbUser = result.user;
      return {
        googleId: fbUser.uid,
        name: fbUser.displayName || fbUser.email.split('@')[0],
        email: fbUser.email,
        profileImage: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      };
    }
  } catch (err: any) {
    if (err?.code !== 'auth/popup-closed-by-user') {
      console.warn('Redirect auth check error:', err);
    }
  }
  return null;
}

/**
 * Signs out from Firebase Google session
 */
export async function signOutFromGoogle(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Error signing out from Google Firebase Auth:', err);
  }
}
