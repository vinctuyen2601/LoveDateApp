import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@themes/colors';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

interface TimePickerProps {
  selectedTime: { hour: number; minute: number };
  onTimeChange: (time: { hour: number; minute: number }) => void;
  minTime?: { hour: number; minute: number };
}

const TimePicker: React.FC<TimePickerProps> = ({ selectedTime, onTimeChange, minTime }) => {
  const styles = useStyles();
  const colors = useColors();

  const [showModal, setShowModal] = useState(false);
  const [tempHour, setTempHour] = useState(selectedTime.hour);
  const [tempMinute, setTempMinute] = useState(selectedTime.minute);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const ITEM_HEIGHT = 52;

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const isHourDisabled = (hour: number) => {
    if (!minTime) return false;
    return hour < minTime.hour;
  };

  const isMinuteDisabled = (hour: number, minute: number) => {
    if (!minTime) return false;
    if (hour > minTime.hour) return false;
    if (hour < minTime.hour) return true;
    return minute <= minTime.minute;
  };

  const isCurrentSelectionInvalid = () => {
    if (!minTime) return false;
    if (tempHour > minTime.hour) return false;
    if (tempHour < minTime.hour) return true;
    return tempMinute <= minTime.minute;
  };

  // Sync state with props when selectedTime changes
  useEffect(() => {
    setTempHour(selectedTime.hour);
    setTempMinute(selectedTime.minute);
  }, [selectedTime.hour, selectedTime.minute]);

  // Auto scroll to selected time when modal opens
  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({
          y: tempHour * ITEM_HEIGHT,
          animated: true,
        });
        minuteScrollRef.current?.scrollTo({
          y: tempMinute * ITEM_HEIGHT,
          animated: true,
        });
      }, 100);
    }
  }, [showModal]);

  const handleConfirm = () => {
    onTimeChange({ hour: tempHour, minute: tempMinute });
    setShowModal(false);
  };

  const handleCancel = () => {
    setTempHour(selectedTime.hour);
    setTempMinute(selectedTime.minute);
    setShowModal(false);
  };

  const scrollToHour = (hour: number) => {
    hourScrollRef.current?.scrollTo({
      y: hour * ITEM_HEIGHT,
      animated: true,
    });
  };

  const scrollToMinute = (minute: number) => {
    minuteScrollRef.current?.scrollTo({
      y: minute * ITEM_HEIGHT,
      animated: true,
    });
  };

  const isSelectionInvalid = isCurrentSelectionInvalid();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Giờ nhận thông báo</Text>
      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="time-outline" size={22} color={colors.primary} />
        <Text style={styles.timeText}>
          {formatTime(selectedTime.hour, selectedTime.minute)}
        </Text>
        {minTime && (
          <View style={styles.timeWarningBadge}>
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text style={styles.timeWarningBadgeText}>Chạm để đổi</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={styles.chevron} />
      </TouchableOpacity>

      {minTime && (
        <Text style={styles.minTimeHint}>
          Thông báo trong hôm nay — chọn sau {formatTime(minTime.hour, minTime.minute)}
        </Text>
      )}

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn giờ thông báo</Text>
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {isSelectionInvalid && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning-outline" size={16} color={colors.warning} />
                <Text style={styles.warningText}>
                  Giờ đã chọn đã qua, vui lòng chọn sau {formatTime(minTime!.hour, minTime!.minute)}
                </Text>
              </View>
            )}

            <View style={styles.pickerContainer}>
              {/* Hour Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Giờ</Text>
                <ScrollView
                  ref={hourScrollRef}
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                >
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                    const disabled = isHourDisabled(hour);
                    return (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.pickerItem,
                          tempHour === hour && styles.pickerItemSelected,
                          disabled && styles.pickerItemDisabled,
                        ]}
                        onPress={() => {
                          if (disabled) return;
                          setTempHour(hour);
                          scrollToHour(hour);
                          // If minute becomes invalid for this hour, reset it
                          if (minTime && hour === minTime.hour && tempMinute <= minTime.minute) {
                            setTempMinute(minTime.minute + 1);
                            scrollToMinute(minTime.minute + 1);
                          }
                        }}
                        disabled={disabled}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            tempHour === hour && styles.pickerItemTextSelected,
                            disabled && styles.pickerItemTextDisabled,
                          ]}
                        >
                          {hour.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={styles.separator}>:</Text>

              {/* Minute Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Phút</Text>
                <ScrollView
                  ref={minuteScrollRef}
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((minute) => {
                    const disabled = isMinuteDisabled(tempHour, minute);
                    return (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.pickerItem,
                          tempMinute === minute && styles.pickerItemSelected,
                          disabled && styles.pickerItemDisabled,
                        ]}
                        onPress={() => {
                          if (disabled) return;
                          setTempMinute(minute);
                          scrollToMinute(minute);
                        }}
                        disabled={disabled}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            tempMinute === minute && styles.pickerItemTextSelected,
                            disabled && styles.pickerItemTextDisabled,
                          ]}
                        >
                          {minute.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, isSelectionInvalid && styles.confirmButtonDisabled]}
                onPress={isSelectionInvalid ? undefined : handleConfirm}
              >
                <Text style={styles.confirmButtonText}>
                  {isSelectionInvalid ? 'Chọn giờ hợp lệ' : 'Xác nhận'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  timeText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontFamily: 'Manrope_700Bold',
    flex: 1,
  },
  timeWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeWarningBadgeText: {
    fontSize: 11,
    color: colors.warning,
    fontFamily: 'Manrope_600SemiBold',
  },
  chevron: {
    marginLeft: 'auto',
  },
  minTimeHint: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 6,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warning + '15',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning + '30',
  },
  warningText: {
    fontSize: 13,
    color: colors.warning,
    flex: 1,
    fontFamily: 'Manrope_500Medium',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  pickerColumn: {
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerScroll: {
    height: 264,
    width: 96,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  pickerItem: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 2,
    marginHorizontal: 4,
  },
  pickerItemSelected: {
    backgroundColor: colors.primary,
  },
  pickerItemDisabled: {
    opacity: 0.3,
  },
  pickerItemText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontFamily: 'Manrope_500Medium',
  },
  pickerItemTextSelected: {
    color: colors.white,
    fontFamily: 'Manrope_700Bold',
  },
  pickerItemTextDisabled: {
    color: colors.textSecondary,
  },
  separator: {
    fontSize: 28,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginTop: 34,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.white,
  },
}));export default TimePicker;
