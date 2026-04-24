import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Alert } from 'react-native';
import { User, AuthTokens, AuthContextValue } from '../types';
import { authService } from '../services/auth.service';
import { apiService } from '../services/api.service';
import { syncService } from '../services/sync.service';
import { registerPushToken, deactivatePushToken } from '../services/pushNotification.service';
import { navigate } from '../navigation/AppNavigator';

type AuthStatus = 'initializing' | 'anonymous' | 'authenticated';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  // Derived values — single source of truth từ status
  const isLoading = status === 'initializing';
  const isAnonymous = status === 'anonymous';
  const isAuthenticated = status === 'authenticated';
  const isEmailVerified = user?.emailVerified ?? false;

  // Stable ref để apiService callback không giữ stale closure
  const logoutRef = useRef<() => Promise<void>>(async () => {});

  // ── helpers ──────────────────────────────────────────────────────────────

  function applySession(session: { user: User; tokens: AuthTokens }) {
    setUser(session.user);
    setTokens(session.tokens);
    setStatus(session.user.isAnonymous ? 'anonymous' : 'authenticated');
  }

  async function startAnonymousSession(): Promise<void> {
    const session = await authService.createAnonymousSession();
    applySession(session);
    registerPushToken().catch(err => console.warn('Push token registration failed:', err));
  }

  // ── khởi tạo ─────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const session = await authService.autoLogin();
        if (session) {
          applySession(session);
          registerPushToken().catch(err => console.warn('Push token registration failed:', err));
          if (!session.user.isAnonymous) {
            syncService.sync().catch(err => console.warn('Startup sync failed:', err));
          }
        } else {
          await startAnonymousSession();
        }
      } catch (err) {
        console.error('Initialisation failed:', err);
        try { await startAnonymousSession(); } catch {}
      }
    })();
  }, []);

  // ── callback 401 / 403 ───────────────────────────────────────────────────

  useEffect(() => {
    apiService.setOnAccountDeactivated(async () => {
      await authService.clearLocalSession();
      setUser(null);
      setTokens(null);
      setStatus('anonymous');
      Alert.alert(
        'Tài khoản đã bị xoá',
        'Tài khoản của bạn đã bị xoá. Có thắc mắc xin vui lòng liên hệ support@ngayyeuthuong.com',
        [{ text: 'Đã hiểu', style: 'default' }],
      );
    });

    apiService.setOnUnauthorized(() => {
      logoutRef.current();
    });
  }, []);

  // ── auth actions ──────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    const session = await authService.loginWithEmail(email, password);
    applySession(session);
    registerPushToken().catch(err => console.warn('Push token registration failed:', err));
    syncService.sync().catch(err => console.warn('Post-login sync failed:', err));
  };

  const register = async (email: string, password: string, displayName: string) => {
    const session = await authService.register(email, password, displayName);
    applySession(session);
  };

  const linkWithEmailPassword = async (email: string, password: string, displayName: string) => {
    const session = await authService.linkWithEmailPassword(email, password, displayName);
    applySession(session);
  };

  const logout = async () => {
    setStatus('initializing');
    deactivatePushToken().catch(() => {});
    await authService.logout();
    navigate('Main', { screen: 'Home' });
    await startAnonymousSession();
  };

  const deleteAccount = async () => {
    setStatus('initializing');
    await authService.deleteAccount();
    await startAnonymousSession();
  };

  const refreshToken = async () => {
    try {
      const newTokens = await authService.refreshToken();
      setTokens(newTokens);
    } catch (err) {
      await logout();
      throw err;
    }
  };

  const updateProfile = async (displayName: string) => {
    const updatedUser = await authService.updateProfile(displayName);
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authService.fetchUserFromServer();
      if (freshUser) setUser(freshUser);
    } catch (err) {
      console.error('refreshUser failed:', err);
    }
  };

  const resendVerificationEmail = async () => {
    await authService.resendVerificationEmail();
  };

  // Giữ ref đồng bộ với closure mới nhất (không dùng useCallback để tránh deps loop)
  logoutRef.current = logout;

  // ── context value ─────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    tokens,
    isLoading,
    isAuthenticated,
    isAnonymous,
    isEmailVerified,
    login,
    register,
    logout,
    deleteAccount,
    refreshToken,
    linkWithEmailPassword,
    updateProfile,
    refreshUser,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
