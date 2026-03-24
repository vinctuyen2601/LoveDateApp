import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import IconImage from '@components/atoms/IconImage';
import { getMBTITypeImage } from '@lib/iconImages';

export interface ShareableMBTIResult {
  type: string;
  description: string;   // "Kiến trúc sư - Tư duy chiến lược..."
  loveStyle: string;
  strengths: string[];
  compatibility: { best: string[] };
}

interface Props {
  result: ShareableMBTIResult;
}

// ── Màu gradient theo nhóm MBTI ────────────────────────────────────────────
function getTheme(type: string): {
  colors: [string, string, ...string[]];
  ionIcon: string;
  group: string;
} {
  const t = type.toUpperCase();
  if (['INTJ', 'INTP', 'ENTJ', 'ENTP'].includes(t))
    return { colors: ['#667EEA', '#764BA2'], ionIcon: 'analytics-outline', group: 'Nhà phân tích' };
  if (['INFJ', 'INFP', 'ENFJ', 'ENFP'].includes(t))
    return { colors: ['#0F9B8E', '#00C9FF'], ionIcon: 'heart-outline', group: 'Nhà ngoại giao' };
  if (['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'].includes(t))
    return { colors: ['#F7971E', '#FFD200'], ionIcon: 'shield-outline', group: 'Người gác cổng' };
  return { colors: ['#F953C6', '#B91D73'], ionIcon: 'flame-outline', group: 'Nhà khám phá' };
}

// ── Tách tên vai trò khỏi description ──────────────────────────────────────
function getRoleName(description: string): string {
  return description.split(' - ')[0] ?? description;
}

const MBTIShareCard: React.FC<Props> = ({ result }) => {
  const theme = getTheme(result.type);
  const roleName = getRoleName(result.description);
  const topStrengths = result.strengths.slice(0, 2);
  const bestTypes = result.compatibility.best.join('  ·  ');

  return (
    <LinearGradient
      colors={theme.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="heart" size={16} color="rgba(255,255,255,0.9)" />
          <Text style={styles.appName}>Love Date</Text>
        </View>
        <View style={styles.groupBadge}>
          <Text style={styles.groupText}>{theme.group}</Text>
        </View>
      </View>

      {/* ── Hero: Type ── */}
      <View style={styles.heroSection}>
        <IconImage source={getMBTITypeImage(result.type)} size={56} />
        <Text style={styles.typeText}>{result.type}</Text>
        <Text style={styles.roleText}>{roleName}</Text>
        <View style={styles.typeDivider} />
      </View>

      {/* ── Love style ── */}
      <View style={styles.section}>
        <View style={styles.sectionLabel}>
          <Ionicons name="heart-circle" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.sectionTitle}>Phong cách yêu</Text>
        </View>
        <Text style={styles.loveStyleText}>{result.loveStyle}</Text>
      </View>

      {/* ── Strengths ── */}
      <View style={styles.section}>
        <View style={styles.sectionLabel}>
          <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.sectionTitle}>Điểm nổi bật</Text>
        </View>
        {topStrengths.map((s, i) => (
          <View key={i} style={styles.strengthRow}>
            <View style={styles.strengthDot} />
            <Text style={styles.strengthText}>{s}</Text>
          </View>
        ))}
      </View>

      {/* ── Compatibility ── */}
      <View style={styles.compatRow}>
        <Ionicons name="people" size={14} color="rgba(255,255,255,0.8)" />
        <Text style={styles.compatLabel}>Hợp nhất với</Text>
        <Text style={styles.compatTypes}>{bestTypes}</Text>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <Text style={styles.footerText}>
          Khám phá tính cách của bạn tại{' '}
          <Text style={styles.footerBold}>Love Date App</Text>
        </Text>
      </View>
    </LinearGradient>
  );
};

const CARD_WIDTH = 340;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 24,
    padding: 24,
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  groupBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  groupText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: '#fff',
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 64,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#fff',
    letterSpacing: 6,
    lineHeight: 72,
  },
  roleText: {
    fontSize: 17,
    fontFamily: 'Manrope_600SemiBold',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  typeDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
    marginTop: 16,
  },

  // Sections
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  loveStyleText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 21,
    fontStyle: 'italic',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  strengthDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  strengthText: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Manrope_500Medium',
  },

  // Compatibility
  compatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  compatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Manrope_600SemiBold',
  },
  compatTypes: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Manrope_700Bold',
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    alignItems: 'center',
  },
  footerDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerBold: {
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
  },
});

export default MBTIShareCard;
