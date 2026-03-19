import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '@themes/colors';
import { EventFormData } from '../../types';

export const ONBOARDING_KEY = '@onboarding_v2_completed';

const GRADIENT_WELCOME: [string, string] = ['#FF6B9D', '#FF8E53'];
const GRADIENT_SETUP: [string, string] = ['#667EEA', '#764BA2'];
const GRADIENT_CONFIRM: [string, string] = ['#43C59E', '#2196F3'];
const GRADIENT_AUTH: [string, string] = ['#F093FB', '#F5576C'];

interface Props {
  onComplete: () => void;
  onRegister?: () => void;
  onAddEvent?: () => void;
  addEvent?: (formData: EventFormData) => Promise<any>;
}

const getDaysUntilBirthday = (month: number, day: number): number => {
  const today = new Date();
  const thisYear = today.getFullYear();
  let next = new Date(thisYear, month, day);
  if (next <= today) {
    next = new Date(thisYear + 1, month, day);
  }
  const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const OnboardingOverlay: React.FC<Props> = ({ onComplete, onRegister, onAddEvent, addEvent }) => {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Screen 1 state
  const [name, setName] = useState('');
  const [birthdayDate, setBirthdayDate] = useState<Date>(new Date());
  const [dateSelected, setDateSelected] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Screen 2 state
  const [daysUntil, setDaysUntil] = useState(0);
  const [savedName, setSavedName] = useState('');

  const goToStep = (next: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const dismissedRef = useRef(false);
  const dismiss = (callback?: () => void) => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    const finish = () => { onComplete(); callback?.(); };
    Animated.timing(fadeAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(finish);
    setTimeout(finish, 350);
  };

  const handleSaveBirthday = async () => {
    const displayName = name.trim() || 'người thương';
    setSavedName(displayName);
    const days = getDaysUntilBirthday(birthdayDate.getMonth(), birthdayDate.getDate());
    setDaysUntil(days);

    if (addEvent) {
      try {
        const today = new Date();
        const thisYear = today.getFullYear();
        let eventDate = new Date(thisYear, birthdayDate.getMonth(), birthdayDate.getDate());
        if (eventDate <= today) {
          eventDate = new Date(thisYear + 1, birthdayDate.getMonth(), birthdayDate.getDate());
        }
        await addEvent({
          title: `Sinh nhật của ${displayName}`,
          eventDate,
          isLunarCalendar: false,
          tags: [],
          remindDaysBefore: [0, 1, 7],
          reminderTime: { hour: 9, minute: 0 },
          isRecurring: true,
          recurrencePattern: {
            type: 'yearly',
            month: birthdayDate.getMonth() + 1,
            day: birthdayDate.getDate(),
          },
        });
      } catch (e) {
        console.warn('Onboarding: failed to create event', e);
      }
    }
    goToStep(2);
  };

  const handleSkipSetup = () => {
    goToStep(3);
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    dismiss();
  };

  const handleRegister = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    Animated.timing(fadeAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
      onRegister?.();
    });
  };

  const formatBirthday = (date: Date) => {
    return `${date.getDate()} tháng ${date.getMonth() + 1}`;
  };

  const displayLabel = name.trim() ? name.trim() : 'người thương';

  // Dots
  const totalSteps = 4;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      {/* Dots */}
      <View style={styles.topBar}>
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === step && styles.dotActive,
                i < step && styles.dotDone,
              ]}
            />
          ))}
        </View>
        {step === 1 && (
          <TouchableOpacity onPress={handleSkipSetup} style={styles.skipBtn}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View
        style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}
      >
        {/* ── SCREEN 0: WELCOME ── */}
        {step === 0 && (
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.centerContent}>
              <View style={styles.iconWrap}>
                <LinearGradient colors={GRADIENT_WELCOME} style={styles.iconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Image
                    source={require('../../../assets/adaptive-icon.png')}
                    style={styles.appIcon}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </View>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Chào mừng đến Ngày Yêu Thương </Text>
                <Image source={require('../../../assets/icons/tags/hearts.png')} style={styles.titleEmoji} />
              </View>
              <Text style={styles.subtitle}>
                Không bao giờ quên ngày đặc biệt — Ngày Yêu Thương sẽ nhắc và tạo checklist chuẩn bị cho bạn.
              </Text>
            </View>
            <View style={styles.bottomArea}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => goToStep(1)} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENT_WELCOME} style={styles.primaryBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.primaryBtnText}>Bắt đầu nào</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* ── SCREEN 1: SETUP ── */}
        {step === 1 && (
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.flex} contentContainerStyle={styles.setupContent} keyboardShouldPersistTaps="handled">
              <LinearGradient colors={GRADIENT_SETUP} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="heart" size={52} color="#fff" />
              </LinearGradient>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Sinh nhật của{'\n'}người thương bạn </Text>
                <Image source={require('../../../assets/icons/tags/cake.png')} style={styles.titleEmoji} />
              </View>
              <Text style={styles.subtitle}>Thêm ngay để không bao giờ quên</Text>

              {/* Name input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên người thương của bạn</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ví dụ: Minh, Anh, Em..."
                  placeholderTextColor={COLORS.textSecondary + '80'}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="done"
                  maxLength={30}
                />
              </View>

              {/* Date picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Sinh nhật của {displayLabel} là ngày nào?
                </Text>
                <TouchableOpacity
                  style={[styles.datePickerBtn, dateSelected && styles.datePickerBtnSelected]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={dateSelected ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.datePickerText, dateSelected && styles.datePickerTextSelected]}>
                    {dateSelected ? formatBirthday(birthdayDate) : 'Chọn ngày sinh'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={birthdayDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (date) {
                      setBirthdayDate(date);
                      setDateSelected(true);
                    }
                  }}
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <TouchableOpacity
                  style={styles.dateConfirmBtn}
                  onPress={() => { setDateSelected(true); setShowDatePicker(false); }}
                >
                  <Text style={styles.dateConfirmText}>Xong</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.bottomArea}>
              <TouchableOpacity
                style={[styles.primaryBtn, !dateSelected && styles.primaryBtnDisabled]}
                onPress={handleSaveBirthday}
                disabled={!dateSelected}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={dateSelected ? GRADIENT_SETUP : ['#ccc', '#aaa']}
                  style={styles.primaryBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="heart" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Lưu lại</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* ── SCREEN 2: CONFIRMATION ── */}
        {step === 2 && (
          <View style={styles.flex}>
            <View style={styles.centerContent}>
              <LinearGradient colors={GRADIENT_CONFIRM} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="checkmark" size={60} color="#fff" />
              </LinearGradient>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Tuyệt vời! </Text>
                <Image source={require('../../../assets/icons/tags/confetti.png')} style={styles.titleEmoji} />
              </View>
              {/* Days countdown — hero number */}
              <View style={styles.countdownCard}>
                <Text style={styles.countdownNumber}>{daysUntil}</Text>
                <Text style={styles.countdownLabel}>ngày nữa thôi</Text>
              </View>

              <View style={styles.confirmCard}>
                <Text style={styles.confirmMain}>
                  Sinh nhật của{' '}
                  <Text style={styles.confirmName}>{savedName}</Text>
                  {' '}đã được lưu
                </Text>
                <View style={styles.confirmDivider} />
                <Text style={styles.confirmRelax}>
                  Ngày Yêu Thương sẽ nhắc bạn đúng lúc —{'\n'}đừng lo gì cả
                </Text>
              </View>
              <Text style={styles.confirmNote}>
                Bạn có thể chỉnh sửa và thêm nhiều ngày khác trong phần cài đặt sau nhé!
              </Text>
            </View>
            <View style={styles.bottomArea}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => goToStep(3)} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENT_CONFIRM} style={styles.primaryBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.primaryBtnText}>Tiếp tục</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── SCREEN 3: AUTH ── */}
        {step === 3 && (
          <View style={styles.flex}>
            <View style={styles.centerContent}>
              <LinearGradient colors={GRADIENT_AUTH} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="shield-checkmark" size={52} color="#fff" />
              </LinearGradient>
              <Text style={styles.title}>Giữ dữ liệu an toàn</Text>
              <Text style={styles.subtitle}>
                Tạo tài khoản để không mất dữ liệu khi đổi máy và đồng bộ trên nhiều thiết bị
              </Text>

              <View style={styles.featureList}>
                {[
                  { icon: 'cloud-upload', text: 'Backup tự động lên cloud' },
                  { icon: 'sync', text: 'Đồng bộ nhiều thiết bị' },
                  { icon: 'lock-closed', text: 'Dữ liệu được mã hóa' },
                ].map((f) => (
                  <View key={f.text} style={styles.featureRow}>
                    <Ionicons name={f.icon as any} size={18} color={COLORS.primary} />
                    <Text style={styles.featureText}>{f.text}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.bottomArea}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} activeOpacity={0.85}>
                <LinearGradient colors={GRADIENT_AUTH} style={styles.primaryBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Đăng ký tài khoản</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn} onPress={handleComplete}>
                <Text style={styles.ghostBtnText}>Dùng thử trước</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

export const checkOnboardingComplete = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: 9999,
    elevation: 9999,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    paddingTop: 52,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: COLORS.primary,
  },
  dotDone: {
    backgroundColor: COLORS.primary + '60',
  },
  skipBtn: {
    position: 'absolute',
    right: 24,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.border + '80',
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  stepContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  setupContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    marginBottom: 36,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    width: 120,
    height: 120,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  titleEmoji: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 8,
  },
  // Setup screen
  inputGroup: {
    width: '100%',
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePickerBtnSelected: {
    borderColor: COLORS.primary + '60',
    backgroundColor: COLORS.primary + '08',
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  datePickerTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  dateConfirmBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  dateConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Countdown hero
  countdownCard: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 80,
  },
  countdownLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  // Confirmation screen
  confirmCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    gap: 12,
  },
  confirmMain: {
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmName: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  confirmRelax: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },
  confirmNote: {
    fontSize: 13,
    color: COLORS.textSecondary + 'aa',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 19,
  },
  // Auth screen
  featureList: {
    width: '100%',
    marginTop: 24,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  // Bottom
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 12,
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  ghostBtnText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default OnboardingOverlay;
