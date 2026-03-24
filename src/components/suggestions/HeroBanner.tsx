import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

interface HeroBannerProps {
  onStartSurvey: () => void;
  onStartDetailedSurvey: () => void;
}

const FEATURES = [
  { icon: 'time-outline' as const,     label: 'Chỉ 2 phút' },
  { icon: 'sparkles' as const,         label: 'AI cá nhân hóa' },
  { icon: 'pricetag-outline' as const, label: 'Link mua ngay' },
];

const HeroBanner: React.FC<HeroBannerProps> = ({ onStartSurvey, onStartDetailedSurvey }) => {
  const styles = useStyles();
  const colors = useColors();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle pulse on CTA button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    // Float animation for the gift emoji
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        {/* Floating gift icon */}
        <Animated.View style={[styles.iconWrap, { transform: [{ translateY: floatAnim }] }]}>
          <Ionicons name="gift" size={40} color="rgba(255,255,255,0.95)" />
          {/* Sparkle accents */}
          <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.9)" style={styles.sparkleTopRight} />
          <Ionicons name="star" size={11} color="rgba(255,255,255,0.9)" style={styles.sparkleBottomLeft} />
        </Animated.View>

        {/* Text */}
        <Text style={styles.headline}>Tìm quà hoàn hảo{'\n'}cho người thương</Text>
        <Text style={styles.subtitle}>
          AI phân tích sở thích & tính cách để gợi ý quà tặng ý nghĩa nhất
        </Text>

        {/* Feature chips */}
        <View style={styles.featureRow}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureChip}>
              <Ionicons name={f.icon} size={12} color="rgba(255,255,255,0.95)" />
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA button with pulse */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity style={styles.ctaButton} onPress={onStartSurvey} activeOpacity={0.85}>
            <Ionicons name="flash" size={17} color={colors.primary} />
            <Text style={styles.ctaText}>Khảo sát nhanh (3 câu)</Text>
            <Ionicons name="arrow-forward" size={17} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Secondary link — detailed survey */}
        <TouchableOpacity onPress={onStartDetailedSurvey} activeOpacity={0.7} style={styles.detailedLink}>
          <Text style={styles.detailedLinkText}>Muốn gợi ý chính xác hơn? Khảo sát chi tiết →</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  gradient: {
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },

  // Decorative
  decorCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -20,
  },

  // Icon
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  sparkleTopRight: { position: 'absolute', top: -4, right: -6 },
  sparkleBottomLeft: { position: 'absolute', bottom: -4, left: -6 },

  // Text
  headline: {
    fontSize: 23,
    fontFamily: 'Manrope_800ExtraBold',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 31,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  // Feature chips
  featureRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featureText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: 'rgba(255,255,255,0.95)',
  },

  // CTA
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 26,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 8,
    elevation: 4,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  ctaText: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: colors.primary,
  },
  detailedLink: {
    marginTop: 14,
    paddingVertical: 4,
  },
  detailedLinkText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    textDecorationLine: 'underline',
  },
}));export default React.memo(HeroBanner);
