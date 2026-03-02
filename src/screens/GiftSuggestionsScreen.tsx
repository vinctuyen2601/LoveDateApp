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
import { LinearGradient } from 'expo-linear-gradient';
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

// ── Constants ─────────────────────────────────────────────────────────────────

const TAG_LABEL: Record<string, string> = {
  birthday: 'sinh nhật', anniversary: 'kỷ niệm', valentine: 'Valentine',
  women_day_8_3: '8/3', women_day_20_10: '20/10', christmas: 'Giáng sinh',
  holiday: 'ngày lễ', other: 'dịp đặc biệt',
};

const TAG_ICON: Record<string, string> = {
  birthday: '🎂', anniversary: '💑', valentine: '💝',
  women_day_8_3: '🌹', women_day_20_10: '🌺', christmas: '🎄',
  holiday: '🎉', other: '✨',
};

const BUDGET_PRESETS = [
  { label: 'Dưới 200k',   min: 0,         max: 200_000 },
  { label: '200k–500k',   min: 200_000,   max: 500_000 },
  { label: '500k–1tr',    min: 500_000,   max: 1_000_000 },
  { label: '1–3 triệu',   min: 1_000_000, max: 3_000_000 },
  { label: 'Trên 3tr',    min: 3_000_000, max: 20_000_000 },
];

const RECIPIENTS = [
  { key: 'girlfriend', label: 'Bạn gái',    icon: '👩' },
  { key: 'boyfriend',  label: 'Bạn trai',   icon: '👦' },
  { key: 'wife',       label: 'Vợ',         icon: '👰' },
  { key: 'husband',    label: 'Chồng',      icon: '🤵' },
  { key: 'mom',        label: 'Mẹ',         icon: '🤱' },
  { key: 'dad',        label: 'Bố',         icon: '👨' },
  { key: 'friend',     label: 'Bạn bè',     icon: '🤝' },
  { key: 'colleague',  label: 'Đồng nghiệp', icon: '💼' },
];

const INTEREST_TAGS = [
  { key: 'coffee',   label: 'Cà phê',     icon: '☕' },
  { key: 'yoga',     label: 'Yoga',        icon: '🧘' },
  { key: 'books',    label: 'Đọc sách',   icon: '📚' },
  { key: 'travel',   label: 'Du lịch',    icon: '✈️' },
  { key: 'cooking',  label: 'Nấu ăn',     icon: '🍳' },
  { key: 'sports',   label: 'Thể thao',   icon: '⚽' },
  { key: 'music',    label: 'Âm nhạc',    icon: '🎵' },
  { key: 'gaming',   label: 'Game',        icon: '🎮' },
  { key: 'fashion',  label: 'Thời trang', icon: '👗' },
  { key: 'beauty',   label: 'Làm đẹp',   icon: '💄' },
  { key: 'tech',     label: 'Công nghệ',  icon: '💻' },
  { key: 'art',      label: 'Nghệ thuật', icon: '🎨' },
  { key: 'wellness', label: 'Sức khỏe',  icon: '💪' },
  { key: 'flowers',  label: 'Hoa & cây', icon: '🌸' },
];

// ── AI Thinking dots animation ─────────────────────────────────────────────────

const AIThinkingDots: React.FC = () => {
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1,   duration: 380, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 380, useNativeDriver: true }),
        ])
      ).start();
    };
    pulse(d1, 0);
    pulse(d2, 160);
    pulse(d3, 320);
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
      {[d1, d2, d3].map((dot, i) => (
        <Animated.View
          key={i}
          style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.white, opacity: dot }}
        />
      ))}
    </View>
  );
};

// ── Skeleton card ──────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: anim }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { width: '65%', height: 14 }]} />
        <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
        <View style={[styles.skeletonLine, { width: '100%', height: 38, borderRadius: 12, marginTop: 12 }]} />
      </View>
    </Animated.View>
  );
};

// ── Main screen ────────────────────────────────────────────────────────────────

