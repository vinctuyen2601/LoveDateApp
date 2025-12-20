import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../constants/colors';

interface MonthDayPickerProps {
  value: number; // 1-31
  onChange: (dayOfMonth: number) => void;
}

const MonthDayPicker: React.FC<MonthDayPickerProps> = ({ value, onChange }) => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Chọn ngày trong tháng</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysContainer}
      >
        {days.map((day) => {
          const isSelected = value === day;
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
              onPress={() => onChange(day)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={styles.selectedText}>
        Sự kiện sẽ lặp lại mỗi ngày {value} hàng tháng
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
    gap: 8,
    paddingHorizontal: 4,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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

export default MonthDayPicker;
