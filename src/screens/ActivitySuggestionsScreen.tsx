import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@themes/colors';
import { AffiliateProduct, Event } from '../types';
import { apiService } from '../services/api.service';
import GiftSuggestionCard from '@components/molecules/GiftSuggestionCard';
import { useToast } from '../contexts/ToastContext';

type ActivitySuggestionsRouteProp = RouteProp<
  { ActivitySuggestions: { event?: Event } },
  'ActivitySuggestions'
>;

const QUICK_IDEAS = [
  '🍽️ Nhà hàng lãng mạn',
  '☕ Cà phê hẹn hò',
  '🎬 Xem phim cùng nhau',
  '💆 Spa thư giãn',
  '🎵 Live music',
  '🌊 Picnic ngoài trời',
  '🎮 Cùng chơi game',
  '🏃 Hoạt động thể thao',
  '🛍️ Đi mua sắm',
  '🎨 Học làm đồ thủ công',
];

const BUDGET_PRESETS = [
  { label: 'Dưới 200k',   max: 200_000 },
  { label: '200k–500k',   max: 500_000 },
  { label: '500k–1 triệu', max: 1_000_000 },
  { label: '1–3 triệu',   max: 3_000_000 },
  { label: 'Trên 3 triệu', max: 10_000_000 },
];

// ── Skeleton card ───────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: anim }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { width: '75%', marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '45%', marginBottom: 12 }]} />
        <View style={[styles.skeletonLine, { width: '100%', height: 36, borderRadius: 10 }]} />
      </View>
    </Animated.View>
  );
};

// ── Main screen ─────────────────────────────────────────────────────────────

const ActivitySuggestionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ActivitySuggestionsRouteProp>();
  const insets = useSafeAreaInsets();
  const { showError } = useToast();

  const event = route.params?.event;

  const defaultPrompt = event
    ? `Gợi ý hoạt động cho dịp ${event.title}`
    : 'Gợi ý hoạt động hẹn hò lãng mạn';

  const [aiPrompt, setAiPrompt]       = useState(defaultPrompt);
  const [budgetIdx, setBudgetIdx]     = useState(1);
  const [isLoading, setIsLoading]     = useState(false);
  const [suggestions, setSuggestions] = useState<AffiliateProduct[]>([]);
  const [isAI, setIsAI]               = useState(false);
  const [reasoning, setReasoning]     = useState('');

  const appendIdea = (idea: string) => {
    const clean = idea.replace(/^[\p{Emoji}\s]+/u, '').trim();
    setAiPrompt((prev) => {
      if (prev.endsWith(clean)) return prev;
      return prev ? `${prev}, ${clean.toLowerCase()}` : clean;
    });
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setIsLoading(true);
      setReasoning('');
      setSuggestions([]);

      const budget = BUDGET_PRESETS[budgetIdx];
      const prompt = `${aiPrompt.trim()}, ngân sách dưới ${Math.round(budget.max / 1_000)}k, loại: nhà hàng, spa, hoạt động, địa điểm vui chơi`;

      const data = await apiService.post('/products/ai-suggest', { prompt });
      const products: AffiliateProduct[] = data.products || [];

      setSuggestions(products);
      setIsAI(true);
      setReasoning(data.reasoning || '');

      if (products.length === 0) {
        showError('Không tìm thấy hoạt động phù hợp. Thử mô tả khác.');
      }
    } catch {
      showError('Không thể kết nối AI. Vui lòng thử lại.');
      setIsAI(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Gợi ý hoạt động</Text>
          {event && (
            <Text style={styles.headerSub} numberOfLines={1}>{event.title}</Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* ── AI Card ─────────────────────────────────────────────────── */}
        <View style={styles.aiCard}>
          {/* Title */}
          <View style={styles.aiCardTitle}>
            <Text style={styles.aiSparkle}>🗺️</Text>
            <Text style={styles.aiCardLabel}>Bạn muốn làm gì hôm nay?</Text>
          </View>

          {/* Text input */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.aiInput}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
              numberOfLines={2}
              placeholder="VD: nhà hàng lãng mạn view đẹp, ăn tối sinh nhật..."
              placeholderTextColor={COLORS.textLight}
              textAlignVertical="top"
            />
            {aiPrompt.length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => setAiPrompt(defaultPrompt)}
              >
                <Ionicons name="refresh-outline" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick idea chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ideasRow}>
            {QUICK_IDEAS.map((idea) => (
              <TouchableOpacity key={idea} style={styles.ideaChip} onPress={() => appendIdea(idea)}>
                <Text style={styles.ideaChipText}>{idea}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Budget */}
          <Text style={styles.budgetLabel}>Ngân sách / người</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.budgetRow}>
            {BUDGET_PRESETS.map((p, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.budgetChip, budgetIdx === i && styles.budgetChipActive]}
                onPress={() => setBudgetIdx(i)}
              >
                <Text style={[styles.budgetChipText, budgetIdx === i && styles.budgetChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Generate button */}
          <TouchableOpacity
            style={[styles.generateBtn, (isLoading || !aiPrompt.trim()) && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={isLoading || !aiPrompt.trim()}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles" size={19} color={COLORS.white} />
            <Text style={styles.generateBtnText}>
              {isLoading ? 'Đang tìm...' : 'Tìm hoạt động với AI'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── AI Reasoning banner ──────────────────────────────────────── */}
        {(reasoning || (!isLoading && suggestions.length > 0 && !isAI)) && (
          <View style={[styles.reasoningBanner, !isAI && styles.reasoningBannerFallback]}>
            <Text style={styles.reasoningIcon}>{isAI ? '🤖' : 'ℹ️'}</Text>
            <Text style={[styles.reasoningText, !isAI && styles.reasoningTextFallback]}>
              {isAI
                ? (reasoning || 'Gợi ý được tạo bởi AI dựa trên mô tả của bạn')
                : 'Không có kết nối AI'}
            </Text>
            {isAI && (
              <TouchableOpacity onPress={() => { setSuggestions([]); setReasoning(''); }}>
                <Text style={styles.reasoningDismiss}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Skeleton loading ─────────────────────────────────────────── */}
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {/* ── Results ─────────────────────────────────────────────────── */}
        {!isLoading && suggestions.length > 0 && (
          <>
            <Text style={styles.resultCount}>{suggestions.length} gợi ý</Text>
            {suggestions.map((product) => (
              <GiftSuggestionCard
                key={product.id}
                product={product}
                showSaveButton={false}
              />
            ))}
          </>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {!isLoading && suggestions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>Tìm ý tưởng hẹn hò</Text>
            <Text style={styles.emptyText}>
              Mô tả bạn muốn làm gì và nhấn{' '}
              <Text style={{ fontWeight: '700', color: COLORS.secondary }}>"Tìm hoạt động với AI"</Text>
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    elevation: 2, shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  backButton:      { padding: 4, marginRight: 8 },
  headerTitleWrap: { flex: 1 },
  headerTitle:     { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  headerSub:       { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { padding: 16 },

  // AI Card
  aiCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: `${COLORS.secondary}30`,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  aiCardTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  aiSparkle:   { fontSize: 18 },
  aiCardLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },

  // Input
  inputWrap: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    marginBottom: 12,
  },
  aiInput: {
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 52,
    lineHeight: 20,
  },
  clearBtn: { alignSelf: 'flex-end', padding: 2, marginTop: 2 },

  // Quick ideas
  ideasRow: { gap: 8, paddingBottom: 4, marginBottom: 14 },
  ideaChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
  },
  ideaChipText: { fontSize: 12, color: COLORS.textSecondary },

  // Budget
  budgetLabel: {
    fontSize: 12, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
  },
  budgetRow: { gap: 8, paddingBottom: 2, marginBottom: 16 },
  budgetChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
  },
  budgetChipActive:     { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  budgetChipText:       { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  budgetChipTextActive: { color: COLORS.white, fontWeight: '600' },

  // Generate button
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.secondary,
    paddingVertical: 14, borderRadius: 14,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText:     { fontSize: 15, fontWeight: '700', color: COLORS.white },

  // Reasoning banner
  reasoningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: `${COLORS.secondary}12`,
    borderRadius: 12, padding: 12, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: COLORS.secondary,
  },
  reasoningBannerFallback: {
    backgroundColor: `${COLORS.textSecondary}08`,
    borderLeftColor: COLORS.textSecondary,
  },
  reasoningIcon:         { fontSize: 15, marginTop: 1 },
  reasoningText:         { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textPrimary, fontStyle: 'italic' },
  reasoningTextFallback: { color: COLORS.textSecondary },
  reasoningDismiss:      { fontSize: 14, color: COLORS.textSecondary, padding: 2 },

  // Result count
  resultCount: {
    fontSize: 13, color: COLORS.textSecondary,
    fontWeight: '500', marginBottom: 10, paddingHorizontal: 2,
  },

  // Skeleton
  skeletonCard: {
    backgroundColor: COLORS.white, borderRadius: 16,
    marginBottom: 14, overflow: 'hidden',
    elevation: 1, shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
  },
  skeletonImage:   { width: '100%', height: 140, backgroundColor: COLORS.borderLight },
  skeletonContent: { padding: 14 },
  skeletonLine:    { height: 12, backgroundColor: COLORS.borderLight, borderRadius: 6 },

  // Empty state
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56 },
  emptyIcon:  { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText:  { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 28, lineHeight: 21 },
});

export default ActivitySuggestionsScreen;
