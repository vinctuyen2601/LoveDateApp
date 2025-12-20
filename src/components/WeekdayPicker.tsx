import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface WeekdayPickerProps {
  value: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  onChange: (dayOfWeek: number) => void;
}

const WEEKDAYS = [
  { value: 0, label: 'CN', fullLabel: 'Chủ nhật' },
  { value: 1, label: 'T2', fullLabel: 'Thứ 2' },
  { value: 2, label: 'T3', fullLabel: 'Thứ 3' },
  { value: 3, label: 'T4', fullLabel: 'Thứ 4' },
  { value: 4, label: 'T5', fullLabel: 'Thứ 5' },
  { value: 5, label: 'T6', fullLabel: 'Thứ 6' },
  { value: 6, label: 'T7', fullLabel: 'Thứ 7' },
];

const WeekdayPicker: React.FC<WeekdayPickerProps> = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Chọn thứ trong tuần</Text>
      <View style={styles.daysContainer}>
        {WEEKDAYS.map((day) => {
          const isSelected = value === day.value;
          return (
            <TouchableOpacity
              key={day.value}
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
              onPress={() => onChange(day.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.selectedText}>
        Sự kiện sẽ lặp lại mỗi {WEEKDAYS.find(d => d.value === value)?.fullLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayTextSelected: {
    color: COLORS.white,
  },
  selectedText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default WeekdayPicker;
