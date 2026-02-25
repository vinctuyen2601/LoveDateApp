import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@themes/colors';

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak?: number;
  size?: 'small' | 'medium' | 'large';
  showLongest?: boolean;
}

const StreakBadge: React.FC<StreakBadgeProps> = ({
  currentStreak,
  longestStreak,
  size = 'medium',
  showLongest = false,
}) => {
  const getFlameColor = (): string => {
    if (currentStreak === 0) return COLORS.textSecondary;
    if (currentStreak < 7) return COLORS.warning;
    if (currentStreak < 30) return COLORS.categoryBirthday;
    return COLORS.success;
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          icon: 16,
          number: styles.numberSmall,
          label: styles.labelSmall,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          icon: 40,
          number: styles.numberLarge,
          label: styles.labelLarge,
        };
      default:
        return {
          container: styles.containerMedium,
          icon: 28,
          number: styles.numberMedium,
          label: styles.labelMedium,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const flameColor = getFlameColor();

  if (size === 'small') {
    return (
      <View style={[styles.container, styles.containerSmall]}>
        <Ionicons
          name={currentStreak > 0 ? 'flame' : 'flame-outline'}
          size={16}
          color={flameColor}
        />
        <Text style={[styles.number, styles.numberSmall, { color: flameColor }]}>
          {currentStreak}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, sizeStyles.container]}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={currentStreak > 0 ? 'flame' : 'flame-outline'}
          size={sizeStyles.icon}
          color={flameColor}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.number, sizeStyles.number, { color: flameColor }]}>
          {currentStreak}
        </Text>
        <Text style={[styles.label, sizeStyles.label]}>
          {currentStreak === 1 ? 'ngày' : 'ngày streak'}
        </Text>
        {showLongest && longestStreak !== undefined && longestStreak > currentStreak && (
          <Text style={styles.longest}>Tốt nhất: {longestStreak}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  containerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    shadowOpacity: 0,
    elevation: 0,
  },
  containerMedium: {
    padding: 12,
  },
  containerLarge: {
    padding: 16,
  },
  iconContainer: {
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  number: {
    fontWeight: '700',
    color: COLORS.warning,
  },
  numberSmall: {
    fontSize: 14,
  },
  numberMedium: {
    fontSize: 24,
  },
  numberLarge: {
    fontSize: 32,
  },
  label: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  labelSmall: {
    fontSize: 10,
  },
  labelMedium: {
    fontSize: 13,
  },
  labelLarge: {
    fontSize: 15,
  },
  longest: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default StreakBadge;
