import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthTokens, AuthContextValue } from '../types';
import { authService } from '../services/auth.service';

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
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);

  useEffect(() => {
    // Auto-login on app start (or create anonymous account)
    autoLogin();
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

        // Check if anonymous
        const anon = await authService.isAnonymous();
        setIsAnonymous(anon);
      }
    } catch (error) {
      console.error('Auto login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { user, tokens } = await authService.loginWithEmail(email, password);

      setUser(user);
      setTokens(tokens);
      setIsAuthenticated(true);
      setIsAnonymous(false);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
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
      setIsLoading(true);
      const { user, tokens } = await authService.register(email, password, displayName);

      setUser(user);
      setTokens(tokens);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Register failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();

      setUser(null);
      setTokens(null);
      setIsAuthenticated(false);
      setIsAnonymous(false);
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

  const value: AuthContextValue = {
    user,
    tokens,
    isLoading,
    isAuthenticated,
    isAnonymous,
    linkedProviders: linkedProviders || [], // Ensure it's always an array
    login,
    loginWithGoogle,
    register,
    logout,
    refreshToken,
    linkWithEmailPassword,
    linkWithGoogle,
    linkWithFacebook,
    linkWithPhoneNumber,
    completeLinkWithPhone,
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
