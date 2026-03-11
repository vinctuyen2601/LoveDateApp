import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@themes/colors';
import { AffiliateProduct, Article, Event } from '../types';
import { apiService } from '../services/api.service';
import { useToast } from '../contexts/ToastContext';
import { useAiRateLimit } from '../hooks/useAiRateLimit';
import AiRateLimitModal from '@components/molecules/AiRateLimitModal';

type ActivitySuggestionsRouteProp = RouteProp<
  { ActivitySuggestions: { event?: Event } },
  'ActivitySuggestions'
>;

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimelineStep {
  time: string;
  action: string;
}

interface PreparationData {
  outfitTips: string[];
  checklist: string[];
  bookingNote: string | null;
  timingTip: string | null;
  generalTips: string[];
}

interface DateSuggestion {
  id: number;
  title: string;
  emoji: string;
  description: string;
  whyFit: string;
  timeline: TimelineStep[];
  estimatedBudget: string;
  articleKeywords: string[];
  affiliateCategories: string[];
  affiliateOccasion?: string;
  activityType: string;
  preparation: PreparationData | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const QUICK_IDEAS = [
  '🍽️ Ăn tối lãng mạn',
  '☕ Cà phê hẹn hò',
  '🎬 Xem phim cùng nhau',
  '💆 Spa thư giãn',
  '🌳 Dạo phố ngắm cảnh',
  '🏕️ Picnic dã ngoại',
  '🎮 Vui chơi giải trí',
  '🏃 Hoạt động thể thao',
  '🛍️ Đi mua sắm',
  '✈️ Du lịch ngắn ngày',
];

const BUDGET_PRESETS = [
  { label: 'Dưới 200k', max: 200_000 },
  { label: '200k–500k', max: 500_000 },
  { label: '500k–1 triệu', max: 1_000_000 },
  { label: '1–3 triệu', max: 3_000_000 },
  { label: 'Trên 3 triệu', max: 10_000_000 },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonSuggestion: React.FC = () => {
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
      <View style={styles.skeletonHeaderRow}>
        <View style={styles.skeletonEmoji} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[styles.skeletonLine, { width: '65%', height: 14 }]} />
          <View style={[styles.skeletonLine, { width: '40%' }]} />
        </View>
      </View>
      <View style={[styles.skeletonLine, { width: '100%', marginTop: 10 }]} />
      <View style={[styles.skeletonLine, { width: '80%', marginTop: 6 }]} />
    </Animated.View>
  );
};

// ── Article mini card ──────────────────────────────────────────────────────────

