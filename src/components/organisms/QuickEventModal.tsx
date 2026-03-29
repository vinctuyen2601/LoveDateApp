import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { COLORS } from '@themes/colors';
import { DateUtils } from '@lib/date.utils';
import { EventFormData } from '../../types';
import TimePicker from '@components/molecules/TimePicker';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

interface QuickEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (formData: EventFormData) => Promise<void>;
}

// Helper function to extract tags from event name
const extractEventTags = (eventName: string): string[] => {
  const lowerName = eventName.toLowerCase();
  const tags: string[] = [];

  // Category detection
  if (lowerName.includes('sinh nhật') || lowerName.includes('sinh nhat') ||
      lowerName.includes('birthday') || lowerName.includes('sinh') ||
      lowerName.includes('sanh nhật')) {
    tags.push('birthday');
  } else if (lowerName.includes('kỷ niệm') || lowerName.includes('ky niem') ||
             lowerName.includes('anniversary') || lowerName.includes('cưới') ||
             lowerName.includes('cuoi') || lowerName.includes('yêu') || lowerName.includes('yeu')) {
    tags.push('anniversary');
  }

  return tags;
};

export const QuickEventModal: React.FC<QuickEventModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const styles = useStyles();
  const colors = useColors();

  const now = new Date();
  // Create default date at 12:00 to avoid timezone issues
  const defaultDate = new Date();
  defaultDate.setHours(12, 0, 0, 0);

  const [step, setStep] = useState(1);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(defaultDate);
  const [reminderDays, setReminderDays] = useState([1, 7]);
  const [reminderTime, setReminderTime] = useState({ hour: now.getHours(), minute: now.getMinutes() });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    const resetTime = new Date();
    const resetDate = new Date();
    resetDate.setHours(12, 0, 0, 0);
    setStep(1);
    setEventName('');
    setEventDate(resetDate);
    setReminderDays([1, 7]);
    setReminderTime({ hour: resetTime.getHours(), minute: resetTime.getMinutes() });
    onClose();
  };

  const handleNext = () => {
    if (step === 1 && !eventName.trim()) {
      return; // Validation
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Extract tags from event name
      const tags = extractEventTags(eventName);

      const formData: EventFormData = {
        title: eventName.trim(),
        eventDate: eventDate,
        isLunarCalendar: false,
        tags,
        remindDaysBefore: reminderDays,
        reminderTime: reminderTime,
        isRecurring: true, // Always yearly recurring
        recurrencePattern: {
          type: 'yearly',
          month: eventDate.getMonth() + 1,
          day: eventDate.getDate(),
        },
      };

      await onSubmit(formData);

      // Show success message
      Alert.alert(
        'Thành công!',
        `Sự kiện "${eventName.trim()}" đã được tạo và sẽ tự động nhắc bạn hàng năm.`,
        [{ text: 'OK', style: 'default' }]
      );

      handleClose();
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert(
        '❌ Lỗi',
        'Không thể tạo sự kiện. Vui lòng thử lại.',
        [{ text: 'OK', style: 'cancel' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReminderDay = (day: number) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter(d => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort((a, b) => a - b));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
            <TouchableOpacity onPress={step > 1 ? handleBack : handleClose} style={styles.backButton}>
              <Ionicons name={step > 1 ? "arrow-back" : "close"} size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tạo sự kiện mới</Text>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>{step}/3</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
          </View>

          <ScrollView style={styles.content}>
            {/* Step 1: Event Name */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Ionicons name="heart" size={48} color={colors.primary} style={styles.stepIcon} />
                <Text style={styles.questionTitle}>Sự kiện quan trọng của bạn là gì?</Text>
                <Text style={styles.questionSubtitle}>
                  Hãy cho tôi biết, tôi sẽ giúp bạn không bao giờ quên 💝
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Sinh nhật vợ, Kỷ niệm ngày cưới..."
                  placeholderTextColor={colors.textSecondary}
                  value={eventName}
                  onChangeText={setEventName}
                  autoFocus
                  maxLength={100}
                />

                <Text style={styles.helperText}>
                  💡 Mẹo: Đặt tên rõ ràng giúp tôi tự động phân loại cho bạn
                </Text>
              </View>
            )}

            {/* Step 2: Event Date */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Ionicons name="calendar" size={48} color={colors.primary} style={styles.stepIcon} />
                <Text style={styles.questionTitle}>"{eventName}" diễn ra khi nào?</Text>
                <Text style={styles.questionSubtitle}>
                  Tôi sẽ tự động nhắc bạn hàng năm 🗓️
                </Text>

                <View style={styles.calendarCard}>
                  <Calendar
                    current={DateUtils.toLocalDateString(eventDate)}
                    onDayPress={(day: DateData) => {
                      // Use dateString to avoid timezone issues
                      const [year, month, date] = day.dateString.split('-').map(Number);
                      const selectedDate = new Date(year, month - 1, date, 12, 0, 0, 0);
                      setEventDate(selectedDate);
                    }}
                    markedDates={{
                      [DateUtils.toLocalDateString(eventDate)]: {
                        selected: true,
                        selectedColor: colors.primary,
                      },
                    }}
                    theme={{
                      backgroundColor: 'transparent',
                      calendarBackground: 'transparent',
                      textSectionTitleColor: colors.textSecondary,
                      selectedDayBackgroundColor: colors.primary,
                      selectedDayTextColor: colors.white,
                      todayTextColor: colors.primary,
                      dayTextColor: colors.textPrimary,
                      textDisabledColor: colors.textLight,
                      dotColor: colors.primary,
                      selectedDotColor: colors.white,
                      arrowColor: colors.primary,
                      monthTextColor: colors.textPrimary,
                      indicatorColor: colors.primary,
                      textDayFontFamily: 'System',
                      textMonthFontFamily: 'System',
                      textDayHeaderFontFamily: 'System',
                      textDayFontWeight: '400',
                      textMonthFontWeight: '600',
                      textDayHeaderFontWeight: '500',
                      textDayFontSize: 15,
                      textMonthFontSize: 17,
                      textDayHeaderFontSize: 13,
                    }}
                    enableSwipeMonths={true}
                    hideExtraDays={false}
                    firstDay={1}
                    renderArrow={(direction: string) => (
                      <Ionicons
                        name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  />
                </View>

                <Text style={styles.selectedInfoText}>
                  Đã chọn:{' '}
                  {eventDate.toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>

                <View style={styles.infoCard}>
                  <Ionicons name="repeat" size={20} color={colors.primary} />
                  <Text style={styles.infoCardText}>
                    Sự kiện này sẽ lặp lại hàng năm vào {eventDate.getDate()} tháng {eventDate.getMonth() + 1}
                  </Text>
                </View>
              </View>
            )}

            {/* Step 3: Reminder Settings */}
            {step === 3 && (
              <View style={styles.stepContainer}>
                <Ionicons name="notifications" size={48} color={colors.primary} style={styles.stepIcon} />
                <Text style={styles.questionTitle}>Khi nào bạn muốn được nhắc nhở?</Text>
                <Text style={styles.questionSubtitle}>
                  Chọn thời gian để tôi nhắc bạn trước ngày diễn ra 🔔
                </Text>

                <View style={styles.reminderOptions}>
                  {[
                    { value: 0, label: 'Trong ngày' },
                    { value: 1, label: '1 ngày trước' },
                    { value: 3, label: '3 ngày trước' },
                    { value: 7, label: '1 tuần trước' },
                  ].map((option) => {
                    const isSelected = reminderDays.includes(option.value);
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.reminderOption,
                          isSelected && styles.reminderOptionSelected,
                        ]}
                        onPress={() => toggleReminderDay(option.value)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.reminderOptionText,
                            isSelected && styles.reminderOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Reminder Time Picker */}
                <View style={styles.timePickerSection}>
                  <TimePicker
                    selectedTime={reminderTime}
                    onTimeChange={setReminderTime}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={step === 3 ? handleSubmit : handleNext}
              disabled={isSubmitting || (step === 1 && !eventName.trim())}
            >
              {isSubmitting ? (
                <Text style={styles.buttonText}>Đang tạo...</Text>
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {step === 3 ? 'Hoàn tất' : 'Tiếp tục'}
                  </Text>
                  <Ionicons name={step === 3 ? "checkmark" : "arrow-forward"} size={20} color={colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const useStyles = makeStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.text,
  },
  stepIndicator: {
    backgroundColor: colors.primaryLight + '30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.primary,
  },
  progressContainer: {
    height: 3,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 22,
    fontFamily: 'Manrope_700Bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  calendarCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  selectedInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  reminderOptions: {
    gap: 10,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  reminderOptionSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  reminderOptionText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  reminderOptionTextSelected: {
    color: colors.primary,
    fontFamily: 'Manrope_600SemiBold',
  },
  timePickerSection: {
    marginTop: 24,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.white,
  },
}));