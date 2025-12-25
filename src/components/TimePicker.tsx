import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface TimePickerProps {
  selectedTime: { hour: number; minute: number };
  onTimeChange: (time: { hour: number; minute: number }) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ selectedTime, onTimeChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [tempHour, setTempHour] = useState(selectedTime.hour);
  const [tempMinute, setTempMinute] = useState(selectedTime.minute);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const ITEM_HEIGHT = 44;

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Giờ nhận thông báo</Text>
      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="time-outline" size={20} color={COLORS.primary} />
        <Text style={styles.timeText}>
          {formatTime(selectedTime.hour, selectedTime.minute)}
        </Text>
      </TouchableOpacity>

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
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

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
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerItem,
                        tempHour === hour && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        setTempHour(hour);
                        scrollToHour(hour);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempHour === hour && styles.pickerItemTextSelected,
                        ]}
                      >
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
                  {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerItem,
                        tempMinute === minute && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        setTempMinute(minute);
                        scrollToMinute(minute);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempMinute === minute && styles.pickerItemTextSelected,
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
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
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  pickerColumn: {
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  pickerScroll: {
    height: 200,
    width: 80,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
  pickerItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 4,
  },
  pickerItemSelected: {
    backgroundColor: COLORS.primary,
  },
  pickerItemText: {
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  pickerItemTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  separator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 28,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default TimePicker;