const ArticleMiniCard: React.FC<{ article: Article; onPress: () => void }> = ({ article, onPress }) => (
  <TouchableOpacity style={styles.articleCard} onPress={onPress} activeOpacity={0.8}>
    {article.imageUrl ? (
      <Image source={{ uri: article.imageUrl }} style={styles.articleImage} />
    ) : (
      <View style={[styles.articleImage, { backgroundColor: article.color || '#FF6B6B', alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 22 }}>{article.icon || '📖'}</Text>
      </View>
    )}
    <View style={styles.articleInfo}>
      <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
      {article.readTime && (
        <Text style={styles.articleMeta}>{article.readTime} phút đọc</Text>
      )}
    </View>
    <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
  </TouchableOpacity>
);

// ── Product mini card ──────────────────────────────────────────────────────────

const ProductMiniCard: React.FC<{ product: AffiliateProduct }> = ({ product }) => {
  const openLink = () => {
    if (product.affiliateUrl) Linking.openURL(product.affiliateUrl);
  };

  return (
    <TouchableOpacity style={styles.productCard} onPress={openLink} activeOpacity={0.8}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, { backgroundColor: product.color || COLORS.border, alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="bag-handle-outline" size={20} color={COLORS.textSecondary} />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        {product.price && (
          <Text style={styles.productPrice}>
            {product.price >= 1_000_000
              ? `${(product.price / 1_000_000).toFixed(1)}M`
              : `${Math.round(product.price / 1_000)}k`}
          </Text>
        )}
      </View>
      <View style={styles.productBtn}>
        <Text style={styles.productBtnText}>Xem</Text>
      </View>
    </TouchableOpacity>
  );
};

// ── Preparation Section ────────────────────────────────────────────────────────

const PreparationSection: React.FC<{ preparation: PreparationData }> = ({ preparation }) => {
  const hasOutfit   = preparation.outfitTips.length > 0;
  const hasChecklist = preparation.checklist.length > 0;
  const hasOther    = preparation.generalTips.length > 0;
  const hasAny      = hasOutfit || hasChecklist || preparation.bookingNote || preparation.timingTip || hasOther;

  if (!hasAny) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionIcon}>📋</Text>
        <Text style={styles.sectionLabel}>Chuẩn bị</Text>
      </View>

      {hasOutfit && (
        <View style={styles.prepGroup}>
          <Text style={styles.prepGroupLabel}>👗 Trang phục</Text>
          {preparation.outfitTips.map((tip, i) => (
            <View key={i} style={styles.prepRow}>
              <View style={styles.prepDot} />
              <Text style={styles.prepText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {hasChecklist && (
        <View style={styles.prepGroup}>
          <Text style={styles.prepGroupLabel}>✅ Danh sách cần mang</Text>
          {preparation.checklist.map((item, i) => (
            <View key={i} style={styles.prepRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.secondary} style={{ marginTop: 1 }} />
              <Text style={styles.prepText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {preparation.bookingNote && (
        <View style={styles.prepInfoRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} style={styles.prepInfoIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.prepGroupLabel}>Lưu ý đặt chỗ</Text>
            <Text style={styles.prepText}>{preparation.bookingNote}</Text>
          </View>
        </View>
      )}

      {preparation.timingTip && (
        <View style={styles.prepInfoRow}>
          <Text style={styles.prepInfoIcon}>⏰</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.prepGroupLabel}>Thời điểm tốt nhất</Text>
            <Text style={styles.prepText}>{preparation.timingTip}</Text>
          </View>
        </View>
      )}

      {hasOther && (
        <View style={styles.prepGroup}>
          <Text style={styles.prepGroupLabel}>💡 Mẹo hay</Text>
          {preparation.generalTips.map((tip, i) => (
            <View key={i} style={styles.prepRow}>
              <View style={styles.prepDot} />
              <Text style={styles.prepText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ── Date Suggestion Card (expandable) ─────────────────────────────────────────

const DateSuggestionCard: React.FC<{
  suggestion: DateSuggestion;
  budgetMax: number;
  onNavigateArticle: (article: Article) => void;
}> = ({ suggestion, budgetMax, onNavigateArticle }) => {
  const [expanded, setExpanded]       = useState(false);
  const [articles,  setArticles]      = useState<Article[]>([]);
  const [products,  setProducts]      = useState<AffiliateProduct[]>([]);
  const [loadingInner, setLoadingInner] = useState(false);
  const [loaded,    setLoaded]        = useState(false);

  const animHeight = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  const toggleExpand = async () => {
    if (!expanded && !loaded) {
      setLoadingInner(true);
      setExpanded(true);
      Animated.parallel([
        Animated.timing(animOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      try {
        const [articlesRes, productsRes] = await Promise.allSettled([
          fetchArticles(),
          fetchProducts(),
        ]);
        if (articlesRes.status === 'fulfilled') setArticles(articlesRes.value);
        if (productsRes.status === 'fulfilled') setProducts(productsRes.value);
      } finally {
        setLoadingInner(false);
        setLoaded(true);
      }
    } else {
      const next = !expanded;
      setExpanded(next);
      Animated.timing(animOpacity, {
        toValue: next ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  };

  const fetchArticles = async (): Promise<Article[]> => {
    if (suggestion.articleKeywords.length === 0) return [];
    const tags = suggestion.articleKeywords.join(',');
    const data = await apiService.get('/articles', {
      params: { tags, category: 'experiences,dates', limit: '3', sortBy: 'views' },
    });
    const list = data?.data ?? data ?? [];
    return Array.isArray(list) ? list : [];
  };

  const fetchProducts = async (): Promise<AffiliateProduct[]> => {
    if (suggestion.affiliateCategories.length === 0) return [];
    const params: Record<string, any> = {
      limit: 3,
      sortBy: 'rating',
      sortOrder: 'DESC',
      maxPrice: budgetMax * 2, // slightly above budget
    };
    if (suggestion.affiliateCategories.length === 1) {
      params.category = suggestion.affiliateCategories[0];
    }
    if (suggestion.affiliateOccasion) {
      params.occasion = suggestion.affiliateOccasion;
    }
    const data = await apiService.get('/products/search', { params });
    const list = data?.data ?? data ?? [];
    return Array.isArray(list) ? list : [];
  };

  return (
    <View style={styles.suggestionCard}>
      {/* ── Header (always visible) ── */}
      <TouchableOpacity
        style={styles.suggestionHeader}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.suggestionEmojiWrap}>
          <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
        </View>
        <View style={styles.suggestionHeaderText}>
          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
          <Text style={styles.suggestionWhyFit} numberOfLines={2}>
            {suggestion.whyFit}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>

      {/* ── Description chip ── */}
      <View style={styles.descriptionRow}>
        <Text style={styles.descriptionText} numberOfLines={expanded ? undefined : 2}>
          {suggestion.description}
        </Text>
        {suggestion.estimatedBudget ? (
          <View style={styles.budgetBadge}>
            <Ionicons name="wallet-outline" size={11} color={COLORS.secondary} />
            <Text style={styles.budgetBadgeText}>{suggestion.estimatedBudget}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Expanded content ── */}
      {expanded && (
        <Animated.View style={{ opacity: animOpacity }}>
          <View style={styles.divider} />

          {/* Timeline */}
          {suggestion.timeline.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionIcon}>📍</Text>
                <Text style={styles.sectionLabel}>Kế hoạch tham khảo</Text>
              </View>
              {suggestion.timeline.map((step, idx) => (
                <View key={idx} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <Text style={styles.timelineTime}>{step.time}</Text>
                    {idx < suggestion.timeline.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>
                  <Text style={styles.timelineAction}>{step.action}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Preparation */}
          {suggestion.preparation && (
            <PreparationSection preparation={suggestion.preparation} />
          )}

          {/* Loading inner */}
          {loadingInner && (
            <View style={styles.innerLoading}>
              <Ionicons name="sync-outline" size={16} color={COLORS.textLight} />
              <Text style={styles.innerLoadingText}>Đang tải bài viết & gợi ý...</Text>
            </View>
          )}

          {/* Articles */}
          {!loadingInner && articles.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionIcon}>📖</Text>
                <Text style={styles.sectionLabel}>Kinh nghiệm & trải nghiệm</Text>
              </View>
              {articles.map((article) => (
                <ArticleMiniCard
                  key={article.id}
                  article={article}
                  onPress={() => onNavigateArticle(article)}
                />
              ))}
            </View>
          )}

          {/* Products */}
          {!loadingInner && products.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <Ionicons name="bag-handle-outline" size={16} color={COLORS.textSecondary} style={styles.sectionIcon} />
                <Text style={styles.sectionLabel}>Có thể bạn cần</Text>
              </View>
              {products.map((product) => (
                <ProductMiniCard key={product.id} product={product} />
              ))}
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

const ActivitySuggestionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<ActivitySuggestionsRouteProp>();
  const insets     = useSafeAreaInsets();
  const { showError } = useToast();
  const { handleAiError, rateLimitModal } = useAiRateLimit();

  const event = route.params?.event;

  const defaultPrompt = event
    ? `hẹn hò lãng mạn dịp ${event.title}`
    : 'hẹn hò lãng mạn';

  const [aiPrompt,    setAiPrompt]    = useState(defaultPrompt);
  const [budgetIdx,   setBudgetIdx]   = useState(1);
  const [isLoading,   setIsLoading]   = useState(false);
  const [suggestions, setSuggestions] = useState<DateSuggestion[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const appendIdea = (idea: string) => {
    const clean = idea.replace(/^[\p{Emoji}\s]+/u, '').trim();
    setAiPrompt((prev) => {
      if (prev.endsWith(clean)) return prev;
      return prev ? `${prev}, ${clean.toLowerCase()}` : clean;
    });
  };

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setSuggestions([]);

      const data = await apiService.post('/activities/date-plan', {
        prompt: aiPrompt.trim() || defaultPrompt,
        budgetMax: BUDGET_PRESETS[budgetIdx].max,
        occasion: event?.tags?.[0],
      });

      const list: DateSuggestion[] = data?.suggestions ?? [];
      if (list.length === 0) {
        showError('Không tạo được gợi ý. Thử lại nhé!');
        return;
      }
      setSuggestions(list);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 340, animated: true }), 300);
    } catch (err) {
      handleAiError(err, 'Không thể kết nối AI. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={[COLORS.secondary, '#43C59E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Lên kế hoạch hẹn hò</Text>
          {event && (
            <Text style={styles.headerSub} numberOfLines={1}>{event.title}</Text>
          )}
        </View>
        <View style={{ width: 38 }} />
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Input Card ───────────────────────────────────────────────────── */}
        <View style={styles.inputCard}>
          <View style={styles.inputCardTitle}>
            <Ionicons name="map-outline" size={18} color={COLORS.primary} />
            <Text style={styles.inputCardLabel}>Bạn muốn làm gì?</Text>
          </View>

          {/* Free text input */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.aiInput}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
              numberOfLines={2}
              placeholder="VD: ăn tối lãng mạn, dạo phố ngắm cảnh..."
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

          {/* Quick idea chips — horizontal scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ideasRow}
          >
            {QUICK_IDEAS.map((idea) => (
              <TouchableOpacity
                key={idea}
                style={styles.ideaChip}
                onPress={() => appendIdea(idea)}
              >
                <Text style={styles.ideaChipText}>{idea}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.divider} />

          {/* Budget */}
          <Text style={styles.budgetLabel}>Ngân sách / người</Text>
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

        {/* ── Generate Button ───────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={isLoading}
          activeOpacity={0.88}
          style={styles.generateBtnWrap}
        >
          <LinearGradient
            colors={isLoading ? ['#C8C8C8', '#B0B0B0'] : [COLORS.secondary, '#43C59E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateBtn}
          >
            {isLoading ? (
              <Text style={styles.generateBtnText}>AI đang lên kế hoạch...</Text>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color={COLORS.white} />
                <Text style={styles.generateBtnText}>Gợi ý kế hoạch hẹn hò</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Loading skeletons ─────────────────────────────────────────────── */}
        {isLoading && (
          <>
            <SkeletonSuggestion />
            <SkeletonSuggestion />
            <SkeletonSuggestion />
          </>
        )}

        {/* ── Results ──────────────────────────────────────────────────────── */}
        {!isLoading && suggestions.length > 0 && (
          <>
            <View style={styles.resultsHeader}>
              <Ionicons name="sparkles" size={15} color={COLORS.secondary} />
              <Text style={styles.resultsHeaderText}>
                {suggestions.length} gợi ý kế hoạch — nhấn để xem chi tiết
              </Text>
            </View>
            {suggestions.map((s) => (
              <DateSuggestionCard
                key={s.id}
                suggestion={s}
                budgetMax={BUDGET_PRESETS[budgetIdx].max}
                onNavigateArticle={(article) =>
                  navigation.navigate('ArticleDetail', { article })
                }
              />
            ))}
          </>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!isLoading && suggestions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color={COLORS.border} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Lên kế hoạch cùng AI</Text>
            <Text style={styles.emptyText}>
              Chọn loại hoạt động, ngân sách{'\n'}rồi nhấn{' '}
              <Text style={{ fontWeight: '700', color: COLORS.secondary }}>
                "Gợi ý kế hoạch hẹn hò"
              </Text>
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      <AiRateLimitModal {...rateLimitModal} />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 18,
  },
  backButton:   { padding: 6, marginRight: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: COLORS.white },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { padding: 16 },

  // Input Card
  inputCard: {
    backgroundColor: COLORS.white, borderRadius: 20,
    padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: `${COLORS.secondary}20`,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  inputCardTitle: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  inputCardLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },

  // Free text input
  inputWrap: {
    backgroundColor: COLORS.background, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, marginBottom: 12,
  },
  aiInput: {
    fontSize: 14, color: COLORS.textPrimary, minHeight: 52, lineHeight: 20,
  },
  clearBtn: { alignSelf: 'flex-end', padding: 2, marginTop: 2 },

  // Ideas chips — horizontal scroll
  ideasRow: { gap: 8, paddingBottom: 4, marginBottom: 14 },
  ideaChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  ideaChipText: { fontSize: 12, color: COLORS.textSecondary },

  // Divider
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 14 },

  // Budget
  budgetLabel: {
    fontSize: 12, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
  },
  budgetRow: { gap: 8, paddingBottom: 2 },
  budgetChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: COLORS.background,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  budgetChipActive:     { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  budgetChipText:       { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  budgetChipTextActive: { color: COLORS.white, fontWeight: '600' },

  // Generate button
  generateBtnWrap: { marginBottom: 14, borderRadius: 16, overflow: 'hidden' },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17,
  },
  generateBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.white },

  // Results header
  resultsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 12, paddingHorizontal: 2,
  },
  resultsHeaderText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', flex: 1 },

  // Suggestion card
  suggestionCard: {
    backgroundColor: COLORS.white, borderRadius: 18,
    marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  suggestionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, paddingBottom: 8,
  },
  suggestionEmojiWrap: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: `${COLORS.secondary}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionEmoji:      { fontSize: 22 },
  suggestionHeaderText: { flex: 1 },
  suggestionTitle:      { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
  suggestionWhyFit:     { fontSize: 12, color: COLORS.secondary, fontWeight: '500' },

  // Description
  descriptionRow: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  descriptionText: { fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  budgetBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: `${COLORS.secondary}10`, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  budgetBadgeText: { fontSize: 11, color: COLORS.secondary, fontWeight: '600' },

  // Section inside expanded
  section:      { paddingHorizontal: 16, paddingBottom: 12 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionIcon:  { fontSize: 14 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  // Timeline
  timelineRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  timelineLeft: { alignItems: 'center', width: 46 },
  timelineTime: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, textAlign: 'center' },
  timelineLine: { width: 1.5, flex: 1, backgroundColor: `${COLORS.secondary}30`, marginTop: 3, minHeight: 18 },
  timelineAction: {
    flex: 1, fontSize: 13, lineHeight: 18, color: COLORS.textPrimary,
    paddingBottom: 16,
  },

  // Preparation
  prepGroup: { marginBottom: 12 },
  prepGroupLabel: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4,
  },
  prepRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 5,
  },
  prepDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: COLORS.secondary, marginTop: 6,
  },
  prepText: { flex: 1, fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },
  prepInfoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: `${COLORS.secondary}08`, borderRadius: 10,
    padding: 10, marginBottom: 10,
  },
  prepInfoIcon: { fontSize: 16, marginTop: 1 },

  // Inner loading
  innerLoading: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  innerLoadingText: { fontSize: 12, color: COLORS.textLight },

  // Article mini card
  articleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.background, borderRadius: 12,
    padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  articleImage: { width: 60, height: 50, borderRadius: 8 },
  articleInfo:  { flex: 1 },
  articleTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 18 },
  articleMeta:  { fontSize: 11, color: COLORS.textLight, marginTop: 3 },

  // Product mini card
  productCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.background, borderRadius: 12,
    padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  productImage: { width: 54, height: 54, borderRadius: 8 },
  productInfo:  { flex: 1 },
  productName:  { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 18 },
  productPrice: { fontSize: 12, color: COLORS.secondary, fontWeight: '700', marginTop: 3 },
  productBtn: {
    backgroundColor: COLORS.secondary, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  productBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.white },

  // Skeleton
  skeletonCard: {
    backgroundColor: COLORS.white, borderRadius: 18,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  skeletonHeaderRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  skeletonEmoji: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.borderLight },
  skeletonLine:  { height: 12, backgroundColor: COLORS.borderLight, borderRadius: 6 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 56 },
  emptyIcon:  { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText:  { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 28, lineHeight: 22 },
});

export default ActivitySuggestionsScreen;
