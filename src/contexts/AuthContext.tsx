import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { User, AuthTokens, AuthContextValue } from '../types';
import { authService } from '../services/auth.service';
import { apiService } from '../services/api.service';
import { syncService } from '../services/sync.service';
import { registerPushToken, deactivatePushToken } from '../services/pushNotification.service';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);

  useEffect(() => {
    // Auto-login on app start (or create anonymous account)
    autoLogin();
  }, []);

  useEffect(() => {
    // Xử lý khi tài khoản bị deactivate (403 ACCOUNT_DEACTIVATED từ bất kỳ API call nào)
    apiService.setOnAccountDeactivated(async () => {
      await authService.clearLocalSession();

      setUser(null);
      setTokens(null);
      setIsAuthenticated(false);
      setIsAnonymous(false);
      setIsEmailVerified(false);
      setLinkedProviders([]);

      Alert.alert(
        'Tài khoản đã bị xoá',
        'Tài khoản của bạn đã bị xoá. Có thắc mắc xin vui lòng liên hệ support@ngayyeuthuong.com',
        [{ text: 'Đã hiểu', style: 'default' }],
      );
    });
  }, []);

  useEffect(() => {
    // Update linked providers when user changes
    if (user) {
      const loadProviders = async () => {
        try {
          const providers = await authService.getLinkedProviders();
          setLinkedProviders(providers);
        } catch (error) {
          console.error('Failed to load linked providers:', error);
          setLinkedProviders([]);
        }
      };
      loadProviders();
      checkIfAnonymous();
    }
  }, [user]);

  const checkIfAnonymous = async () => {
    const anon = await authService.isAnonymous();
    setIsAnonymous(anon);
  };

  const autoLogin = async () => {
    try {
      setIsLoading(true);
      const session = await authService.autoLogin();

      if (session) {
        setUser(session.user);
        setTokens(session.tokens);
        setIsAuthenticated(true);
        setIsEmailVerified(session.user.emailVerified || false);

        // Check if anonymous
        const anon = await authService.isAnonymous();
        setIsAnonymous(anon);

        // Đăng ký push token cho tất cả user (kể cả anonymous)
        registerPushToken().catch(err => console.warn('Push token registration failed:', err));

        // Chỉ sync events cho tài khoản thật
        if (!anon) {
          syncService.sync().catch(err => console.warn('Startup sync failed:', err));
        }
      }
    } catch (error) {
      console.error('Auto login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { user, tokens } = await authService.loginWithEmail(email, password);

      setUser(user);
      setTokens(tokens);
      setIsAuthenticated(true);
      setIsAnonymous(false);
      setIsEmailVerified(user.emailVerified || false);
      registerPushToken().catch(err => console.warn('Push token registration failed:', err));
      syncService.sync().catch(err => console.warn('Post-login sync failed:', err));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const { user, tokens } = await authService.loginWithGoogle();

      setUser(user);
      setTokens(tokens);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const { user, tokens } = await authService.register(email, password, displayName);

      setUser(user);
      setTokens(tokens);
      setIsAuthenticated(true);
      setIsAnonymous(false);
      setIsEmailVerified(user.emailVerified || false);
    } catch (error) {
      console.error('Register failed:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      setIsLoading(true);
      await authService.deleteAccount();

      setUser(null);
      setTokens(null);
      setIsAuthenticated(false);
      setIsAnonymous(false);
      setIsEmailVerified(false);
      setLinkedProviders([]);

      // Create new anonymous account after deletion
      await autoLogin();
    } catch (error) {
      console.error('Delete account failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await deactivatePushToken().catch(() => {});
      await authService.logout();

      setUser(null);
      setTokens(null);
      setIsAuthenticated(false);
      setIsAnonymous(false);
      setIsEmailVerified(false);
      setLinkedProviders([]);

      // Create new anonymous account after logout
      await autoLogin();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const newTokens = await authService.refreshToken();
      setTokens(newTokens);
    } catch (error) {
      console.error('Refresh token failed:', error);
      // If refresh fails, logout
      await logout();
      throw error;
    }
  };

  // 🆕 Link anonymous account with email/password
  const linkWithEmailPassword = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      setIsLoading(true);
      const { user, tokens } = await authService.linkWithEmailPassword(
        email,
        password,
        displayName
      );

      setUser(user);
      setTokens(tokens);
      setIsAnonymous(false);
      const providers = await authService.getLinkedProviders();
      setLinkedProviders(providers);
    } catch (error) {
      console.error('Link email failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Link with Google
  const linkWithGoogle = async () => {
    try {
      setIsLoading(true);
      const { user, tokens } = await authService.linkWithGoogle();

      setUser(user);
      setTokens(tokens);
      const providers = await authService.getLinkedProviders();
      setLinkedProviders(providers);
    } catch (error) {
      console.error('Link Google failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Link with Facebook
  const linkWithFacebook = async () => {
    try {
      setIsLoading(true);
      const { user, tokens } = await authService.linkWithFacebook();

      setUser(user);
      setTokens(tokens);
      const providers = await authService.getLinkedProviders();
      setLinkedProviders(providers);
    } catch (error) {
      console.error('Link Facebook failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    await authService.resendVerificationEmail();
  };

  // 🆕 Update profile (displayName)
  const updateProfile = async (displayName: string) => {
    try {
      const updatedUser = await authService.updateProfile(displayName);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  };

  // 🆕 Link with Phone Number
  const linkWithPhoneNumber = async (phoneNumber: string) => {
    try {
      setIsLoading(true);
      const result = await authService.linkWithPhoneNumber(phoneNumber);
      return result;
    } catch (error) {
      console.error('Link phone failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Complete Phone Number linking
  const completeLinkWithPhone = async (verificationId: string, code: string) => {
    try {
      setIsLoading(true);
      const { user, tokens } = await authService.completeLinkWithPhone(verificationId, code);

      setUser(user);
      setTokens(tokens);
      const providers = await authService.getLinkedProviders();
      setLinkedProviders(providers);
    } catch (error) {
      console.error('Complete link phone failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const user = await authService.fetchUserFromServer();
      if (user) {
        setUser(user);
        setIsEmailVerified(user.emailVerified || false);
      }
    } catch (error) {
      console.error('refreshUser failed:', error);
    }
  };

  const value: AuthContextValue = {
    user,
    tokens,
    isLoading,
    isAuthenticated,
    isAnonymous,
    isEmailVerified,
    linkedProviders: linkedProviders || [], // Ensure it's always an array
    resendVerificationEmail,
    login,
    loginWithGoogle,
    register,
    logout,
    deleteAccount,
    refreshToken,
    linkWithEmailPassword,
    linkWithGoogle,
    linkWithFacebook,
    linkWithPhoneNumber,
    completeLinkWithPhone,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
