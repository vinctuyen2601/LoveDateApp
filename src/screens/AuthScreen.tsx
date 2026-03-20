import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@contexts/AuthContext";
import { COLORS } from "@themes/colors";
import { STRINGS } from "../constants/strings";
import { ValidationUtils } from "@lib/validation.utils";
import { logLogin, logSignUp } from "../services/analyticsService";

const APP_LOGO = require("../../assets/icon.png");

const AuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login, register, isAnonymous } = useAuth();
  const wasAnonymousRef = useRef(isAnonymous);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Real-time validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  // Refs for field chaining
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (wasAnonymousRef.current && !isAnonymous) {
      navigation.goBack();
    }
    wasAnonymousRef.current = isAnonymous;
  }, [isAnonymous]);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateField = (field: string, value: string) => {
    let error: string | undefined;
    switch (field) {
      case "email":
        if (value.length > 0 && !ValidationUtils.isValidEmail(value))
          error = STRINGS.error_invalid_email;
        break;
      case "password":
        if (value.length > 0 && !ValidationUtils.isValidPassword(value))
          error = STRINGS.error_invalid_password;
        break;
      case "confirmPassword":
        if (
          value.length > 0 &&
          !ValidationUtils.doPasswordsMatch(password, value)
        )
          error = STRINGS.error_password_mismatch;
        break;
      case "displayName":
        if (value.length > 0) {
          const result = ValidationUtils.isValidDisplayName(value);
          if (!result.valid) error = result.error;
        }
        break;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleFieldChange = (
    field: string,
    value: string,
    setter: (v: string) => void
  ) => {
    setter(value);
    const shouldValidateNow =
      touched[field] ||
      (field === "email" && value.includes("@")) ||
      (field === "password" && value.length > 0) ||
      (field === "confirmPassword" && value.length > 0);
    if (shouldValidateNow) {
      if (!touched[field]) setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field, value);
    }
  };

  const isFieldValid = (field: string, value: string): boolean => {
    if (!touched[field] || value.length === 0) return false;
    return !fieldErrors[field];
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setFormError(null);

    // Validate all fields inline — mark touched + set errors
    let hasError = false;
    const newTouched: Record<string, boolean> = { email: true, password: true };
    const newErrors: Record<string, string | undefined> = {};

    if (!ValidationUtils.isValidEmail(email)) {
      newErrors.email =
        email.length === 0
          ? "Vui lòng nhập email"
          : STRINGS.error_invalid_email;
      hasError = true;
    }

    if (!ValidationUtils.isValidPassword(password)) {
      newErrors.password =
        password.length === 0
          ? "Vui lòng nhập mật khẩu"
          : STRINGS.error_invalid_password;
      hasError = true;
    }

    if (!isLogin) {
      newTouched.displayName = true;
      newTouched.confirmPassword = true;

      const nameValidation = ValidationUtils.isValidDisplayName(displayName);
      if (!nameValidation.valid) {
        newErrors.displayName =
          displayName.length === 0
            ? "Vui lòng nhập tên hiển thị"
            : nameValidation.error;
        hasError = true;
      }

      if (!ValidationUtils.doPasswordsMatch(password, confirmPassword)) {
        newErrors.confirmPassword =
          confirmPassword.length === 0
            ? "Vui lòng xác nhận mật khẩu"
            : STRINGS.error_password_mismatch;
        hasError = true;
      }
    }

    setTouched((prev) => ({ ...prev, ...newTouched }));
    setFieldErrors((prev) => ({ ...prev, ...newErrors }));

    if (hasError) {
      // Scroll lên field lỗi đầu tiên
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    try {
      setIsLoading(true);

      if (isLogin) {
        await login(email, password);
        logLogin("email");
      } else {
        await register(email, password, displayName);
        logSignUp("email");
      }
    } catch (error: any) {
      const msg =
        error.message || (isLogin ? "Đăng nhập thất bại" : "Đăng ký thất bại");
      setFormError(msg);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocusScroll = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const showHeader = !keyboardVisible;

  const renderInput = (
    label: string,
    icon: string,
    field: string,
    value: string,
    setter: (v: string) => void,
    options?: {
      ref?: React.RefObject<TextInput | null>;
      placeholder?: string;
      secure?: boolean;
      keyboardType?: any;
      autoCapitalize?: any;
      returnKeyType?: any;
      onSubmitEditing?: () => void;
      blurOnSubmit?: boolean;
      hint?: string;
      renderRight?: React.ReactNode;
      renderHint?: React.ReactNode;
    }
  ) => {
    const hasError = touched[field] && !!fieldErrors[field];
    const valid = isFieldValid(field, value);

    return (
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View
          style={[
            styles.inputContainer,
            hasError && styles.inputError,
            valid && styles.inputValid,
          ]}
        >
          <Ionicons
            name={icon as any}
            size={20}
            color={
              hasError
                ? COLORS.error
                : valid
                ? COLORS.success
                : COLORS.textSecondary
            }
          />
          <TextInput
            ref={options?.ref}
            style={styles.input}
            placeholder={options?.placeholder}
            placeholderTextColor={`${COLORS.textSecondary}99`}
            value={value}
            onChangeText={(v) => handleFieldChange(field, v, setter)}
            onBlur={() => {
              markTouched(field);
              validateField(field, value);
            }}
            onFocus={handleFocusScroll}
            secureTextEntry={options?.secure}
            keyboardType={options?.keyboardType}
            autoCapitalize={options?.autoCapitalize ?? "none"}
            autoCorrect={false}
            returnKeyType={options?.returnKeyType ?? "next"}
            onSubmitEditing={options?.onSubmitEditing}
            blurOnSubmit={options?.blurOnSubmit ?? false}
          />
          {valid && !options?.renderRight && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={COLORS.success}
            />
          )}
          {options?.renderRight}
        </View>
        {hasError ? (
          <Text style={styles.fieldError}>{fieldErrors[field]}</Text>
        ) : options?.renderHint ? (
          options.renderHint
        ) : options?.hint ? (
          <Text style={styles.fieldHint}>{options.hint}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        {showHeader && (
          <View style={styles.header}>
            <Image source={APP_LOGO} style={styles.logo} />
            <Text style={styles.appName}>{STRINGS.app_name}</Text>
            <Text style={styles.subtitle}>
              Không bao giờ quên những ngày quan trọng
            </Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {/* Mini logo khi bàn phím hiện */}
          {!showHeader && (
            <View style={styles.miniHeader}>
              <Image source={APP_LOGO} style={styles.miniLogo} />
              <Text style={styles.miniAppName}>{STRINGS.app_name}</Text>
            </View>
          )}

          {/* Tab Login / Register */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => {
                setIsLogin(true);
                setTouched({});
                setFieldErrors({});
                setFormError(null);
              }}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
                {STRINGS.auth_login}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => {
                setIsLogin(false);
                setTouched({});
                setFieldErrors({});
                setFormError(null);
              }}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                {STRINGS.auth_register}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error banner */}
          {formError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={COLORS.error} />
              <Text style={styles.errorBannerText}>{formError}</Text>
              <TouchableOpacity
                onPress={() => setFormError(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          )}

          {/* Display Name (Register only) */}
          {!isLogin &&
            renderInput(
              "Tên hiển thị",
              "person-outline",
              "displayName",
              displayName,
              setDisplayName,
              {
                placeholder: "Nhập tên của bạn",
                autoCapitalize: "words",
                onSubmitEditing: () => emailRef.current?.focus(),
                hint: "Tên sẽ hiển thị trong ứng dụng",
              }
            )}

          {/* Email */}
          {renderInput("Email", "mail-outline", "email", email, setEmail, {
            ref: emailRef,
            placeholder: "ten@email.com",
            keyboardType: "email-address",
            onSubmitEditing: () => passwordRef.current?.focus(),
          })}

          {/* Password */}
          {renderInput(
            "Mật khẩu",
            "lock-closed-outline",
            "password",
            password,
            setPassword,
            {
              ref: passwordRef,
              placeholder: "Tối thiểu 6 ký tự",
              secure: !showPassword,
              returnKeyType: isLogin ? "done" : "next",
              onSubmitEditing: isLogin
                ? handleSubmit
                : () => confirmPasswordRef.current?.focus(),
              blurOnSubmit: isLogin,
              renderRight: (
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              ),
              renderHint: (
                <Text
                  style={[
                    styles.fieldHint,
                    password.length > 0 &&
                      (password.length >= 6
                        ? styles.fieldHintValid
                        : styles.fieldHintWarn),
                  ]}
                >
                  {password.length > 0
                    ? password.length >= 6
                      ? `Mật khẩu hợp lệ (${password.length} ký tự)`
                      : `Cần thêm ${6 - password.length} ký tự nữa`
                    : "Mật khẩu tối thiểu 6 ký tự"}
                </Text>
              ),
            }
          )}

          {/* Confirm Password (Register only) */}
          {!isLogin &&
            renderInput(
              "Xác nhận mật khẩu",
              "lock-closed-outline",
              "confirmPassword",
              confirmPassword,
              setConfirmPassword,
              {
                ref: confirmPasswordRef,
                placeholder: "Nhập lại mật khẩu",
                secure: !showPassword,
                returnKeyType: "done",
                onSubmitEditing: handleSubmit,
                blurOnSubmit: true,
                renderHint:
                  confirmPassword.length > 0 ? (
                    <Text
                      style={[
                        styles.fieldHint,
                        confirmPassword === password
                          ? styles.fieldHintValid
                          : styles.fieldHintWarn,
                      ]}
                    >
                      {confirmPassword === password
                        ? "Mật khẩu khớp"
                        : "Mật khẩu chưa khớp"}
                    </Text>
                  ) : undefined,
              }
            )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name={isLogin ? "log-in-outline" : "person-add-outline"}
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.submitButtonText}>
                  {isLogin ? STRINGS.auth_login : STRINGS.auth_register}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Toggle Login/Register */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? STRINGS.auth_no_account : STRINGS.auth_have_account}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsLogin(!isLogin);
                setTouched({});
                setFieldErrors({});
                setFormError(null);
              }}
            >
              <Text style={styles.toggleLink}>
                {isLogin ? STRINGS.auth_register : STRINGS.auth_login}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              {isLogin ? "Đang đăng nhập..." : "Đang tạo tài khoản..."}
            </Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 20,
  },

  // ── Header ──
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  miniHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },
  miniLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  miniAppName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // ── Tab ──
  tabRow: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },

  // ── Error banner ──
  errorBanner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: `${COLORS.error}10`,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${COLORS.error}25`,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    lineHeight: 19,
    fontWeight: "500" as const,
  },

  // ── Form ──
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  fieldWrap: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}08`,
  },
  inputValid: {
    borderColor: `${COLORS.success}40`,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    padding: 0,
  },
  fieldError: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  fieldHintValid: {
    color: COLORS.success,
  },
  fieldHintWarn: {
    color: "#F59E0B",
  },

  // ── Submit ──
  submitButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },

  // ── Toggle ──
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 4,
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  toggleLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Other ──
  bottomPadding: {
    height: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
});

export default AuthScreen;
