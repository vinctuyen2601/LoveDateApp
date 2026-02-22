import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

interface HeroBannerProps {
  onStartSurvey: () => void;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ onStartSurvey }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="gift-outline" size={48} color={COLORS.white} />
        </View>

        <Text style={styles.headline}>Tìm quà hoàn hảo{'\n'}cho người thương</Text>
        <Text style={styles.subtitle}>
          Chỉ 2 phút khảo sát • Gợi ý phù hợp 100%
        </Text>

        <TouchableOpacity style={styles.ctaButton} onPress={onStartSurvey} activeOpacity={0.8}>
          <Text style={styles.ctaText}>Bắt đầu khảo sát</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>2,500+ gợi ý</Text>
          <View style={styles.statDot} />
          <Text style={styles.statText}>15+ danh mục</Text>
          <View style={styles.statDot} />
          <Text style={styles.statText}>5 loại dịch vụ</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headline: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    marginBottom: 16,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});

export default React.memo(HeroBanner);
