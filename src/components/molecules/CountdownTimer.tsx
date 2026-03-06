import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { DateUtils } from "@lib/date.utils";
import { COLORS } from "@themes/colors";
import { CountdownInfo } from "../../types";

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
      <Text style={[styles.label, isUrgent && !isToday && styles.urgentLabel]}>
        {countdown.isPast
          ? "Đã qua"
          : isToday
          ? "🎉 Hôm nay"
          : isUrgent
          ? "⚠️ Còn lại"
          : "Còn lại"}
      </Text>

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

const styles = StyleSheet.create({
  compactContainer: {
    paddingVertical: 4,
  },
  compactText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  pastText: {
    color: COLORS.textSecondary,
  },
  todayText: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: "700",
  },
  urgentText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: "700",
  },
  warningText: {
    color: COLORS.warning,
    fontSize: 15,
    fontWeight: "700",
  },
  container: {
    alignItems: "center",
    paddingVertical: 12,
  },
  urgentContainer: {
    backgroundColor: `${COLORS.error}10`,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  warningContainer: {
    backgroundColor: `${COLORS.warning}10`,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  urgentLabel: {
    color: COLORS.error,
    fontWeight: "700",
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
    fontWeight: "bold",
    color: COLORS.primary,
  },
  urgentTimeValue: {
    color: COLORS.error,
  },
  todayTimeValue: {
    color: COLORS.success,
  },
  timeUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default CountdownTimer;
