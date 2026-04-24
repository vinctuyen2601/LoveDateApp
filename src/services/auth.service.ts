import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS } from '../constants/config';
import { User, AuthTokens, AuthError } from '../types';
import { apiService } from './api.service';
import { notificationService } from './notification.service';

class AuthService {

  // ─── Device session key ──────────────────────────────────────────────────────

  private async getOrCreateDeviceSessionKey(): Promise<string> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_SESSION_KEY);
    if (stored) return stored;
    const key = uuidv4();
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_SESSION_KEY, key);
    return key;
  }

  private async resetDeviceSessionKey(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_SESSION_KEY, uuidv4());
  }

  // ─── Session persistence ─────────────────────────────────────────────────────

  private async saveSession(user: User, tokens: AuthTokens): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(tokens)),
      AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
    ]);
  }

  async getSavedTokens(): Promise<AuthTokens | null> {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN).catch(() => null);
    return json ? JSON.parse(json) : null;
  }

  async getSavedUser(): Promise<User | null> {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA).catch(() => null);
    return json ? JSON.parse(json) : null;
  }

  isTokenExpired(tokens: AuthTokens): boolean {
    return Date.now() >= tokens.expiresAt;
  }

  // ─── Anonymous session ───────────────────────────────────────────────────────

  /**
   * Tạo anonymous session mới. Gọi khi: app start lần đầu, sau logout, sau delete account.
   * Thử BE trước, nếu offline thì tạo local account.
   */
  async createAnonymousSession(): Promise<{ user: User; tokens: AuthTokens }> {
    const deviceId = await this.getOrCreateDeviceSessionKey();
    const displayName = (Device.deviceName || Device.modelName || 'Device')
      .replace(/[^a-zA-Z0-9]/g, '_');

    try {
      const response = await apiService.post<{ access_token: string; user: User }>(
        '/auth/device-register',
        { deviceId, displayName },
        { timeout: 5000 }
      );

      const user: User = { ...response.user, isAnonymous: true };
      const tokens: AuthTokens = {
        accessToken: response.access_token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      await this.saveSession(user, tokens);
      apiService.setAuthToken(tokens.accessToken);
      notificationService.registerPushToken();

      console.log('✅ Anonymous session created (online):', user.displayName);
      return { user, tokens };
    } catch {
      console.log('⚠️ Backend unavailable, creating local anonymous account...');

      const user: User = {
        id: `local_${deviceId}_${Date.now()}`,
        email: `${deviceId}@local.device`,
        displayName,
        isAnonymous: true,
        createdAt: new Date().toISOString(),
      };
      const tokens: AuthTokens = {
        accessToken: `local_token_${Date.now()}`,
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      };

      await this.saveSession(user, tokens);
      console.log('✅ Anonymous session created (offline):', user.displayName);
      return { user, tokens };
    }
  }

  // ─── Restore existing session ────────────────────────────────────────────────

  /**
   * Khôi phục session đã lưu. Trả về null nếu không có session hoặc refresh thất bại.
   * AuthContext sẽ gọi createAnonymousSession() nếu kết quả là null.
   */
  async autoLogin(): Promise<{ user: User; tokens: AuthTokens } | null> {
    const [tokens, user] = await Promise.all([
      this.getSavedTokens(),
      this.getSavedUser(),
    ]);

    if (!tokens || !user) return null;

    if (this.isTokenExpired(tokens)) {
      try {
        const newTokens = await this.refreshToken();
        return { user, tokens: newTokens };
      } catch {
        await this.clearLocalSession();
        return null;
      }
    }

    apiService.setAuthToken(tokens.accessToken);
    return { user, tokens };
  }

  // ─── Auth actions ────────────────────────────────────────────────────────────

  async loginWithEmail(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await apiService.post<{ access_token: string; user: User }>(
        '/auth/login',
        { email, password }
      );

      const user: User = { ...response.user, isAnonymous: false };
      const tokens: AuthTokens = {
        accessToken: response.access_token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      await this.saveSession(user, tokens);
      apiService.setAuthToken(tokens.accessToken);
      return { user, tokens };
    } catch (error: any) {
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await apiService.post<{ access_token: string; user: User }>(
        '/auth/register',
        { email, password, displayName }
      );

      const user: User = { ...response.user, isAnonymous: false };
      const tokens: AuthTokens = {
        accessToken: response.access_token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      await this.saveSession(user, tokens);
      apiService.setAuthToken(tokens.accessToken);
      return { user, tokens };
    } catch (error: any) {
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  async linkWithEmailPassword(
    email: string,
    password: string,
    displayName: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await apiService.post<{ access_token: string; user: User }>(
        '/auth/link-email',
        { email, password, displayName }
      );

      const user: User = { ...response.user, isAnonymous: false };
      const tokens: AuthTokens = {
        accessToken: response.access_token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      await this.saveSession(user, tokens);
      apiService.setAuthToken(tokens.accessToken);
      return { user, tokens };
    } catch (error: any) {
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  async logout(): Promise<void> {
    const user = await this.getSavedUser();

    if (user?.isAnonymous) {
      await apiService.delete('/auth/delete-account').catch(() => {});
    } else {
      await apiService.post('/auth/logout', {}).catch(() => {});
    }

    apiService.setAuthToken(null);
    await this.resetDeviceSessionKey();
    await this.clearLocalSession();
  }

  async deleteAccount(): Promise<void> {
    await apiService.delete('/auth/delete-account').catch(() => {});
    apiService.setAuthToken(null);
    await this.resetDeviceSessionKey();
    await this.clearLocalSession();
  }

  async clearLocalSession(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.IS_ANONYMOUS, // legacy key cleanup
    ]);
  }

  // ─── Token refresh ───────────────────────────────────────────────────────────

  async refreshToken(): Promise<AuthTokens> {
    const currentTokens = await this.getSavedTokens();
    if (!currentTokens) throw new AuthError('No tokens to refresh');

    try {
      const response = await apiService.post<{ access_token: string }>(
        '/auth/refresh',
        { token: currentTokens.accessToken }
      );

      const tokens: AuthTokens = {
        accessToken: response.access_token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(tokens));
      apiService.setAuthToken(tokens.accessToken);
      return tokens;
    } catch (error: any) {
      throw new AuthError(this.getErrorMessage(error), error.code);
    }
  }

  // ─── User ────────────────────────────────────────────────────────────────────

  async fetchUserFromServer(): Promise<User | null> {
    const user = await apiService.get<User>('/users/me').catch(() => null);
    if (user) await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    return user;
  }

  async updateProfile(displayName: string): Promise<User> {
    const currentUser = await this.getSavedUser();

    try {
      const updatedUser = await apiService.put<User>('/users/me', { displayName });
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      return updatedUser;
    } catch {
      if (!currentUser) throw new AuthError('Không tìm thấy tài khoản');
      const updatedUser: User = { ...currentUser, displayName };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      return updatedUser;
    }
  }

  async resendVerificationEmail(): Promise<void> {
    await apiService.post('/auth/resend-verification', {});
  }

  // ─── Error messages ──────────────────────────────────────────────────────────

  private getErrorMessage(error: any): string {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.message === 'Network Error') return 'Lỗi kết nối mạng';
    const code = error.code || error.response?.status;
    switch (code) {
      case 400: return 'Dữ liệu không hợp lệ';
      case 401: return 'Thông tin đăng nhập không đúng';
      case 403: return 'Không có quyền truy cập';
      case 404: return 'Không tìm thấy tài khoản';
      case 409: return 'Email đã được sử dụng';
      case 422: return 'Dữ liệu không hợp lệ';
      case 429: return 'Quá nhiều yêu cầu, vui lòng thử lại sau';
      case 500:
      case 502:
      case 503: return 'Lỗi server, vui lòng thử lại sau';
      default: return error.message || 'Đã có lỗi xảy ra';
    }
  }
}

export const authService = new AuthService();
