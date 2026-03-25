import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

interface HeroBannerProps {
  onStartSurvey: () => void;
  onStartDetailedSurvey: () => void;
}

const FEATURES = [
  { icon: 'time-outline' as const,     label: '2 phút' },
  { icon: 'sparkles' as const,         label: 'AI' },
  { icon: 'pricetag-outline' as const, label: 'Mua ngay' },
];

const HeroBanner: React.FC<HeroBannerProps> = ({ onStartSurvey, onStartDetailedSurvey }) => {
  const styles = useStyles();
  const colors = useColors();

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

        <View style={styles.row}>
          {/* Left: text content */}
          <View style={styles.textCol}>
            {/* AI badge */}
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={11} color={colors.aiPrimary} />
              <Text style={styles.aiBadgeText}>AI gợi ý quà</Text>
            </View>

            <Text style={styles.headline}>Tìm quà hoàn hảo{'\n'}cho người thương</Text>
            <Text style={styles.subtitle}>
              Phân tích sở thích & tính cách, gợi ý quà ý nghĩa
            </Text>

            {/* Feature chips */}
            <View style={styles.featureRow}>
              {FEATURES.map((f) => (
                <View key={f.label} style={styles.featureChip}>
                  <Ionicons name={f.icon} size={11} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.featureText}>{f.label}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity style={styles.ctaButton} onPress={onStartSurvey} activeOpacity={0.85}>
              <Ionicons name="flash" size={15} color={colors.aiPrimary} />
              <Text style={styles.ctaText}>Khảo sát nhanh</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onStartDetailedSurvey} activeOpacity={0.7} style={styles.detailedLink}>
              <Text style={styles.detailedLinkText}>Chi tiết hơn →</Text>
            </TouchableOpacity>
          </View>

          {/* Right: icon decoration */}
          <View style={styles.iconCol}>
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <Ionicons name="gift" size={36} color="rgba(255,255,255,0.95)" />
              </View>
              <View style={styles.iconDotTR} />
              <View style={styles.iconDotBL} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  gradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },

  // Decorative
  decorCircle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -50,
    right: -30,
  },
  decorCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: -10,
  },

  // Layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  textCol: {
    flex: 1,
  },
  iconCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // AI badge
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.aiLight,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  aiBadgeText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: colors.aiPrimary,
  },

  // Text
  headline: {
    fontSize: 20,
    fontFamily: 'Manrope_800ExtraBold',
    color: colors.white,
    lineHeight: 27,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 17,
    marginBottom: 12,
  },

  // Feature chips
  featureRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featureText: {
    fontSize: 10,
    fontFamily: 'Manrope_600SemiBold',
    color: 'rgba(255,255,255,0.95)',
  },

  // CTA
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: colors.aiPrimary,
  },
  detailedLink: {
    marginTop: 8,
    paddingVertical: 2,
  },
  detailedLinkText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'underline',
  },

  // Icon decoration
  iconOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDotTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  iconDotBL: {
    position: 'absolute',
    bottom: 10,
    left: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
}));

export default React.memo(HeroBanner);
