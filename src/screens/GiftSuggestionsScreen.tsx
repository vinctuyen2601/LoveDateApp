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
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@themes/colors';
import { AffiliateProduct, Event, GiftHistoryItem as GiftHistoryItemType } from '../types';
import { generateGiftSuggestionsWithFallback } from '../services/giftSuggestion.service';
import {
  getGiftHistory,
  createGiftItem,
  deleteGiftItem,
  markGiftAsPurchased,
} from '../services/giftHistory.service';
import GiftSuggestionCard from '@components/molecules/GiftSuggestionCard';
import GiftHistoryItem from '@components/molecules/GiftHistoryItem';
import { useToast } from '../contexts/ToastContext';

type GiftSuggestionsScreenRouteProp = RouteProp<
  { GiftSuggestions: { eventId: string; event: Event } },
  'GiftSuggestions'
>;

const TAG_LABEL: Record<string, string> = {
  birthday: 'sinh nhật', anniversary: 'kỷ niệm', valentine: 'Valentine',
  women_day_8_3: '8/3', women_day_20_10: '20/10', christmas: 'Giáng sinh',
  holiday: 'ngày lễ', other: 'dịp đặc biệt',
};

const BUDGET_PRESETS = [
  { label: 'Dưới 200k',    min: 0,         max: 200_000 },
  { label: '200k–500k',    min: 200_000,   max: 500_000 },
  { label: '500k–1triệu',  min: 500_000,   max: 1_000_000 },
  { label: '1–3 triệu',    min: 1_000_000, max: 3_000_000 },
  { label: 'Trên 3 triệu', min: 3_000_000, max: 20_000_000 },
];

const QUICK_IDEAS = [
  '🌸 Hoa & quà combo',
  '📚 Sách hay',
  '☕ Cà phê, trà',
  '💄 Mỹ phẩm',
  '🎮 Công nghệ',
  '💆 Spa, thư giãn',
  '👗 Thời trang',
  '🍫 Bánh ngọt',
];

// ── Skeleton card ──────────────────────────────────────────────────────────

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
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonCircle} />
        <View style={styles.skeletonLines}>
          <View style={[styles.skeletonLine, { width: '70%' }]} />
          <View style={[styles.skeletonLine, { width: '40%', marginTop: 6 }]} />
        </View>
        <View style={styles.skeletonBadge} />
      </View>
      <View style={[styles.skeletonLine, { width: '50%', marginBottom: 10 }]} />
      <View style={[styles.skeletonLine, { width: '100%', height: 36, borderRadius: 10 }]} />
    </Animated.View>
  );
};

// ── Main screen ────────────────────────────────────────────────────────────

