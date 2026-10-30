'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  isSubscribed: boolean;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS' | null;
  subscriptionExpiresAt: string | null;
  avatarUrl?: string;
  provider?: 'credentials' | 'google';
  paymentMethod?: 'CRYPTO' | 'CARD';
  cryptoCurrency?: string;
  cryptoTxHash?: string;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email?: string, name?: string, credential?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string; requiresSubscription?: boolean }>;
  logout: () => void;
  subscribe: (
    plan: 'STARTER' | 'PRO' | 'BUSINESS',
    paymentInfo?: { paymentMethod?: 'CRYPTO' | 'CARD'; cryptoCurrency?: string; cryptoTxHash?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isSubscriptionModalOpen: boolean;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;
  isGoogleGuideOpen: boolean;
  openGoogleGuide: () => void;
  closeGoogleGuide: () => void;
  isAdminModalOpen: boolean;
  openAdminModal: () => void;
  closeAdminModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isGoogleGuideOpen, setIsGoogleGuideOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Load user session on mount across subdomains (SSO cookie verification)
  useEffect(() => {
    async function loadUser() {
      try {
        // Check server session via SSO cookie (/api/auth/me)
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem('ultrapie_user_session', JSON.stringify(data.user));
            return;
          }
        }

        // If server returned null, check local storage
        const stored = localStorage.getItem('ultrapie_user_session');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUser(parsed);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Failed to load user session:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      setUser(data.user);
      localStorage.setItem('ultrapie_user_session', JSON.stringify(data.user));
      setIsAuthModalOpen(false);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  }, []);

  const loginWithGoogle = useCallback(async (customEmail?: string, customName?: string, credential?: string) => {
    try {
      // If client provided a credential from Google One Tap or Google Sign-In SDK
      if (credential || (customEmail && customName)) {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential,
            email: customEmail,
            name: customName,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Google login failed' };
        }
        setUser(data.user);
        localStorage.setItem('ultrapie_user_session', JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        return { success: true };
      }

      // Check if Google OAuth Client ID is configured on the server
      const configRes = await fetch('/api/auth/google');
      const configData = await configRes.json();
      if (!configData.configured) {
        // Open the Google Cloud setup guide modal and let user know
        setIsAuthModalOpen(false);
        setIsGoogleGuideOpen(true);
        return {
          success: false,
          error: 'Google OAuth Client ID is not configured yet. Please configure it in Google Cloud Console or sign in with Email & Password.',
        };
      }

      // If configured, redirect to Google OAuth flow
      window.location.href = '/api/auth/google';
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google Auth Error' };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      setUser(data.user);
      localStorage.setItem('ultrapie_user_session', JSON.stringify(data.user));
      setIsAuthModalOpen(false);

      // New users can select a monthly subscription
      if (!data.user.isSubscribed) {
        setIsSubscriptionModalOpen(true);
      }

      return { success: true, requiresSubscription: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // non-fatal
    }
    setUser(null);
    localStorage.removeItem('ultrapie_user_session');
    setIsAdminModalOpen(false);
  }, []);

  const subscribe = useCallback(async (
    plan: 'STARTER' | 'PRO' | 'BUSINESS',
    paymentInfo?: { paymentMethod?: 'CRYPTO' | 'CARD'; cryptoCurrency?: string; cryptoTxHash?: string }
  ) => {
    try {
      if (!user) {
        setIsAuthModalOpen(true);
        return { success: false, error: 'Please login or register first' };
      }

      const res = await fetch('/api/auth/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          plan,
          paymentMethod: paymentInfo?.paymentMethod || 'CARD',
          cryptoCurrency: paymentInfo?.cryptoCurrency,
          cryptoTxHash: paymentInfo?.cryptoTxHash,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Subscription failed' };
      }

      setUser(data.user);
      localStorage.setItem('ultrapie_user_session', JSON.stringify(data.user));
      setIsSubscriptionModalOpen(false);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Subscription processing failed' };
    }
  }, [user]);

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openSubscriptionModal = useCallback(() => {
    setIsSubscriptionModalOpen(true);
  }, []);

  const closeSubscriptionModal = useCallback(() => {
    setIsSubscriptionModalOpen(false);
  }, []);

  const openGoogleGuide = useCallback(() => {
    setIsAuthModalOpen(false);
    setIsGoogleGuideOpen(true);
  }, []);

  const closeGoogleGuide = useCallback(() => {
    setIsGoogleGuideOpen(false);
    setIsAuthModalOpen(true);
  }, []);

  const openAdminModal = useCallback(() => {
    setIsAdminModalOpen(true);
  }, []);

  const closeAdminModal = useCallback(() => {
    setIsAdminModalOpen(false);
  }, []);

  const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        login,
        loginWithGoogle,
        register,
        logout,
        subscribe,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        isSubscriptionModalOpen,
        openSubscriptionModal,
        closeSubscriptionModal,
        isGoogleGuideOpen,
        openGoogleGuide,
        closeGoogleGuide,
        isAdminModalOpen,
        openAdminModal,
        closeAdminModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
