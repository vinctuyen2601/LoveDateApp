import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@contexts/AuthContext';
import { useSync } from '@contexts/SyncContext';
import { useToast } from '../contexts/ToastContext';
import { NotificationUtils } from '@lib/notification.utils';
import { COLORS } from '@themes/colors';
import { APP_VERSION } from '../constants/config';
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, isAnonymous, linkedProviders, logout, linkWithEmailPassword, linkWithGoogle, linkWithFacebook } = useAuth();
  const { sync, syncStatus } = useSync();
  const { showSuccess, showError } = useToast();

  const [showLinkEmailModal, setShowLinkEmailModal] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkDisplayName, setLinkDisplayName] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  // Check notification permissions on mount
  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      setIsCheckingPermissions(true);
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationEnabled(status === 'granted');
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    try {
      if (value) {
        // Request permissions
        const hasPermission = await NotificationUtils.requestPermissions();
        if (hasPermission) {
          setNotificationEnabled(true);
          showSuccess('✅ Đã bật thông báo thành công!');
        } else {
          setNotificationEnabled(false);
          showError('❌ Không có quyền gửi thông báo. Vui lòng bật trong cài đặt.');
        }
      } else {
        // Note: We can't actually disable notifications from the app
        // We can only guide users to system settings
        Alert.alert(
          'Tắt thông báo',
          'Để tắt thông báo, vui lòng vào Cài đặt > Ứng dụng > Ngày Quan Trọng > Thông báo',
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Mở cài đặt',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      showError(error.message || 'Không thể thay đổi cài đặt thông báo');
    }
  };

  const handleSync = async () => {
    try {
      await sync();
      showSuccess('✅ Đã đồng bộ dữ liệu thành công');
    } catch (error: any) {
      showError(error.message || 'Không thể đồng bộ');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      isAnonymous
        ? 'Bạn đang dùng tài khoản ẩn danh. Nếu đăng xuất, dữ liệu có thể bị mất. Bạn có muốn liên kết tài khoản trước?'
        : 'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        isAnonymous
          ? {
              text: 'Liên kết trước',
              onPress: () => setShowLinkEmailModal(true),
            }
          : null,
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message);
            }
          },
        },
      ].filter(Boolean) as any
    );
  };

  const handleLinkEmail = async () => {
    if (!linkEmail || !linkPassword || !linkDisplayName) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setIsLinking(true);
      await linkWithEmailPassword(linkEmail, linkPassword, linkDisplayName);
      setShowLinkEmailModal(false);
      setLinkEmail('');
      setLinkPassword('');
      setLinkDisplayName('');
      showSuccess('🎉 Tài khoản đã được liên kết với email thành công!');
    } catch (error: any) {
      showError(error.message || 'Không thể liên kết tài khoản');
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      await linkWithGoogle();
      showSuccess('✅ Đã liên kết với Google thành công');
    } catch (error: any) {
      if (!error.message.includes('sẽ cần implement')) {
        showError(error.message);
      }
    }
  };

  const handleLinkFacebook = async () => {
    try {
      await linkWithFacebook();
      showSuccess('✅ Đã liên kết với Facebook thành công');
    } catch (error: any) {
      if (!error.message.includes('sẽ cần implement')) {
        showError(error.message);
      }
    }
  };

  const isLinked = (provider: string) => {
    return linkedProviders?.includes(provider) || false;
  };

  return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tài khoản</Text>

        {/* User Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons
              name={isAnonymous ? 'person-outline' : 'person'}
              size={40}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.displayName || 'Người dùng'}</Text>
            {isAnonymous ? (
              <View style={styles.anonymousBadge}>
                <Ionicons name="eye-off" size={12} color={COLORS.warning} />
                <Text style={styles.anonymousText}>Tài khoản ẩn danh</Text>
              </View>
            ) : (
              <Text style={styles.userEmail}>{user?.email}</Text>
            )}
          </View>
        </View>

        {/* Anonymous Warning */}
        {isAnonymous && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color={COLORS.warning} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Liên kết tài khoản để backup!</Text>
              <Text style={styles.warningText}>
                Dữ liệu của bạn chỉ lưu trên thiết bị này. Hãy liên kết với email, Google, hoặc
                Facebook để đồng bộ cross-device.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Link Account Section */}
      {isAnonymous && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liên kết tài khoản</Text>

          <SettingItem
            icon="mail"
            title="Email & Mật khẩu"
            subtitle={isLinked('password') ? 'Đã liên kết' : 'Chưa liên kết'}
            onPress={() => !isLinked('password') && setShowLinkEmailModal(true)}
            linked={isLinked('password')}
            disabled={isLinked('password')}
          />

          <SettingItem
            icon="logo-google"
            title="Google"
            subtitle={isLinked('google.com') ? 'Đã liên kết' : 'Chưa liên kết'}
            onPress={handleLinkGoogle}
            linked={isLinked('google.com')}
            disabled={isLinked('google.com')}
            color="#DB4437"
          />

          <SettingItem
            icon="logo-facebook"
            title="Facebook"
            subtitle={isLinked('facebook.com') ? 'Đã liên kết' : 'Chưa liên kết'}
            onPress={handleLinkFacebook}
            linked={isLinked('facebook.com')}
            disabled={isLinked('facebook.com')}
            color="#1877F2"
          />

        </View>
      )}

      {/* Premium Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium</Text>

        <SettingItem
          icon="star"
          title="Nâng cấp Premium"
          subtitle="Mở khóa tất cả tính năng cao cấp"
          onPress={() => navigation.navigate('Premium')}
          color={COLORS.warning}
        />
      </View>

      {/* Sync Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đồng bộ</Text>

        <SettingItem
          icon="sync"
          title="Đồng bộ ngay"
          subtitle={
            syncStatus.lastSyncAt
              ? `Lần cuối: ${new Date(syncStatus.lastSyncAt).toLocaleString('vi-VN')}`
              : 'Chưa đồng bộ'
          }
          onPress={handleSync}
          showBadge={syncStatus.pendingCount > 0}
          badgeText={syncStatus.pendingCount.toString()}
        />

      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông báo</Text>

        {/* Enable/Disable Notifications */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: notificationEnabled ? COLORS.primary + '20' : COLORS.background }]}>
              <Ionicons
                name="notifications"
                size={22}
                color={notificationEnabled ? COLORS.primary : COLORS.textSecondary}
              />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>
                Bật thông báo
              </Text>
              <Text style={styles.settingSubtitle}>
                {isCheckingPermissions
                  ? 'Đang kiểm tra...'
                  : notificationEnabled
                    ? 'Thông báo đã được bật'
                    : 'Nhấn để bật thông báo'}
              </Text>
            </View>
          </View>
          <Switch
            value={notificationEnabled}
            onValueChange={handleToggleNotifications}
            disabled={isCheckingPermissions}
            trackColor={{ false: '#D1D5DB', true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin</Text>

        <SettingItem
          icon="information-circle"
          title="Về ứng dụng"
          subtitle={`Phiên bản ${APP_VERSION || '1.0.0'}`}
          onPress={() => Alert.alert('Ngày Quan Trọng', `Version: ${APP_VERSION || '1.0.0'}\n\nỨng dụng nhắc nhở những ngày quan trọng trong cuộc sống.`)}
        />

      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      {/* Link Email Modal */}
      <Modal
        visible={showLinkEmailModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLinkEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Liên kết Email</Text>
              <TouchableOpacity onPress={() => setShowLinkEmailModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Liên kết tài khoản với email để có thể đăng nhập trên nhiều thiết bị và backup dữ
              liệu của bạn.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Tên hiển thị"
              value={linkDisplayName}
              onChangeText={setLinkDisplayName}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={linkEmail}
              onChangeText={setLinkEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              value={linkPassword}
              onChangeText={setLinkPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.linkButton, isLinking && styles.linkButtonDisabled]}
              onPress={handleLinkEmail}
              disabled={isLinking}
            >
              <Text style={styles.linkButtonText}>
                {isLinking ? 'Đang liên kết...' : 'Liên kết ngay'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Setting Item Component
interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  linked?: boolean;
  disabled?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  color?: string;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  linked,
  disabled,
  showBadge,
  badgeText,
  color,
}) => {
  return (
    <TouchableOpacity
      style={[styles.settingItem, disabled && styles.settingItemDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, linked && styles.iconContainerLinked]}>
          <Ionicons
            name={icon}
            size={22}
            color={color || (linked ? COLORS.success : COLORS.textSecondary)}
          />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && (
            <Text
              style={[
                styles.settingSubtitle,
                linked && styles.settingSubtitleLinked,
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {showBadge && badgeText && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        )}
        {linked && <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />}
        {!disabled && !linked && (
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  anonymousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  anonymousText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '500',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerLinked: {
    backgroundColor: COLORS.success + '20',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  settingSubtitleLinked: {
    color: COLORS.success,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  linkButtonDisabled: {
    opacity: 0.6,
  },
  linkButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
