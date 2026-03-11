import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationUtils } from '@lib/notification.utils';
import { COLORS } from '@themes/colors';

const PERMISSION_ASKED_KEY = '@notification_permission_asked';

interface PermissionModalProps {
  onPermissionResult?: (granted: boolean) => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  onPermissionResult,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Delay to ensure app is fully rendered
    const timer = setTimeout(() => {
      checkAndShowPermissionModal();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const checkAndShowPermissionModal = async () => {
    try {
      console.log('Checking permission modal status...');

      // Check if we've already asked for permission
      const hasAsked = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);
      console.log('Has asked before:', hasAsked);

      if (!hasAsked) {
        console.log('Showing permission modal');
        // Show modal to request permission
        setVisible(true);
      } else {
        console.log('Permission already asked, skipping modal');
      }
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const handleRequestPermission = () => {
    // Close custom modal first so it doesn't block the system permission dialog
    setVisible(false);

    setTimeout(async () => {
      try {
        const granted = await NotificationUtils.requestPermissions();
        await AsyncStorage.setItem(PERMISSION_ASKED_KEY, 'true');
        onPermissionResult?.(granted);
      } catch (error) {
        console.error('Error requesting permissions:', error);
        onPermissionResult?.(false);
      }
    }, 400);
  };

  const handleSkip = async () => {
    try {
      // Mark that we've asked for permission (even if they skipped)
      await AsyncStorage.setItem(PERMISSION_ASKED_KEY, 'true');
      setVisible(false);
      onPermissionResult?.(false);
    } catch (error) {
      console.error('Error saving skip status:', error);
      setVisible(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={40} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Cho phép thông báo</Text>

          <Text style={styles.description}>
            Ứng dụng cần quyền thông báo để nhắc nhở bạn về các ngày quan trọng.
          </Text>

          <Text style={styles.subDescription}>
            Bạn sẽ nhận được thông báo trước các sự kiện như sinh nhật, kỷ niệm, và ngày lễ.
          </Text>

          <TouchableOpacity
            style={styles.allowButton}
            onPress={handleRequestPermission}
          >
            <Text style={styles.allowButtonText}>Cho phép</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Bỏ qua</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  subDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  allowButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  allowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
});
