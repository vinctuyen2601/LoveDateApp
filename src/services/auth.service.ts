import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { STORAGE_KEYS } from '../constants/config';
import { User, AuthTokens, AuthError } from '../types';
import { apiService } from './api.service';

class AuthService {
  /**
   * 🆕 Sign in anonymously (tạo tài khoản ẩn danh dựa trên Device ID)
   * - Sử dụng Device ID để tạo tên unique
   * - Không cần Backend cũng hoạt động (offline-first)
   */
  async signInAnonymously(): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      console.log('Creating anonymous account...');

      // Get device info for unique identifier
      const deviceId = Device.modelId || Device.osInternalBuildId || 'unknown';
      const deviceName = Device.deviceName || Device.modelName || 'Device';

      // Generate display name based on device
      const displayName = `${deviceName.replace(/[^a-zA-Z0-9]/g, '_')}`;

      console.log(`Device: ${displayName} (${deviceId})`);

      // Try to create account via Backend (online)
      // If fails, create local account (offline)
      try {
        const response = await apiService.post<{ access_token: string; user: User }>(
          '/auth/device-register',
          { deviceId, displayName },
          { timeout: 5000 } // 5 second timeout
        );

        const { access_token, user } = response;

        // Save tokens
        const tokens: AuthTokens = {
          accessToken: access_token,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        };

        await this.saveTokens(tokens);
        await this.saveUser(user);
        await this.markAsAnonymous(true);

        // Set token in API service
        apiService.setAuthToken(access_token);

        console.log('✅ Anonymous account created (online):', user.displayName);
        return { user, tokens };
      } catch (backendError) {
        console.log('⚠️ Backend unavailable, creating local account...');

        // Create local-only account (offline mode)
        const localUser: User = {
          id: `local_${deviceId}_${Date.now()}`,
          email: `${deviceId}@local.device`,
          displayName,
          isAnonymous: true,
          createdAt: new Date().toISOString(),
        };

        const localTokens: AuthTokens = {
          accessToken: `local_token_${Date.now()}`,
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year (local only)
        };

        await this.saveTokens(localTokens);
        await this.saveUser(localUser);
        await this.markAsAnonymous(true);

        console.log('✅ Local account created (offline):', localUser.displayName);
        return { user: localUser, tokens: localTokens };
      }
    } catch (error: any) {
      console.error('❌ Anonymous sign in error:', error);
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  /**
   * 🆕 Check if current user is anonymous
   */
  async isAnonymous(): Promise<boolean> {
    const isAnon = await AsyncStorage.getItem(STORAGE_KEYS.IS_ANONYMOUS);
    return isAnon === 'true';
  }

  /**
   * 🆕 Mark user as anonymous
   */
  private async markAsAnonymous(isAnonymous: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.IS_ANONYMOUS, isAnonymous.toString());
  }

  /**
   * 🆕 Link anonymous account with email/password
   */
  async linkWithEmailPassword(
    email: string,
    password: string,
    displayName: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Send to backend to link email with current anonymous account
      const response = await apiService.post<{ access_token: string; user: User }>(
        '/auth/link-email',
        { email, password, displayName }
      );

      const { access_token, user } = response;

      // Save tokens
      const tokens: AuthTokens = {
        accessToken: access_token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      await this.saveTokens(tokens);
      await this.saveUser(user);
      await this.markAsAnonymous(false);

      apiService.setAuthToken(access_token);

      console.log('Account linked with email successfully');
      return { user, tokens };
    } catch (error: any) {
      console.error('Link email error:', error);
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  /**
   * 🆕 Link with Google (placeholder - requires native implementation)
   */
  async linkWithGoogle(): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // TODO: Implement with expo-auth-session or @react-native-google-signin/google-signin
      throw new AuthError(
        'Google linking sẽ cần implement với expo-auth-session hoặc @react-native-google-signin/google-signin'
      );
    } catch (error: any) {
      console.error('Link Google error:', error);
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  /**
   * 🆕 Link with Facebook (placeholder - requires native implementation)
   */
  async linkWithFacebook(): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // TODO: Implement with expo-auth-session or react-native-fbsdk-next
      throw new AuthError(
        'Facebook linking sẽ cần implement với expo-auth-session hoặc react-native-fbsdk-next'
      );
    } catch (error: any) {
      console.error('Link Facebook error:', error);
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  /**
   * 🆕 Link with Phone Number (placeholder)
   */
  async linkWithPhoneNumber(phoneNumber: string): Promise<{ verificationId: string }> {
    try {
      // TODO: Implement phone auth with backend SMS service
      throw new AuthError(
        'Phone linking sẽ cần implement với backend SMS service (Twilio, AWS SNS, etc.)'
      );
    } catch (error: any) {
      console.error('Link phone error:', error);
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  /**
   * 🆕 Complete phone number linking with verification code
   */
  async completeLinkWithPhone(
    verificationId: string,
    verificationCode: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Send verification code to backend
      const response = await apiService.post<{ access_token: string; user: User }>(
        '/auth/link-phone',
        { verificationId, verificationCode }
      );

      const { access_token, user } = response;

      // Save tokens
      const tokens: AuthTokens = {
        accessToken: access_token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      await this.saveTokens(tokens);
      await this.saveUser(user);

      apiService.setAuthToken(access_token);

      return { user, tokens };
    } catch (error: any) {
      console.error('Complete link phone error:', error);
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  /**
   * Get linked providers — derived from user fields (BE has no providers array)
   */
  async getLinkedProviders(): Promise<string[]> {
    try {
      const user = await this.getSavedUser();
      if (!user) return [];

      const providers: string[] = [];

      // Linked with email/password if not anonymous and has a real email
      if (
        !user.isAnonymous &&
        user.email &&
        !user.email.startsWith('device_') &&
        !user.email.endsWith('@local.device') &&
        !user.email.match(/^anonymous_\d+/)
      ) {
        providers.push('password');
      }

      return providers;
    } catch (error) {
      console.error('Get linked providers error:', error);
      return [];
    }
  }

  /**
   * Login with email and password
   */
  async loginWithEmail(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Send credentials to backend
      const response = await apiService.post<{ access_token: string; user: User }>(
        '/auth/login',
        { email, password }
      );

      const { access_token, user } = response;

      // Save tokens
      const tokens: AuthTokens = {
        accessToken: access_token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      };

      await this.saveTokens(tokens);
      await this.saveUser(user);
      await this.markAsAnonymous(false);

      // Set token in API service
      apiService.setAuthToken(access_token);

      return { user, tokens };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  /**
   * Login with Google (placeholder)
   */
  async loginWithGoogle(): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // TODO: Implement Google Sign-In with expo-auth-session
      throw new AuthError('Google Sign-In sẽ được implement với expo-auth-session');
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Send registration data to backend
      const response = await apiService.post<{ access_token: string; user: User }>(
        '/auth/register',
        { email, password, displayName }
      );

      const { access_token, user } = response;

      // Save tokens
      const tokens: AuthTokens = {
        accessToken: access_token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      await this.saveTokens(tokens);
      await this.saveUser(user);
      await this.markAsAnonymous(false);

      // Set token in API service
      apiService.setAuthToken(access_token);

      return { user, tokens };
    } catch (error: any) {
      console.error('Register error:', error);
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(): Promise<void> {
    await apiService.post('/auth/resend-verification', {});
  }

  /**
   * Delete account permanently
   * Calls backend to delete account, then clears all local data.
   * Works even if backend is unreachable (local-only account).
   */
  async deleteAccount(): Promise<void> {
    try {
      // Try to delete account on backend
      try {
        await apiService.delete('/auth/delete-account');
      } catch (error) {
        console.log('Backend delete failed (non-critical, clearing local data anyway):', error);
      }

      // Always clear local storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.IS_ANONYMOUS,
      ]);

      apiService.setAuthToken(null);
      console.log('Account deleted successfully');
    } catch (error) {
      console.error('Delete account error:', error);
      throw new AuthError('Không thể xóa tài khoản, vui lòng thử lại');
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      // Optional: Notify backend about logout (for session invalidation)
      try {
        await apiService.post('/auth/logout', {});
      } catch (error) {
        console.log('Backend logout notification failed (non-critical):', error);
      }

      // Clear local storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.IS_ANONYMOUS,
      ]);

      // Clear token from API service
      apiService.setAuthToken(null);

      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw new AuthError('Failed to logout');
    }
  }

  /**
   * Refresh auth token
   */
  async refreshToken(): Promise<AuthTokens> {
    try {
      const currentTokens = await this.getSavedTokens();
      if (!currentTokens) {
        throw new AuthError('No tokens to refresh');
      }

      // Send current token to backend for refresh
      const response = await apiService.post<{ access_token: string }>(
        '/auth/refresh',
        { token: currentTokens.accessToken }
      );

      const tokens: AuthTokens = {
        accessToken: response.access_token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      await this.saveTokens(tokens);
      apiService.setAuthToken(response.access_token);

      return tokens;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new AuthError('Failed to refresh token');
    }
  }

  /**
   * Save tokens to AsyncStorage
   */
  private async saveTokens(tokens: AuthTokens): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(tokens));
  }

  /**
   * Save user data to AsyncStorage
   */
  private async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  /**
   * Get saved tokens
   */
  async getSavedTokens(): Promise<AuthTokens | null> {
    try {
      const tokensJson = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return tokensJson ? JSON.parse(tokensJson) : null;
    } catch (error) {
      console.error('Error getting saved tokens:', error);
      return null;
    }
  }

  /**
   * Get saved user
   */
  async getSavedUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting saved user:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(tokens: AuthTokens): boolean {
    return Date.now() >= tokens.expiresAt;
  }

  /**
   * Auto login from saved tokens OR create anonymous account
   */
  async autoLogin(): Promise<{ user: User; tokens: AuthTokens } | null> {
    try {
      const tokens = await this.getSavedTokens();
      const user = await this.getSavedUser();

      if (!tokens || !user) {
        // 🆕 No saved session - create anonymous account
        console.log('No saved session, creating anonymous account...');
        return await this.signInAnonymously();
      }

      // Check if token is expired
      if (this.isTokenExpired(tokens)) {
        // Try to refresh
        try {
          const newTokens = await this.refreshToken();
          return { user, tokens: newTokens };
        } catch {
          // Refresh failed - create new anonymous account
          console.log('Token refresh failed, creating new anonymous account...');
          return await this.signInAnonymously();
        }
      }

      // Set token in API service
      apiService.setAuthToken(tokens.accessToken);

      return { user, tokens };
    } catch (error) {
      console.error('Auto login error:', error);
      // Fallback to anonymous
      try {
        return await this.signInAnonymously();
      } catch (anonError) {
        console.error('Anonymous login also failed:', anonError);
        return null;
      }
    }
  }

  /**
   * Update user profile (displayName)
   */
  async updateProfile(displayName: string): Promise<User> {
    try {
      try {
        const updatedUser = await apiService.put<User>('/users/me', { displayName });
        await this.saveUser(updatedUser);
        return updatedUser;
      } catch (backendError) {
        // Update locally if backend fails (e.g., anonymous user or offline)
        const currentUser = await this.getSavedUser();
        if (!currentUser) throw new AuthError('Không tìm thấy tài khoản');
        const updatedUser: User = { ...currentUser, displayName };
        await this.saveUser(updatedUser);
        return updatedUser;
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    // Handle HTTP error responses
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      return 'Lỗi kết nối mạng';
    }

    // Handle specific error codes from backend
    const code = error.code || error.response?.status;

    switch (code) {
      case 400:
        return 'Dữ liệu không hợp lệ';
      case 401:
        return 'Thông tin đăng nhập không đúng';
      case 403:
        return 'Không có quyền truy cập';
      case 404:
        return 'Không tìm thấy tài khoản';
      case 409:
        return 'Email đã được sử dụng';
      case 422:
        return 'Dữ liệu không hợp lệ';
      case 429:
        return 'Quá nhiều yêu cầu, vui lòng thử lại sau';
      case 500:
      case 502:
      case 503:
        return 'Lỗi server, vui lòng thử lại sau';
      default:
        return error.message || 'Đã có lỗi xảy ra';
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
