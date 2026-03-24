import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { COLORS } from '@themes/colors';
import { TYPOGRAPHY } from '@themes/typography';
import { SPACING, RADIUS } from '@themes/spacing';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton';
  text?: string;
  skeletonCount?: number;
  skeletonType?: 'card' | 'list' | 'stat';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  text = 'Đang tải...',
  skeletonCount = 3,
  skeletonType = 'card',
}) => {
  const styles = useStyles();
  const colors = useColors();

  if (variant === 'spinner') {
    return (
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{text}</Text>
      </View>
    );
  }

  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <SkeletonCard key={index} type={skeletonType} delay={index * 150} />
      ))}
    </View>
  );
};

interface SkeletonCardProps {
  type: 'card' | 'list' | 'stat';
  delay: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ type, delay }) => {
  const styles = useStyles();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim, delay]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (type === 'stat') {
    return (
      <Animated.View style={[styles.statSkeleton, { opacity }]}>
        <View style={styles.statIconPlaceholder} />
        <View style={styles.statTextGroup}>
          <View style={styles.statValuePlaceholder} />
          <View style={styles.statLabelPlaceholder} />
        </View>
      </Animated.View>
    );
  }

  if (type === 'list') {
    return (
      <Animated.View style={[styles.listSkeleton, { opacity }]}>
        <View style={styles.listIconPlaceholder} />
        <View style={styles.listTextGroup}>
          <View style={styles.listTitlePlaceholder} />
          <View style={styles.listSubtitlePlaceholder} />
        </View>
      </Animated.View>
    );
  }

  // card type (default)
  return (
    <Animated.View style={[styles.cardSkeleton, { opacity }]}>
      <View style={styles.cardLeftAccent} />
      <View style={styles.cardIconPlaceholder} />
      <View style={styles.cardTextGroup}>
        <View style={styles.cardTitlePlaceholder} />
        <View style={styles.cardSubtitlePlaceholder} />
        <View style={styles.cardMetaPlaceholder} />
      </View>
    </Animated.View>
  );
};

const SHIMMER_COLOR = COLORS.border;

const useStyles = makeStyles((colors) => ({
  // Spinner variant
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl * 2,
  },
  loadingText: {
    ...TYPOGRAPHY.bodyMedium,
    color: colors.textSecondary,
    marginTop: SPACING.md,
  },

  // Skeleton container
  skeletonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },

  // Card skeleton
  cardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  cardLeftAccent: {
    width: 4,
    height: 48,
    borderRadius: 2,
    backgroundColor: SHIMMER_COLOR,
  },
  cardIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: SHIMMER_COLOR,
  },
  cardTextGroup: {
    flex: 1,
    gap: SPACING.sm,
  },
  cardTitlePlaceholder: {
    width: '70%',
    height: 14,
    borderRadius: 4,
    backgroundColor: SHIMMER_COLOR,
  },
  cardSubtitlePlaceholder: {
    width: '50%',
    height: 12,
    borderRadius: 4,
    backgroundColor: SHIMMER_COLOR,
  },
  cardMetaPlaceholder: {
    width: '30%',
    height: 10,
    borderRadius: 4,
    backgroundColor: SHIMMER_COLOR,
  },

  // List skeleton
  listSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  listIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: SHIMMER_COLOR,
  },
  listTextGroup: {
    flex: 1,
    gap: SPACING.xs,
  },
  listTitlePlaceholder: {
    width: '60%',
    height: 14,
    borderRadius: 4,
    backgroundColor: SHIMMER_COLOR,
  },
  listSubtitlePlaceholder: {
    width: '40%',
    height: 12,
    borderRadius: 4,
    backgroundColor: SHIMMER_COLOR,
  },

  // Stat skeleton
  statSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  statIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: SHIMMER_COLOR,
  },
  statTextGroup: {
    flex: 1,
    gap: SPACING.sm,
  },
  statValuePlaceholder: {
    width: '40%',
    height: 20,
    borderRadius: 4,
    backgroundColor: SHIMMER_COLOR,
  },
  statLabelPlaceholder: {
    width: '60%',
    height: 12,
    borderRadius: 4,
    backgroundColor: SHIMMER_COLOR,
  },
}));