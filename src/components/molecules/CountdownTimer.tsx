import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DateUtils } from "@lib/date.utils";
import { COLORS } from "@themes/colors";
import { CountdownInfo } from "../../types";
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

interface CountdownTimerProps {
  targetDate: string | Date;
  compact?: boolean;
  showSeconds?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  compact = false,
  showSeconds = false,
}) => {
  const styles = useStyles();
  const colors = useColors();

  const [countdown, setCountdown] = useState<CountdownInfo>(
    DateUtils.getCountdown(targetDate)
  );

  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(DateUtils.getCountdown(targetDate));
    };

    // Update every second if showing seconds, otherwise every minute
    const interval = setInterval(updateCountdown, showSeconds ? 1000 : 60000);

    return () => clearInterval(interval);
  }, [targetDate, showSeconds]);

  // Determine urgency level
  const isUrgent = countdown.days <= 2 && countdown.days >= 0; // 0-2 days
  const isWarning = countdown.days === 3; // Exactly 3 days
  const isToday = DateUtils.isToday(targetDate);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text
          style={[
            styles.compactText,
            countdown.isPast && styles.pastText,
            isToday && styles.todayText,
            isUrgent && !isToday && styles.urgentText,
            isWarning && styles.warningText,
          ]}
        >
          {countdown.displayText}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isUrgent && !isToday && styles.urgentContainer,
        isWarning && styles.warningContainer,
      ]}
    >
      <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
        {isToday && <Ionicons name="ribbon" size={13} color={colors.primary} />}
        {isUrgent && !isToday && <Ionicons name="alert-circle-outline" size={13} color={colors.error} />}
        <Text style={[styles.label, isUrgent && !isToday && styles.urgentLabel]}>
          {countdown.isPast ? "Đã qua" : isToday ? "Hôm nay" : "Còn lại"}
        </Text>
      </View>

      <View style={styles.timeContainer}>
        {countdown.days > 0 && (
          <View style={styles.timeBlock}>
            <Text
              style={[
                styles.timeValue,
                isUrgent && !isToday && styles.urgentTimeValue,
              ]}
            >
              {countdown.days}
            </Text>
            <Text style={styles.timeUnit}>ngày</Text>
          </View>
        )}

        {(countdown.days > 0 || countdown.hours > 0) && (
          <View style={styles.timeBlock}>
            <Text
              style={[
                styles.timeValue,
                isUrgent && !isToday && styles.urgentTimeValue,
              ]}
            >
              {countdown.hours}
            </Text>
            <Text style={styles.timeUnit}>giờ</Text>
          </View>
        )}

        {countdown.days === 0 && (
          <View style={styles.timeBlock}>
            <Text style={[styles.timeValue, isToday && styles.todayTimeValue]}>
              {countdown.minutes}
            </Text>
            <Text style={styles.timeUnit}>phút</Text>
          </View>
        )}

        {showSeconds && countdown.days === 0 && (
          <View style={styles.timeBlock}>
            <Text style={[styles.timeValue, isToday && styles.todayTimeValue]}>
              {countdown.seconds}
            </Text>
            <Text style={styles.timeUnit}>giây</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  compactContainer: {
    paddingVertical: 4,
  },
  compactText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.primary,
  },
  pastText: {
    color: colors.textSecondary,
  },
  todayText: {
    color: colors.success,
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
  },
  urgentText: {
    color: colors.error,
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
  },
  warningText: {
    color: colors.warning,
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
  },
  container: {
    alignItems: "center",
    paddingVertical: 12,
  },
  urgentContainer: {
    backgroundColor: `${colors.error}10`,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  warningContainer: {
    backgroundColor: `${colors.warning}10`,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  urgentLabel: {
    color: colors.error,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  timeContainer: {
    flexDirection: "row",
    gap: 16,
  },
  timeBlock: {
    alignItems: "center",
    minWidth: 50,
  },
  timeValue: {
    fontSize: 32,
    fontFamily: 'Manrope_700Bold',
    color: colors.primary,
  },
  urgentTimeValue: {
    color: colors.error,
  },
  todayTimeValue: {
    color: colors.success,
  },
  timeUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
}));export default CountdownTimer;
