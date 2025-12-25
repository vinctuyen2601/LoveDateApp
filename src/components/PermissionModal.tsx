import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationUtils } from '../utils/notification.utils';

const PERMISSION_ASKED_KEY = '@notification_permission_asked';

interface PermissionModalProps {
  onPermissionResult?: (granted: boolean) => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  onPermissionResult,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkAndShowPermissionModal();
  }, []);

  const checkAndShowPermissionModal = async () => {
    try {
      // Check if we've already asked for permission
      const hasAsked = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);

      if (!hasAsked) {
        // Show modal to request permission
        setVisible(true);
      }
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const handleRequestPermission = async () => {
    try {
      // Request notification permissions
      const granted = await NotificationUtils.requestPermissions();

      // Mark that we've asked for permission
      await AsyncStorage.setItem(PERMISSION_ASKED_KEY, 'true');

      // Close modal
      setVisible(false);

      // Notify parent
      onPermissionResult?.(granted);
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setVisible(false);
      onPermissionResult?.(false);
    }
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
            <Text style={styles.icon}>🔔</Text>
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
    backgroundColor: '#FF69B4',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#FF69B4',
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
