import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ApiError } from '../types';

/**
 * Hook xử lý lỗi rate limit AI (HTTP 429).
 *
 * - Anonymous user → Alert có button "Đăng ký ngay" điều hướng đến màn hình Auth
 * - Real user → Toast thông báo liên hệ admin
 * - Lỗi khác → Toast generic
 */
export function useAiRateLimit() {
  const { isAnonymous } = useAuth();
  const { showError } = useToast();
  const navigation = useNavigation<any>();

  const handleAiError = (err: unknown, fallbackMessage = 'Không thể kết nối AI. Vui lòng thử lại.') => {
    if (err instanceof ApiError && err.statusCode === 429) {
      if (isAnonymous) {
        Alert.alert(
          'Hết lượt AI hôm nay 🤖',
          err.message,
          [
            { text: 'Để sau', style: 'cancel' },
            {
              text: 'Đăng ký ngay',
              onPress: () => navigation.navigate('Auth'),
            },
          ],
        );
      } else {
        // Real user đã đăng nhập → chỉ cần toast, không cần nút
        showError(err.message);
      }
    } else {
      showError(fallbackMessage);
    }
  };

  return { handleAiError };
}
