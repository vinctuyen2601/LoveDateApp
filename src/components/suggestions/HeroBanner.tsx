import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@themes/colors';
import { LinearGradient } from 'expo-linear-gradient';

interface HeroBannerProps {
  onStartSurvey: () => void;
}

const FEATURES = [
  { icon: 'time-outline' as const,     label: 'Chỉ 2 phút' },
  { icon: 'sparkles' as const,         label: 'AI cá nhân hóa' },
  { icon: 'pricetag-outline' as const, label: 'Link mua ngay' },
];

const HeroBanner: React.FC<HeroBannerProps> = ({ onStartSurvey }) => {
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
        colors={['#FF6B6B', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        {/* Floating gift icon */}
        <Animated.View style={[styles.iconWrap, { transform: [{ translateY: floatAnim }] }]}>
          <Text style={styles.iconEmoji}>🎁</Text>
          {/* Sparkle accents */}
          <Text style={[styles.sparkle, styles.sparkleTopRight]}>✨</Text>
          <Text style={[styles.sparkle, styles.sparkleBottomLeft]}>⭐</Text>
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
            <Ionicons name="sparkles" size={17} color="#FF6B6B" />
            <Text style={styles.ctaText}>Bắt đầu khảo sát ngay</Text>
            <Ionicons name="arrow-forward" size={17} color="#FF6B6B" />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#FF6B6B',
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
  iconEmoji: { fontSize: 40 },
  sparkle: {
    position: 'absolute',
    fontSize: 14,
  },
  sparkleTopRight: { top: -4, right: -6 },
  sparkleBottomLeft: { bottom: -4, left: -6, fontSize: 11 },

  // Text
  headline: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.white,
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
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },

  // CTA
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
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
    fontWeight: '700',
    color: '#FF6B6B',
  },
});

export default React.memo(HeroBanner);
