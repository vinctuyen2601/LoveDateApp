import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '../../types';
import { COLORS } from '@themes/colors';
import { getBadgeDefinition } from '@services/streak.service';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AchievementPopupProps {
  achievement: Achievement | null;
  visible: boolean;
  onClose: () => void;
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({
  achievement,
  visible,
  onClose,
}) => {
  const styles = useStyles();
  const colors = useColors();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievement) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, achievement]);

  if (!achievement) {
    return null;
  }

  const badge = getBadgeDefinition(achievement.badgeType);
  if (!badge) {
    return null;
  }

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Confetti effect */}
            <View style={styles.confettiContainer}>
              <Ionicons name="ribbon" size={22} color={colors.error} style={styles.confetti} />
              <Ionicons name="sparkles" size={22} color={colors.warning} style={styles.confetti} />
              <Ionicons name="sparkles" size={18} color={colors.primary} style={styles.confetti} />
              <Ionicons name="star" size={18} color={colors.warning} style={styles.confetti} />
            </View>

            {/* Badge Icon */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${badge.color}15` },
              ]}
            >
              <Ionicons name={badge.icon as any} size={80} color={badge.color} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Thành tựu mới!</Text>

            {/* Badge Name */}
            <Text style={styles.badgeName}>{badge.name}</Text>

            {/* Description */}
            <Text style={styles.description}>{badge.description}</Text>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Tuyệt vời!</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const useStyles = makeStyles((colors) => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH - 64,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
  },
  confetti: {
    fontSize: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  badgeName: {
    fontSize: 20,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: colors.white,
  },
}));export default AchievementPopup;
