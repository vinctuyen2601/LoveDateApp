import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DateUtils } from '../utils/date.utils';
import { COLORS } from '../constants/colors';
import { CountdownInfo } from '../types';

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

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text
          style={[
            styles.compactText,
            countdown.isPast && styles.pastText,
            DateUtils.isToday(targetDate) && styles.todayText,
          ]}
        >
          {countdown.displayText}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {countdown.isPast ? 'Đã qua' : DateUtils.isToday(targetDate) ? 'Hôm nay!' : 'Còn lại'}
      </Text>

      <View style={styles.timeContainer}>
        {countdown.days > 0 && (
          <View style={styles.timeBlock}>
            <Text style={styles.timeValue}>{countdown.days}</Text>
            <Text style={styles.timeUnit}>ngày</Text>
          </View>
        )}

        {(countdown.days > 0 || countdown.hours > 0) && (
          <View style={styles.timeBlock}>
            <Text style={styles.timeValue}>{countdown.hours}</Text>
            <Text style={styles.timeUnit}>giờ</Text>
          </View>
        )}

        {countdown.days === 0 && (
          <View style={styles.timeBlock}>
            <Text style={styles.timeValue}>{countdown.minutes}</Text>
            <Text style={styles.timeUnit}>phút</Text>
          </View>
        )}

        {showSeconds && countdown.days === 0 && (
          <View style={styles.timeBlock}>
            <Text style={styles.timeValue}>{countdown.seconds}</Text>
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
    fontWeight: '600',
    color: COLORS.primary,
  },
  pastText: {
    color: COLORS.textSecondary,
  },
  todayText: {
    color: COLORS.success,
    fontSize: 16,
  },
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 50,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  timeUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default CountdownTimer;