const GiftSuggestionsScreen: React.FC = () => {
  const route = useRoute<GiftSuggestionsScreenRouteProp>();
  const navigation = useNavigation();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();

  const { eventId, event } = route.params;

  const defaultOccasion = TAG_LABEL[event.tags?.[0]] || 'dịp đặc biệt';
  const defaultPrompt = `Gợi ý quà ${defaultOccasion}: ${event.title}`;

  const [isLoading, setIsLoading]     = useState(false);
  const [suggestions, setSuggestions] = useState<AffiliateProduct[]>([]);
  const [isAI, setIsAI]               = useState(false);
  const [reasoning, setReasoning]     = useState('');
  const [giftHistory, setGiftHistory] = useState<GiftHistoryItemType[]>([]);
  const [activeTab, setActiveTab]     = useState<'suggestions' | 'history'>('suggestions');

  const [aiPrompt, setAiPrompt]   = useState(defaultPrompt);
  const [budgetIdx, setBudgetIdx] = useState(1);

  useEffect(() => { loadGiftHistory(); }, []);

  const loadGiftHistory = async () => {
    try {
      const history = await getGiftHistory(db, eventId);
      setGiftHistory(history);
    } catch {}
  };

  const handleGenerateSuggestions = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setIsLoading(true);
      setReasoning('');
      setSuggestions([]);

      const result = await generateGiftSuggestionsWithFallback(db, {
        event,
        budget: { min: BUDGET_PRESETS[budgetIdx].min, max: BUDGET_PRESETS[budgetIdx].max },
        preferences: aiPrompt.trim(),
      });

      setSuggestions(result.suggestions);
      setIsAI(result.isAI);
      setReasoning(result.reasoning || '');

      if (!result.isAI) {
        showError('Không kết nối được AI. Hiển thị từ danh mục.');
      } else if (result.suggestions.length === 0) {
        showError('Không tìm thấy sản phẩm phù hợp. Thử mô tả khác.');
      }
    } catch {
      showError('Không thể tạo gợi ý quà tặng');
    } finally {
      setIsLoading(false);
    }
  };

  const appendIdea = (idea: string) => {
    const clean = idea.replace(/^[\p{Emoji}\s]+/u, '').trim();
    setAiPrompt((prev) => {
      if (prev.endsWith(clean)) return prev;
      return prev ? `${prev}, ${clean.toLowerCase()}` : clean;
    });
  };

  const handleSaveGift = async (giftName: string) => {
    try {
      await createGiftItem(db, eventId, giftName);
      await loadGiftHistory();
      showSuccess(`Đã lưu "${giftName}"`);
      setActiveTab('history');
    } catch { showError('Không thể lưu quà tặng'); }
  };

  const handleTogglePurchase = async (id: string) => {
    try {
      await markGiftAsPurchased(db, id);
      await loadGiftHistory();
    } catch { showError('Không thể cập nhật'); }
  };

  const handleDeleteGift = async (id: string) => {
    try {
      await deleteGiftItem(db, id);
      await loadGiftHistory();
      showSuccess('Đã xóa');
    } catch { showError('Không thể xóa'); }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Gợi ý quà tặng</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{event.title}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['suggestions', 'history'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'suggestions' ? 'sparkles-outline' : 'bookmark-outline'}
              size={17}
              color={activeTab === tab ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'suggestions' ? 'Gợi ý AI' : `Đã lưu (${giftHistory.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {activeTab === 'suggestions' ? (
          <>
            {/* ── AI Search Card ─────────────────────────────────────── */}
            <View style={styles.aiCard}>
              {/* Title row */}
              <View style={styles.aiCardTitle}>
                <Text style={styles.aiSparkle}>✨</Text>
                <Text style={styles.aiCardLabel}>Mô tả nhu cầu của bạn</Text>
              </View>

              {/* Text input */}
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.aiInput}
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  multiline
                  numberOfLines={2}
                  placeholder="VD: sinh nhật bạn gái thích yoga, cà phê..."
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

              {/* Budget label + chips */}
              <Text style={styles.budgetLabel}>Ngân sách</Text>
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
                style={[styles.generateBtn, isLoading && styles.generateBtnDisabled]}
                onPress={handleGenerateSuggestions}
                disabled={isLoading || !aiPrompt.trim()}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={19} color={COLORS.white} />
                <Text style={styles.generateBtnText}>
                  {isLoading ? 'Đang tìm quà...' : 'Tìm quà với AI'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── AI Reasoning banner ────────────────────────────────── */}
            {(reasoning || (!isLoading && suggestions.length > 0 && !isAI)) && (
              <View style={[styles.reasoningBanner, !isAI && styles.reasoningBannerFallback]}>
                <Text style={styles.reasoningIcon}>{isAI ? '🤖' : 'ℹ️'}</Text>
                <Text style={[styles.reasoningText, !isAI && styles.reasoningTextFallback]}>
                  {isAI
                    ? (reasoning || 'Gợi ý được tạo bởi AI dựa trên mô tả của bạn')
                    : 'Hiển thị từ danh mục (không có kết nối AI)'}
                </Text>
                {isAI && (
                  <TouchableOpacity onPress={() => { setSuggestions([]); setReasoning(''); }}>
                    <Text style={styles.reasoningDismiss}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ── Loading skeletons ──────────────────────────────────── */}
            {isLoading && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}

            {/* ── Results ───────────────────────────────────────────── */}
            {!isLoading && suggestions.length > 0 && (
              <>
                <Text style={styles.resultCount}>{suggestions.length} gợi ý</Text>
                {suggestions.map((product) => (
                  <GiftSuggestionCard
                    key={product.id}
                    product={product}
                    onSave={handleSaveGift}
                    showSaveButton
                  />
                ))}
              </>
            )}

            {/* ── Empty state ────────────────────────────────────────── */}
            {!isLoading && suggestions.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎁</Text>
                <Text style={styles.emptyTitle}>Chưa có gợi ý nào</Text>
                <Text style={styles.emptyText}>
                  Mô tả dịp tặng quà và nhấn{' '}
                  <Text style={{ fontWeight: '700', color: COLORS.primary }}>"Tìm quà với AI"</Text>
                </Text>
              </View>
            )}
          </>
        ) : (
          /* ── History tab ──────────────────────────────────────────── */
          <>
            {giftHistory.length > 0 ? (
              giftHistory.map((item) => (
                <GiftHistoryItem
                  key={item.id}
                  item={item}
                  onTogglePurchase={handleTogglePurchase}
                  onDelete={handleDeleteGift}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>Danh sách trống</Text>
                <Text style={styles.emptyText}>
                  Nhấn "Lưu lại" trên gợi ý để theo dõi quà đã chọn
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },

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

  // Tabs
  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 13,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive:     { borderBottomColor: COLORS.primary },
  tabText:       { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },

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
    borderColor: `${COLORS.primary}25`,
    // subtle tinted background
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  aiCardTitle: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: 12,
  },
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
  clearBtn: {
    alignSelf: 'flex-end',
    padding: 2,
    marginTop: 2,
  },

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
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 10,
  },
  budgetRow: { gap: 8, paddingBottom: 2, marginBottom: 16 },
  budgetChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
  },
  budgetChipActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  budgetChipText:       { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  budgetChipTextActive: { color: COLORS.white, fontWeight: '600' },

  // Generate button
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14, borderRadius: 14,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText:     { fontSize: 15, fontWeight: '700', color: COLORS.white },

  // Reasoning banner
  reasoningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12, padding: 12, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  reasoningBannerFallback: {
    backgroundColor: `${COLORS.textSecondary}08`,
    borderLeftColor: COLORS.textSecondary,
  },
  reasoningIcon:    { fontSize: 15, marginTop: 1 },
  reasoningText:    { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textPrimary, fontStyle: 'italic' },
  reasoningTextFallback: { color: COLORS.textSecondary },
  reasoningDismiss: { fontSize: 14, color: COLORS.textSecondary, padding: 2 },

  // Result count
  resultCount: {
    fontSize: 13, color: COLORS.textSecondary,
    fontWeight: '500', marginBottom: 10,
    paddingHorizontal: 2,
  },

  // Skeleton
  skeletonCard: {
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 16, marginBottom: 14,
    elevation: 1, shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
  },
  skeletonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  skeletonCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.borderLight },
  skeletonLines:  { flex: 1 },
  skeletonLine:   { height: 12, backgroundColor: COLORS.borderLight, borderRadius: 6 },
  skeletonBadge:  { width: 50, height: 22, borderRadius: 11, backgroundColor: COLORS.borderLight },

  // Empty state
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56 },
  emptyIcon:  { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText:  { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 28, lineHeight: 21 },
});

export default GiftSuggestionsScreen;
