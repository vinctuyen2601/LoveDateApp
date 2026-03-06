import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@contexts/AuthContext';
import { COLORS } from '@themes/colors';
import { STRINGS } from '../constants/strings';
import { ValidationUtils } from '@lib/validation.utils';
import { logLogin, logSignUp } from '../services/analyticsService';

const AuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login, register, isAnonymous } = useAuth();
  const wasAnonymousRef = useRef(isAnonymous);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Real-time validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  // Refs for field chaining
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Auto-dismiss khi user chuyển từ anonymous → real (sau khi register/login thành công)
  useEffect(() => {
    if (wasAnonymousRef.current && !isAnonymous) {
      navigation.goBack();
    }
    wasAnonymousRef.current = isAnonymous;
  }, [isAnonymous]);

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateField = (field: string, value: string) => {
    let error: string | undefined;
    switch (field) {
      case 'email':
        if (value.length > 0 && !ValidationUtils.isValidEmail(value))
          error = STRINGS.error_invalid_email;
        break;
      case 'password':
        if (value.length > 0 && !ValidationUtils.isValidPassword(value))
          error = STRINGS.error_invalid_password;
        break;
      case 'confirmPassword':
        if (value.length > 0 && !ValidationUtils.doPasswordsMatch(password, value))
          error = STRINGS.error_password_mismatch;
        break;
      case 'displayName':
        if (value.length > 0) {
          const result = ValidationUtils.isValidDisplayName(value);
          if (!result.valid) error = result.error;
        }
        break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleFieldChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    // Real-time: email validate ngay khi có dấu '@', password validate ngay khi bắt đầu gõ
    const shouldValidateNow =
      touched[field] ||
      (field === 'email' && value.includes('@')) ||
      (field === 'password' && value.length > 0) ||
      (field === 'confirmPassword' && value.length > 0);
    if (shouldValidateNow) {
      if (!touched[field]) setTouched(prev => ({ ...prev, [field]: true }));
      validateField(field, value);
    }
  };

  const isFieldValid = (field: string, value: string): boolean => {
    if (!touched[field] || value.length === 0) return false;
    return !fieldErrors[field];
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();

    if (!ValidationUtils.isValidEmail(email)) {
      Alert.alert('Lỗi', STRINGS.error_invalid_email);
      return;
    }

    if (!ValidationUtils.isValidPassword(password)) {
      Alert.alert('Lỗi', STRINGS.error_invalid_password);
      return;
    }

    if (!isLogin) {
      if (!ValidationUtils.doPasswordsMatch(password, confirmPassword)) {
        Alert.alert('Lỗi', STRINGS.error_password_mismatch);
        return;
      }

      const nameValidation = ValidationUtils.isValidDisplayName(displayName);
      if (!nameValidation.valid) {
        Alert.alert('Lỗi', nameValidation.error || 'Tên không hợp lệ');
        return;
      }
    }

    try {
      setIsLoading(true);

      if (isLogin) {
        await login(email, password);
        logLogin('email');
      } else {
        await register(email, password, displayName);
        logSignUp('email');
      }
      // navigation handled by isAnonymous useEffect above
    } catch (error: any) {
      Alert.alert(
        'Lỗi',
        error.message || (isLogin ? 'Đăng nhập thất bại' : 'Đăng ký thất bại')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocusScroll = () => {
    // Scroll xuống cuối để đảm bảo field đang focus luôn hiển thị
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const showHeader = !keyboardVisible;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo/Title — ẩn khi bàn phím hiện để form có không gian */}
        {showHeader && (
          <View style={styles.header}>
            <Ionicons name="calendar-outline" size={72} color={COLORS.primary} />
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
              <Ionicons name="calendar-outline" size={28} color={COLORS.primary} />
              <Text style={styles.miniAppName}>{STRINGS.app_name}</Text>
            </View>
          )}

          <Text style={styles.formTitle}>
            {isLogin ? STRINGS.auth_login : STRINGS.auth_register}
          </Text>

          {/* Display Name (Register only) */}
          {!isLogin && (
            <View>
              <View style={[styles.inputContainer, fieldErrors.displayName && touched.displayName ? styles.inputContainerError : null]}>
                <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên hiển thị của bạn"
                  placeholderTextColor={COLORS.textSecondary}
                  value={displayName}
                  onChangeText={(v) => handleFieldChange('displayName', v, setDisplayName)}
                  onBlur={() => { markTouched('displayName'); validateField('displayName', displayName); }}
                  onFocus={handleFocusScroll}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {isFieldValid('displayName', displayName) && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                )}
              </View>
              {touched.displayName && fieldErrors.displayName ? (
                <Text style={styles.fieldError}>{fieldErrors.displayName}</Text>
              ) : (
                <Text style={styles.fieldHint}>Tên sẽ hiển thị trong ứng dụng</Text>
              )}
            </View>
          )}

          {/* Email */}
          <View>
            <View style={[styles.inputContainer, fieldErrors.email && touched.email ? styles.inputContainerError : null]}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="Ví dụ: ten@email.com"
                placeholderTextColor={COLORS.textSecondary}
                value={email}
                onChangeText={(v) => handleFieldChange('email', v, setEmail)}
                onBlur={() => { markTouched('email'); validateField('email', email); }}
                onFocus={handleFocusScroll}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
              {isFieldValid('email', email) && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              )}
            </View>
            {touched.email && fieldErrors.email ? (
              <Text style={styles.fieldError}>{fieldErrors.email}</Text>
            ) : (
              <Text style={styles.fieldHint}>Nhập địa chỉ email hợp lệ</Text>
            )}
          </View>

          {/* Password */}
          <View>
            <View style={[styles.inputContainer, fieldErrors.password && touched.password ? styles.inputContainerError : null]}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor={COLORS.textSecondary}
                value={password}
                onChangeText={(v) => handleFieldChange('password', v, setPassword)}
                onBlur={() => { markTouched('password'); validateField('password', password); }}
                onFocus={handleFocusScroll}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType={isLogin ? 'done' : 'next'}
                onSubmitEditing={isLogin ? handleSubmit : () => confirmPasswordRef.current?.focus()}
                blurOnSubmit={isLogin}
              />
              {isFieldValid('password', password) && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              )}
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {touched.password && fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password}</Text>
            ) : (
              <Text style={[
                styles.fieldHint,
                password.length > 0 && (password.length >= 6 ? styles.fieldHintValid : styles.fieldHintWarn),
              ]}>
                {password.length > 0
                  ? password.length >= 6
                    ? `✓ Mật khẩu hợp lệ (${password.length} ký tự)`
                    : `Cần thêm ${6 - password.length} ký tự nữa`
                  : 'Mật khẩu tối thiểu 6 ký tự'}
              </Text>
            )}
          </View>

          {/* Confirm Password (Register only) */}
          {!isLogin && (
            <View>
              <View style={[styles.inputContainer, fieldErrors.confirmPassword && touched.confirmPassword ? styles.inputContainerError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu vừa tạo"
                  placeholderTextColor={COLORS.textSecondary}
                  value={confirmPassword}
                  onChangeText={(v) => handleFieldChange('confirmPassword', v, setConfirmPassword)}
                  onBlur={() => { markTouched('confirmPassword'); validateField('confirmPassword', confirmPassword); }}
                  onFocus={handleFocusScroll}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                {isFieldValid('confirmPassword', confirmPassword) && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                )}
              </View>
              {touched.confirmPassword && fieldErrors.confirmPassword ? (
                <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>
              ) : confirmPassword.length > 0 ? (
                <Text style={[styles.fieldHint, confirmPassword === password ? styles.fieldHintValid : styles.fieldHintWarn]}>
                  {confirmPassword === password ? '✓ Mật khẩu khớp' : 'Mật khẩu chưa khớp'}
                </Text>
              ) : null}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading
                ? 'Đang xử lý...'
                : isLogin
                ? STRINGS.auth_login
                : STRINGS.auth_register}
            </Text>
          </TouchableOpacity>

          {/* Toggle Login/Register */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? STRINGS.auth_no_account : STRINGS.auth_have_account}
            </Text>
            <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setTouched({}); setFieldErrors({}); }}>
              <Text style={styles.toggleLink}>
                {isLogin ? STRINGS.auth_register : STRINGS.auth_login}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Padding cuối để scroll không bị khuất khi bàn phím hiện */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Loading overlay — hiện khi đang chờ API, che toàn bộ form */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {isLogin ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...'}
          </Text>
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
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  miniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  miniAppName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  fieldError: {
    color: COLORS.error,
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 16,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 100,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginLeft: 16,
    marginTop: 2,
  },
  fieldHintValid: {
    color: COLORS.success,
  },
  fieldHintWarn: {
    color: '#F59E0B',
  },
});

export default AuthScreen;
