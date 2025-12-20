import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecurrenceType } from '../types';
import { COLORS } from '../constants/colors';

interface RecurrenceTypePickerProps {
  value: RecurrenceType;
  onChange: (type: RecurrenceType) => void;
}

const RECURRENCE_OPTIONS = [
  { value: 'once' as RecurrenceType, label: 'Một lần', icon: 'calendar-outline' },
  { value: 'weekly' as RecurrenceType, label: 'Hàng tuần', icon: 'repeat-outline' },
  { value: 'monthly' as RecurrenceType, label: 'Hàng tháng', icon: 'calendar' },
  { value: 'yearly' as RecurrenceType, label: 'Hàng năm', icon: 'calendar-sharp' },
];

const RecurrenceTypePicker: React.FC<RecurrenceTypePickerProps> = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      {RECURRENCE_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.tab, isSelected && styles.tabSelected]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={option.icon as any}
              size={20}
              color={isSelected ? COLORS.white : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    gap: 4,
  },
  tabSelected: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tabTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default RecurrenceTypePicker;
