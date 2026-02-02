import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = COLORS.primary,
  trend,
  trendValue,
  onPress,
}) => {
  const getTrendIcon = (): keyof typeof Ionicons.glyphMap => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return 'remove';
  };

  const getTrendColor = (): string => {
    if (trend === 'up') return COLORS.success;
    if (trend === 'down') return COLORS.error;
    return COLORS.textSecondary;
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Icon */}
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {/* Trend */}
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <Ionicons name={getTrendIcon()} size={16} color={getTrendColor()} />
            <Text style={[styles.trendValue, { color: getTrendColor() }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>

      {/* Arrow if pressable */}
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      )}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StatCard;
