import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeDefinition, Achievement } from '../../types';
import { COLORS } from '@themes/colors';
import { getBadgeDefinition } from '@services/streak.service';
import PressableCard from '@components/atoms/PressableCard';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

interface BadgeCardProps {
  achievement?: Achievement;
  badgeDefinition?: BadgeDefinition;
  earned?: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

const BadgeCard: React.FC<BadgeCardProps> = ({
  achievement,
  badgeDefinition,
  earned = false,
  size = 'medium',
  onPress,
}) => {
  const styles = useStyles();
  const colors = useColors();

  // Get badge definition from achievement or use provided
  const badge = badgeDefinition || (achievement && getBadgeDefinition(achievement.badgeType));

  if (!badge) {
    return null;
  }

  const isEarned = earned || !!achievement;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          iconSize: 32,
          iconContainer: styles.iconContainerSmall,
          name: styles.nameSmall,
          description: styles.descriptionSmall,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          iconSize: 56,
          iconContainer: styles.iconContainerLarge,
          name: styles.nameLarge,
          description: styles.descriptionLarge,
        };
      default:
        return {
          container: styles.containerMedium,
          iconSize: 48,
          iconContainer: styles.iconContainerMedium,
          name: styles.nameMedium,
          description: styles.descriptionMedium,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const cardStyle = [styles.container, sizeStyles.container, !isEarned && styles.containerLocked];

  const content = (
    <>
      <View
        style={[
          styles.iconContainer,
          sizeStyles.iconContainer,
          { backgroundColor: isEarned ? `${badge.color}15` : `${colors.textSecondary}10` },
        ]}
      >
        <Ionicons
          name={badge.icon as any}
          size={sizeStyles.iconSize}
          color={isEarned ? badge.color : colors.textSecondary}
        />
        {!isEarned && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, sizeStyles.name, !isEarned && styles.textLocked]}>
          {badge.name}
        </Text>
        <Text style={[styles.description, sizeStyles.description, !isEarned && styles.textLocked]}>
          {badge.description}
        </Text>
        {achievement?.earnedAt && (
          <Text style={styles.earnedDate}>
            {new Date(achievement.earnedAt).toLocaleDateString('vi-VN')}
          </Text>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <PressableCard style={cardStyle} onPress={onPress}>
        {content}
      </PressableCard>
    );
  }

  return <View style={cardStyle}>{content}</View>;
};

const useStyles = makeStyles((colors) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  containerSmall: {
    padding: 8,
    marginBottom: 8,
  },
  containerMedium: {
    padding: 12,
    marginBottom: 12,
  },
  containerLarge: {
    padding: 16,
    marginBottom: 16,
  },
  containerLocked: {
    opacity: 0.6,
  },
  iconContainer: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  iconContainerSmall: {
    width: 48,
    height: 48,
  },
  iconContainerMedium: {
    width: 64,
    height: 64,
  },
  iconContainerLarge: {
    width: 80,
    height: 80,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  name: {
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  nameSmall: {
    fontSize: 14,
  },
  nameMedium: {
    fontSize: 16,
  },
  nameLarge: {
    fontSize: 18,
  },
  description: {
    color: colors.textSecondary,
  },
  descriptionSmall: {
    fontSize: 11,
  },
  descriptionMedium: {
    fontSize: 13,
  },
  descriptionLarge: {
    fontSize: 15,
  },
  textLocked: {
    color: colors.textSecondary,
  },
  earnedDate: {
    fontSize: 11,
    color: colors.success,
    marginTop: 4,
    fontFamily: 'Manrope_600SemiBold',
  },
}));export default BadgeCard;
