import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ApiError } from '../types';

/**
 * Hook xử lý lỗi rate limit AI (HTTP 429).
 *
 * Trả về:
 * - handleAiError: gọi khi catch lỗi AI
 * - rateLimitModal: props truyền thẳng vào <AiRateLimitModal />
 */
export function useAiRateLimit() {
  const { isAnonymous } = useAuth();
  const { showError } = useToast();
  const navigation = useNavigation<any>();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleAiError = useCallback(
    (err: unknown, fallbackMessage = 'Không thể kết nối AI. Vui lòng thử lại.') => {
      if (err instanceof ApiError && err.statusCode === 429) {
        setModalMessage(err.message);
        setModalVisible(true);
      } else {
        showError(fallbackMessage);
      }
    },
    [showError],
  );

  const rateLimitModal = {
    visible: modalVisible,
    message: modalMessage,
    isAnonymous: !!isAnonymous,
    onClose: () => setModalVisible(false),
    onSignUp: () => {
      setModalVisible(false);
      navigation.navigate('Auth');
    },
  };

  return { handleAiError, rateLimitModal };
}
