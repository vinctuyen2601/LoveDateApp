import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecurrenceType } from '../../types';
import { COLORS } from '@themes/colors';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

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
  const styles = useStyles();
  const colors = useColors();


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
              color={isSelected ? colors.white : colors.textSecondary}
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

const useStyles = makeStyles((colors) => ({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    gap: 4,
  },
  tabSelected: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabTextSelected: {
    color: colors.white,
    fontFamily: 'Manrope_600SemiBold',
  },
}));export default RecurrenceTypePicker;
