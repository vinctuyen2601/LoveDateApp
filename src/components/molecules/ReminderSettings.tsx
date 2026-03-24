import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REMIND_OPTIONS } from '../../types';
import { COLORS } from '@themes/colors';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

interface ReminderSettingsProps {
  selectedDays: number[];
  onToggle: (days: number) => void;
  eventDate?: Date;
  isRecurring?: boolean;
}

const ReminderSettings: React.FC<ReminderSettingsProps> = ({
  selectedDays,
  onToggle,
  eventDate,
  isRecurring,
}) => {
  const styles = useStyles();
  const colors = useColors();

  const getValidOptions = () => {
    // For recurring events, all options are valid
    if (isRecurring !== false || !eventDate) return REMIND_OPTIONS;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return REMIND_OPTIONS.filter((option) => {
      const notifDate = new Date(eventDate);
      notifDate.setHours(0, 0, 0, 0);
      notifDate.setDate(notifDate.getDate() - option.value);
      return notifDate >= today;
    });
  };

  const validOptions = getValidOptions();
  const hiddenCount = REMIND_OPTIONS.length - validOptions.length;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nhắc nhở trước</Text>
      <View style={styles.optionsContainer}>
        {validOptions.map((option) => {
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
                color={isSelected ? colors.primary : colors.textSecondary}
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

      {hiddenCount > 0 && (
        <View style={styles.hiddenInfo}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.hiddenInfoText}>
            {hiddenCount} tùy chọn không khả dụng vì ngày sự kiện quá gần
          </Text>
        </View>
      )}

      {selectedDays.length === 0 && (
        <Text style={styles.hint}>Chọn ít nhất một thời điểm để nhắc nhở</Text>
      )}
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontFamily: 'Manrope_600SemiBold',
  },
  hiddenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  hiddenInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  hint: {
    fontSize: 13,
    color: colors.warning,
    marginTop: 8,
    fontStyle: 'italic',
  },
}));export default ReminderSettings;