const GiftSuggestionsScreen: React.FC = () => {
  const route    = useRoute<GiftSuggestionsScreenRouteProp>();
  const navigation = useNavigation();
  const db       = useSQLiteContext();
  const insets   = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();

  const { eventId, event } = route.params;
  const defaultOccasion = TAG_LABEL[event.tags?.[0]] || 'dịp đặc biệt';
  const occasionIcon    = TAG_ICON[event.tags?.[0]] || '✨';

  // ── State ───────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading]     = useState(false);
  const [suggestions, setSuggestions] = useState<AffiliateProduct[]>([]);
  const [isAI, setIsAI]               = useState(false);
  const [reasoning, setReasoning]     = useState('');
  const [giftHistory, setGiftHistory] = useState<GiftHistoryItemType[]>([]);
  const [activeTab, setActiveTab]     = useState<'suggestions' | 'history'>('suggestions');

  // AI form state
  const [selectedRecipient,  setSelectedRecipient]  = useState('');
  const [selectedInterests,  setSelectedInterests]  = useState<string[]>([]);
  const [budgetIdx,          setBudgetIdx]           = useState(1);
  const [customNote,         setCustomNote]          = useState('');
  const [showCustomNote,     setShowCustomNote]      = useState(false);

  useEffect(() => { loadGiftHistory(); }, []);

  const loadGiftHistory = async () => {
    try {
      const history = await getGiftHistory(db, eventId);
      setGiftHistory(history);
    } catch {}
  };

  const toggleInterest = (key: string) => {
    setSelectedInterests(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // ── Build rich AI prompt ────────────────────────────────────────────────────
  const buildPrompt = (): string => {
    const parts: string[] = [];

    const recipientObj = RECIPIENTS.find(r => r.key === selectedRecipient);
    if (recipientObj) {
      parts.push(`Tặng quà ${defaultOccasion} cho ${recipientObj.label}`);
    } else {
      parts.push(`Tặng quà ${defaultOccasion}: ${event.title}`);
    }

    if (selectedInterests.length > 0) {
      const labels = selectedInterests
        .map(k => INTEREST_TAGS.find(t => t.key === k)?.label)
        .filter(Boolean)
        .join(', ');
      parts.push(`người nhận thích ${labels}`);
    }

    const budget = BUDGET_PRESETS[budgetIdx];
    parts.push(`ngân sách ${budget.label}`);

    if (customNote.trim()) {
      parts.push(customNote.trim());
    }

    return parts.join(', ');
  };

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerateSuggestions = async () => {
    try {
      setIsLoading(true);
      setReasoning('');
      setSuggestions([]);

      const result = await generateGiftSuggestionsWithFallback(db, {
        event,
        budget: {
          min: BUDGET_PRESETS[budgetIdx].min,
          max: BUDGET_PRESETS[budgetIdx].max,
        },
        preferences: buildPrompt(),
      });

      setSuggestions(result.suggestions);
      setIsAI(result.isAI);
      setReasoning(result.reasoning || '');

      if (!result.isAI) {
        showError('Không kết nối được AI. Hiển thị từ danh mục.');
      } else if (result.suggestions.length === 0) {
        showError('Không tìm thấy sản phẩm phù hợp. Thử thay đổi lựa chọn.');
      }
    } catch {
      showError('Không thể tạo gợi ý quà tặng');
    } finally {
      setIsLoading(false);
    }
  };

  // ── History actions ─────────────────────────────────────────────────────────
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

  const hasSelections = !!selectedRecipient || selectedInterests.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Gradient Header ─────────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerOccasion}>{occasionIcon}  {defaultOccasion.toUpperCase()}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
          <View style={styles.headerBadge}>
            <Ionicons name="sparkles" size={11} color="#FF6B6B" />
            <Text style={styles.headerBadgeText}>Gợi ý bởi AI</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </LinearGradient>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
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
              {tab === 'suggestions' ? 'Tìm quà AI' : `Đã lưu (${giftHistory.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'suggestions' ? (
          <>
            {/* ── AI Assistant Card ──────────────────────────────────────────── */}
            <View style={styles.assistantCard}>

              {/* Assistant header */}
              <View style={styles.assistantHeader}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.assistantAvatar}
                >
                  <Text style={{ fontSize: 20 }}>✨</Text>
                </LinearGradient>
                <View style={styles.assistantHeaderText}>
                  <Text style={styles.assistantName}>Trợ lý quà tặng AI</Text>
                  <Text style={styles.assistantOnline}>● Đang hoạt động</Text>
                </View>
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              </View>

              {/* Chat bubble from AI */}
              <View style={styles.chatBubble}>
                <Text style={styles.chatBubbleText}>
                  Xin chào! Mình sẽ giúp bạn tìm món quà{' '}
                  <Text style={{ fontWeight: '700' }}>{defaultOccasion}</Text>{' '}
                  hoàn hảo nhất 🎁{'\n'}
                  Hãy cho mình biết thêm để gợi ý chính xác hơn nhé!
                </Text>
              </View>

              {/* ── Bước 1: Tặng cho ai ─────────────────────────────────────── */}
              <View style={styles.stepSection}>
                <View style={styles.stepLabelRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>1</Text>
                  </View>
                  <Text style={styles.stepLabel}>Tặng quà cho ai?</Text>
                  {selectedRecipient && (
                    <View style={styles.stepDoneBadge}>
                      <Ionicons name="checkmark" size={11} color={COLORS.white} />
                    </View>
                  )}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recipientRow}
                >
                  {RECIPIENTS.map((r) => {
                    const active = selectedRecipient === r.key;
                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[styles.recipientChip, active && styles.recipientChipActive]}
                        onPress={() => setSelectedRecipient(active ? '' : r.key)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.recipientIcon}>{r.icon}</Text>
                        <Text style={[styles.recipientLabel, active && styles.recipientLabelActive]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* ── Bước 2: Sở thích ──────────────────────────────────────────── */}
              <View style={styles.stepSection}>
                <View style={styles.stepLabelRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>2</Text>
                  </View>
                  <Text style={styles.stepLabel}>Họ thích gì?</Text>
                  {selectedInterests.length > 0 && (
                    <View style={styles.stepCountBadge}>
                      <Text style={styles.stepCountText}>{selectedInterests.length}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.interestGrid}>
                  {INTEREST_TAGS.map((tag) => {
                    const active = selectedInterests.includes(tag.key);
                    return (
                      <TouchableOpacity
                        key={tag.key}
                        style={[styles.interestChip, active && styles.interestChipActive]}
                        onPress={() => toggleInterest(tag.key)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.interestIcon}>{tag.icon}</Text>
                        <Text style={[styles.interestLabel, active && styles.interestLabelActive]}>
                          {tag.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── Bước 3: Ngân sách ────────────────────────────────────────── */}
              <View style={styles.stepSection}>
                <View style={styles.stepLabelRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>3</Text>
                  </View>
                  <Text style={styles.stepLabel}>Ngân sách</Text>
                  <View style={styles.stepDoneBadge}>
                    <Ionicons name="checkmark" size={11} color={COLORS.white} />
                  </View>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.budgetRow}
                >
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
              </View>

              {/* ── Bước 4: Ghi chú thêm (tùy chọn) ──────────────────────── */}
              <TouchableOpacity
                style={styles.addNoteRow}
                onPress={() => setShowCustomNote(!showCustomNote)}
              >
                <Ionicons
                  name={showCustomNote ? 'chevron-up-circle-outline' : 'add-circle-outline'}
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.addNoteText}>
                  {showCustomNote ? 'Thu gọn' : 'Thêm mô tả chi tiết (tùy chọn)'}
                </Text>
              </TouchableOpacity>

              {showCustomNote && (
                <View style={styles.customNoteWrap}>
                  <TextInput
                    style={styles.customNoteInput}
                    value={customNote}
                    onChangeText={setCustomNote}
                    multiline
                    numberOfLines={2}
                    placeholder="VD: Họ mới chuyển nhà, thích màu pastel, có dị ứng mùi hương..."
                    placeholderTextColor={COLORS.textLight}
                    textAlignVertical="top"
                  />
                </View>
              )}
            </View>

            {/* ── Generate Button ───────────────────────────────────────────── */}
            <TouchableOpacity
              onPress={handleGenerateSuggestions}
              disabled={isLoading}
              activeOpacity={0.88}
              style={styles.generateBtnWrap}
            >
              <LinearGradient
                colors={isLoading ? ['#C8C8C8', '#B0B0B0'] : ['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateBtn}
              >
                {isLoading ? (
                  <>
                    <AIThinkingDots />
                    <Text style={styles.generateBtnText}>AI đang tìm quà...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color={COLORS.white} />
                    <Text style={styles.generateBtnText}>
                      {hasSelections ? 'Tìm quà phù hợp' : 'Tìm quà với AI'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* ── AI Loading banner ──────────────────────────────────────────── */}
            {isLoading && (
              <View style={styles.loadingBanner}>
                <Text style={styles.loadingBannerText}>
                  🤖 AI đang phân tích và chọn lọc quà phù hợp nhất...
                </Text>
              </View>
            )}

            {/* ── AI Reasoning banner ───────────────────────────────────────── */}
            {!isLoading && (reasoning || (suggestions.length > 0 && !isAI)) && (
              <View style={[styles.reasoningBanner, !isAI && styles.reasoningBannerFallback]}>
                <View style={styles.reasoningAvatar}>
                  <Text style={{ fontSize: 13 }}>{isAI ? '🤖' : 'ℹ️'}</Text>
                </View>
                <Text style={[styles.reasoningText, !isAI && styles.reasoningTextFallback]}>
                  {isAI
                    ? (reasoning || 'Gợi ý được tạo bởi AI dựa trên thông tin của bạn')
                    : 'Hiển thị từ danh mục (không có kết nối AI)'}
                </Text>
                {isAI && (
                  <TouchableOpacity onPress={() => { setSuggestions([]); setReasoning(''); }}>
                    <Ionicons name="close" size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ── Loading skeletons ─────────────────────────────────────────── */}
            {isLoading && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}

            {/* ── Results ──────────────────────────────────────────────────── */}
            {!isLoading && suggestions.length > 0 && (
              <>
                <View style={styles.resultHeader}>
                  <Ionicons name="sparkles" size={15} color={COLORS.primary} />
                  <Text style={styles.resultCount}>{suggestions.length} gợi ý dành cho bạn</Text>
                </View>
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

            {/* ── Empty state ───────────────────────────────────────────────── */}
            {!isLoading && suggestions.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎁</Text>
                <Text style={styles.emptyTitle}>Chưa có gợi ý nào</Text>
                <Text style={styles.emptyText}>
                  Chọn người nhận & sở thích rồi nhấn{'\n'}
                  <Text style={{ fontWeight: '700', color: COLORS.primary }}>"Tìm quà phù hợp"</Text>
                </Text>
              </View>
            )}
          </>
        ) : (
          /* ── History tab ──────────────────────────────────────────────────── */
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

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Gradient Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  backButton: { padding: 6, marginRight: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerOccasion: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.80)',
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B6B',
  },

  // ── Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 14,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive:     { borderBottomColor: COLORS.primary },
  tabText:       { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },

  // ── Scroll
  scroll:        { flex: 1 },
  scrollContent: { padding: 16 },

  // ── AI Assistant Card
  assistantCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.10)',
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  assistantAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantHeaderText: { flex: 1 },
  assistantName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  assistantOnline: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 2,
    fontWeight: '500',
  },
  aiBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // ── Chat bubble
  chatBubble: {
    backgroundColor: 'rgba(255,107,107,0.07)',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    marginBottom: 18,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255,107,107,0.35)',
  },
  chatBubbleText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textPrimary,
  },

  // ── Step sections
  stepSection: { marginBottom: 18 },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  stepLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stepDoneBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCountBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
  },

  // ── Recipient chips
  recipientRow: { gap: 8, paddingBottom: 4 },
  recipientChip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minWidth: 72,
  },
  recipientChipActive: {
    backgroundColor: 'rgba(255,107,107,0.10)',
    borderColor: COLORS.primary,
  },
  recipientIcon:  { fontSize: 22, marginBottom: 5 },
  recipientLabel: { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary, textAlign: 'center' },
  recipientLabelActive: { color: COLORS.primary, fontWeight: '700' },

  // ── Interest chips (wrappable grid)
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  interestChipActive: {
    backgroundColor: 'rgba(255,107,107,0.10)',
    borderColor: COLORS.primary,
  },
  interestIcon:  { fontSize: 13 },
  interestLabel: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  interestLabelActive: { color: COLORS.primary, fontWeight: '700' },

  // ── Budget
  budgetRow: { gap: 8, paddingBottom: 2 },
  budgetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  budgetChipActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  budgetChipText:       { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  budgetChipTextActive: { color: COLORS.white, fontWeight: '700' },

  // ── Add note toggle
  addNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  addNoteText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  customNoteWrap: {
    marginTop: 8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  customNoteInput: {
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 50,
    lineHeight: 21,
  },

  // ── Generate button
  generateBtnWrap: { marginBottom: 14, borderRadius: 16, overflow: 'hidden' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
  },
  generateBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.white },

  // ── Loading banner
  loadingBanner: {
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  loadingBannerText: {
    fontSize: 13,
    color: COLORS.primary,
    fontStyle: 'italic',
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Reasoning banner
  reasoningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  reasoningBannerFallback: {
    backgroundColor: `${COLORS.textSecondary}08`,
    borderLeftColor: COLORS.textSecondary,
  },
  reasoningAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,107,107,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  reasoningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
  },
  reasoningTextFallback: { color: COLORS.textSecondary },

  // ── Result header
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  resultCount: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },

  // ── Skeleton
  skeletonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  skeletonImage:   { width: '100%', height: 145, backgroundColor: COLORS.borderLight },
  skeletonContent: { padding: 12 },
  skeletonLine:    { height: 12, backgroundColor: COLORS.borderLight, borderRadius: 6 },

  // ── Empty state
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon:  { fontSize: 54, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText:  { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 28, lineHeight: 22 },
});

export default GiftSuggestionsScreen;
