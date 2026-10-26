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
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email?: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string; requiresSubscription?: boolean }>;
  logout: () => void;
  subscribe: (plan: 'STARTER' | 'PRO' | 'BUSINESS') => Promise<{ success: boolean; error?: string }>;
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

  // Load user session on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const stored = localStorage.getItem('ultrapie_user_session');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUser(parsed);
          } catch {
            setUser(null);
          }
        } else {
          // Check if user previously logged out
          const hasVisited = localStorage.getItem('ultrapie_has_visited');
          if (!hasVisited) {
            // First visit master owner initialization
            const defaultAdmin: UserSession = {
              id: 'usr_master_001',
              name: 'Elhoussine Soutih',
              email: 'zohodigital.com@gmail.com',
              role: 'OWNER',
              isSubscribed: true,
              plan: 'PRO',
              subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              provider: 'credentials',
            };
            setUser(defaultAdmin);
            localStorage.setItem('ultrapie_user_session', JSON.stringify(defaultAdmin));
            localStorage.setItem('ultrapie_has_visited', 'true');
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Failed to load user session:', err);
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
        return { success: false, error: data.error || 'Login failed' };
      }

      setUser(data.user);
      localStorage.setItem('ultrapie_user_session', JSON.stringify(data.user));
      localStorage.setItem('ultrapie_has_visited', 'true');
      setIsAuthModalOpen(false);

      if (!data.user.isSubscribed) {
        setIsSubscriptionModalOpen(true);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const loginWithGoogle = useCallback(async (customEmail?: string, customName?: string) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customEmail || user?.email || 'zohodigital.com@gmail.com',
          name: customName || user?.name || 'Elhoussine Soutih',
          avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocLQeK_Google_Profile',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Google login failed' };
      }

      setUser(data.user);
      localStorage.setItem('ultrapie_user_session', JSON.stringify(data.user));
      localStorage.setItem('ultrapie_has_visited', 'true');
      setIsAuthModalOpen(false);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google Auth Error' };
    }
  }, [user]);

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
      localStorage.setItem('ultrapie_has_visited', 'true');
      setIsAuthModalOpen(false);

      // New users must select a monthly subscription
      if (!data.user.isSubscribed) {
        setIsSubscriptionModalOpen(true);
      }

      return { success: true, requiresSubscription: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('ultrapie_user_session');
    localStorage.setItem('ultrapie_has_visited', 'true');
    setIsAdminModalOpen(false);
  }, []);

  const subscribe = useCallback(async (plan: 'STARTER' | 'PRO' | 'BUSINESS') => {
    try {
      if (!user) {
        setIsAuthModalOpen(true);
        return { success: false, error: 'Please login or register first' };
      }

      const res = await fetch('/api/auth/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, plan }),
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
