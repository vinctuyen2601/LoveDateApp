import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REMIND_OPTIONS } from '../types';
import { COLORS } from '../constants/colors';

interface ReminderSettingsProps {
  selectedDays: number[];
  onToggle: (days: number) => void;
}

const ReminderSettings: React.FC<ReminderSettingsProps> = ({ selectedDays, onToggle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nhắc nhở trước</Text>
      <View style={styles.optionsContainer}>
        {REMIND_OPTIONS.map((option) => {
          const isSelected = selectedDays.includes(option.value);

          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
              ]}
              onPress={() => onToggle(option.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={22}
                color={isSelected ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedDays.length === 0 && (
        <Text style={styles.hint}>Chọn ít nhất một thời điểm để nhắc nhở</Text>
      )}
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
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    color: COLORS.warning,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default ReminderSettings;
