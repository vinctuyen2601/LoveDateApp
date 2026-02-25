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
  } else if (lowerName.includes('tết') || lowerName.includes('tet') ||
             lowerName.includes('lễ') || lowerName.includes('le') ||
             lowerName.includes('holiday') || lowerName.includes('quốc khánh') ||
             lowerName.includes('giáng sinh') || lowerName.includes('noel')) {
    tags.push('holiday');
  }

  // Relationship detection
  if (lowerName.includes('vợ') || lowerName.includes('vo') || lowerName.includes('wife')) {
    tags.push('wife');
  } else if (lowerName.includes('chồng') || lowerName.includes('chong') || lowerName.includes('husband')) {
    tags.push('husband');
  } else if (lowerName.includes('con') || lowerName.includes('child') || lowerName.includes('daughter') || lowerName.includes('son')) {
    tags.push('child');
  } else if (lowerName.includes('cha') || lowerName.includes('mẹ') || lowerName.includes('me') ||
             lowerName.includes('bố') || lowerName.includes('bo') || lowerName.includes('má') ||
             lowerName.includes('ba') || lowerName.includes('parent') || lowerName.includes('mom') ||
             lowerName.includes('dad')) {
    tags.push('parent');
  } else if (lowerName.includes('anh') || lowerName.includes('chị') || lowerName.includes('chi') ||
             lowerName.includes('em') || lowerName.includes('sibling') || lowerName.includes('brother') ||
             lowerName.includes('sister')) {
    tags.push('sibling');
  } else if (lowerName.includes('bạn') || lowerName.includes('ban') || lowerName.includes('friend')) {
    tags.push('friend');
  } else if (lowerName.includes('đồng nghiệp') || lowerName.includes('dong nghiep') ||
             lowerName.includes('colleague') || lowerName.includes('coworker')) {
    tags.push('colleague');
  }

  // Check for "family" keywords
  if (lowerName.includes('gia đình') || lowerName.includes('gia dinh') || lowerName.includes('family')) {
    tags.push('family');
  }

  return tags;
};

export const QuickEventModal: React.FC<QuickEventModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
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
        '✅ Thành công!',
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
              <Ionicons name={step > 1 ? "arrow-back" : "close"} size={24} color={COLORS.text} />
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
                <Ionicons name="heart" size={48} color={COLORS.primary} style={styles.stepIcon} />
                <Text style={styles.questionTitle}>Sự kiện quan trọng của bạn là gì?</Text>
                <Text style={styles.questionSubtitle}>
                  Hãy cho tôi biết, tôi sẽ giúp bạn không bao giờ quên 💝
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Sinh nhật vợ, Kỷ niệm ngày cưới..."
                  placeholderTextColor={COLORS.textSecondary}
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
                <Ionicons name="calendar" size={48} color={COLORS.primary} style={styles.stepIcon} />
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
                        selectedColor: COLORS.primary,
                      },
                    }}
                    theme={{
                      backgroundColor: 'transparent',
                      calendarBackground: 'transparent',
                      textSectionTitleColor: COLORS.textSecondary,
                      selectedDayBackgroundColor: COLORS.primary,
                      selectedDayTextColor: COLORS.white,
                      todayTextColor: COLORS.primary,
                      dayTextColor: COLORS.textPrimary,
                      textDisabledColor: COLORS.textLight,
                      dotColor: COLORS.primary,
                      selectedDotColor: COLORS.white,
                      arrowColor: COLORS.primary,
                      monthTextColor: COLORS.textPrimary,
                      indicatorColor: COLORS.primary,
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
                        color={COLORS.primary}
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
                  <Ionicons name="repeat" size={20} color={COLORS.primary} />
                  <Text style={styles.infoCardText}>
                    Sự kiện này sẽ lặp lại hàng năm vào {eventDate.getDate()} tháng {eventDate.getMonth() + 1}
                  </Text>
                </View>
              </View>
            )}

            {/* Step 3: Reminder Settings */}
            {step === 3 && (
              <View style={styles.stepContainer}>
                <Ionicons name="notifications" size={48} color={COLORS.primary} style={styles.stepIcon} />
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
                          color={isSelected ? COLORS.primary : COLORS.textSecondary}
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
                  <Ionicons name={step === 3 ? "checkmark" : "arrow-forward"} size={20} color={COLORS.white} />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    fontWeight: '600',
    color: COLORS.text,
  },
  stepIndicator: {
    backgroundColor: COLORS.primaryLight + '30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressContainer: {
    height: 3,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
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
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  calendarCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  selectedInfoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
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
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  reminderOptionSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  reminderOptionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  reminderOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  timePickerSection: {
    marginTop: 24,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
