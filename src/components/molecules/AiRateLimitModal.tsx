import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@themes/colors';

interface Props {
  visible: boolean;
  message: string;
  isAnonymous: boolean;
  onClose: () => void;
  onSignUp: () => void;
}

const AiRateLimitModal: React.FC<Props> = ({
  visible,
  message,
  isAnonymous,
  onClose,
  onSignUp,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="sparkles" size={32} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Hết lượt AI hôm nay</Text>
          <Text style={styles.message}>{message}</Text>

          {isAnonymous ? (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Để sau</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={onSignUp}>
                <Ionicons name="person-add-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.singleCloseBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Đã hiểu</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  closeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.background,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    gap: 6,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  singleCloseBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.background,
  },
});

export default AiRateLimitModal;
