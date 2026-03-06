import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Linking,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { syncService } from "../services/sync.service";
import { COLORS } from "@themes/colors";
import { APP_VERSION } from "../constants/config";

const AVATAR_COLOR_KEY = "@user_avatar_color";
const AVATAR_PHOTO_KEY = "@user_avatar_photo";

const AVATAR_COLORS = [
  "#FF6B6B",
  "#FF8E53",
  "#FFC048",
  "#51CF66",
  "#339AF0",
  "#845EF7",
  "#F06595",
  "#20C997",
];

const getInitials = (name: string): string => {
  if (!name?.trim()) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const getDefaultColor = (name: string): string => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
};

const formatMemberSince = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    user,
    isAnonymous,
    linkedProviders,
    logout,
    updateProfile,
    linkWithEmailPassword,
  } = useAuth();
  const { showSuccess, showError } = useToast();

  const [showLinkEmailModal, setShowLinkEmailModal] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [linkDisplayName, setLinkDisplayName] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Edit profile state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [avatarBgColor, setAvatarBgColor] = useState(AVATAR_COLORS[0]);
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [avatarPhotoUri, setAvatarPhotoUri] = useState<string | null>(null);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved avatar color & photo
  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      AsyncStorage.getItem(AVATAR_COLOR_KEY),
      AsyncStorage.getItem(AVATAR_PHOTO_KEY),
    ])
      .then(([savedColor, savedPhoto]) => {
        const color = savedColor || getDefaultColor(user.displayName || "");
        setAvatarBgColor(color);
        setSelectedColor(color);
        if (savedPhoto) setAvatarPhotoUri(savedPhoto);
      })
      .catch(() => {});
  }, [user?.id]);

  const handleOpenEditModal = () => {
    setEditName(user?.displayName || "");
    setSelectedColor(avatarBgColor);
    setSelectedPhotoUri(avatarPhotoUri);
    setShowEditModal(true);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập",
        "Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh đại diện.",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Mở cài đặt",
            onPress: () =>
              Platform.OS === "ios"
                ? Linking.openURL("app-settings:")
                : Linking.openSettings(),
          },
        ]
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedPhotoUri(result.assets[0].uri);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhotoUri(null);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      showError("Vui lòng nhập tên hiển thị");
      return;
    }
    try {
      setIsSaving(true);
      await updateProfile(editName.trim());
      await AsyncStorage.setItem(AVATAR_COLOR_KEY, selectedColor);
      setAvatarBgColor(selectedColor);
      if (selectedPhotoUri) {
        await AsyncStorage.setItem(AVATAR_PHOTO_KEY, selectedPhotoUri);
        setAvatarPhotoUri(selectedPhotoUri);
      } else {
        await AsyncStorage.removeItem(AVATAR_PHOTO_KEY);
        setAvatarPhotoUri(null);
      }
      setShowEditModal(false);
      showSuccess("✅ Đã cập nhật hồ sơ thành công!");
    } catch (error: any) {
      showError(error.message || "Không thể cập nhật hồ sơ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      isAnonymous
        ? "Bạn đang dùng tài khoản ẩn danh. Nếu đăng xuất, dữ liệu có thể bị mất. Bạn có muốn liên kết tài khoản trước?"
        : "Bạn có chắc muốn đăng xuất?",
      [
        { text: "Hủy", style: "cancel" },
        isAnonymous
          ? {
              text: "Liên kết trước",
              onPress: () => setShowLinkEmailModal(true),
            }
          : null,
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              Alert.alert("Lỗi", error.message);
            }
          },
        },
      ].filter(Boolean) as any
    );
  };

  const handleLinkEmail = async () => {
    if (!linkEmail || !linkPassword || !linkDisplayName) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setIsLinking(true);
      await linkWithEmailPassword(linkEmail, linkPassword, linkDisplayName);
      setShowLinkEmailModal(false);
      setLinkEmail("");
      setLinkPassword("");
      setLinkDisplayName("");
      showSuccess("🎉 Tài khoản đã được liên kết với email thành công!");
      // Sync local events lên server (background, không block UI)
      syncService
        .sync()
        .catch((err) => console.warn("Post-link sync failed:", err));
    } catch (error: any) {
      showError(error.message || "Không thể liên kết tài khoản");
    } finally {
      setIsLinking(false);
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
        <TouchableOpacity
          style={styles.profileCard}
          onPress={handleOpenEditModal}
          activeOpacity={0.8}
        >
          <View style={styles.avatarWrap}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: avatarPhotoUri
                    ? "transparent"
                    : avatarBgColor,
                },
              ]}
            >
              {avatarPhotoUri ? (
                <Image
                  source={{ uri: avatarPhotoUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.initialsText}>
                  {getInitials(user?.displayName || "ND")}
                </Text>
              )}
            </View>
            <View style={styles.editAvatarBtn}>
              <Ionicons name="pencil" size={11} color={COLORS.white} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {user?.displayName || "Người dùng"}
            </Text>
            {isAnonymous ? (
              <View style={styles.anonymousBadge}>
                <Ionicons name="eye-off" size={12} color={COLORS.warning} />
                <Text style={styles.anonymousText}>Tài khoản ẩn danh</Text>
              </View>
            ) : (
              <Text style={styles.userEmail}>{user?.email}</Text>
            )}
            {user?.createdAt ? (
              <Text style={styles.memberSince}>
                Thành viên từ {formatMemberSince(user.createdAt)}
              </Text>
            ) : null}
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>

        {/* Anonymous Warning */}
        {isAnonymous && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color={COLORS.warning} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                Liên kết tài khoản để backup!
              </Text>
              <Text style={styles.warningText}>
                Dữ liệu của bạn chỉ lưu trên thiết bị này. Hãy liên kết với
                email để không mất dữ liệu khi đổi máy.
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
            subtitle={isLinked("password") ? "Đã liên kết" : "Chưa liên kết"}
            onPress={() => !isLinked("password") && setShowLinkEmailModal(true)}
            linked={isLinked("password")}
            disabled={isLinked("password")}
          />

          <SettingItem
            icon="log-in-outline"
            title="Đã có tài khoản?"
            subtitle="Đăng nhập để khôi phục dữ liệu"
            onPress={() => navigation.navigate("Auth")}
          />
        </View>
      )}

      {/* TODO(monetization): Re-enable Premium section khi có đủ user base
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
      */}

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin</Text>

        <SettingItem
          icon="information-circle"
          title="Về ứng dụng"
          subtitle={`Phiên bản ${APP_VERSION || "1.0.0"}`}
          onPress={() =>
            Alert.alert(
              "LoveDate",
              `Version: ${
                APP_VERSION || "1.0.0"
              }\n\nỨng dụng nhắc nhở những ngày quan trọng trong cuộc sống.`
            )
          }
        />

        <SettingItem
          icon="shield-checkmark"
          title="Chính sách bảo mật"
          subtitle="Quyền riêng tư & affiliate"
          onPress={() => navigation.navigate("PrivacyPolicy")}
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Avatar preview — tap to pick image */}
            <View style={styles.editAvatarPreview}>
              <TouchableOpacity
                style={styles.editAvatarTouchable}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                {selectedPhotoUri ? (
                  <Image
                    source={{ uri: selectedPhotoUri }}
                    style={styles.editAvatarLarge}
                  />
                ) : (
                  <View
                    style={[
                      styles.editAvatarLarge,
                      { backgroundColor: selectedColor },
                    ]}
                  >
                    <Text style={styles.initialsTextLarge}>
                      {getInitials(editName || user?.displayName || "ND")}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  <Ionicons name="camera" size={14} color={COLORS.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.pickImageHint}>Nhấn để chọn ảnh</Text>
              {selectedPhotoUri && (
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={handleRemovePhoto}
                >
                  <Ionicons
                    name="trash-outline"
                    size={13}
                    color={COLORS.error}
                  />
                  <Text style={styles.removePhotoBtnText}>Xóa ảnh</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Color picker — only shown when no photo selected */}
            {!selectedPhotoUri && (
              <>
                <Text style={styles.fieldLabel}>Màu avatar</Text>
                <View style={styles.colorPalette}>
                  {AVATAR_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorDot,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorDotSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={COLORS.white}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Display name input */}
            <Text style={styles.fieldLabel}>Tên hiển thị</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên của bạn"
              value={editName}
              onChangeText={setEditName}
              autoCapitalize="words"
              maxLength={50}
            />

            <TouchableOpacity
              style={[styles.linkButton, isSaving && styles.linkButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              <Text style={styles.linkButtonText}>
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              Liên kết tài khoản với email để có thể đăng nhập trên nhiều thiết
              bị và backup dữ liệu của bạn.
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
              style={[
                styles.linkButton,
                isLinking && styles.linkButtonDisabled,
              ]}
              onPress={handleLinkEmail}
              disabled={isLinking}
            >
              <Text style={styles.linkButtonText}>
                {isLinking ? "Đang liên kết..." : "Liên kết ngay"}
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
        <View
          style={[styles.iconContainer, linked && styles.iconContainerLinked]}
        >
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
        {linked && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
        )}
        {!disabled && !linked && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textSecondary}
          />
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
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  anonymousBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  anonymousText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: "500",
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: COLORS.warning + "10",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.warning + "30",
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.warning,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconContainerLinked: {
    backgroundColor: COLORS.success + "20",
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  settingSubtitleLinked: {
    color: COLORS.success,
    fontWeight: "500",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.error + "30",
  },
  deleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.error,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.error + "30",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
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
    alignItems: "center",
    marginTop: 8,
  },
  linkButtonDisabled: {
    opacity: 0.6,
  },
  linkButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  // Avatar & Edit Profile
  avatarWrap: {
    position: "relative",
    marginRight: 16,
  },
  initialsText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  memberSince: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  // Edit Profile Modal
  editAvatarPreview: {
    alignItems: "center",
    marginVertical: 16,
  },
  editAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsTextLarge: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.white,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginTop: 4,
  },
  colorPalette: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: COLORS.textPrimary,
  },
  // Photo avatar
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  editAvatarTouchable: {
    position: "relative",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  pickImageHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  removePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: COLORS.error + "12",
  },
  removePhotoBtnText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: "500",
  },
});

export default SettingsScreen;
