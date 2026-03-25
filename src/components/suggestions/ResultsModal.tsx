import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@themes/colors";
import { AffiliateProduct } from "../../types";
import { EmptyState } from "@components/atoms/EmptyState";
import ProductCard from "./ProductCard";
import { apiService } from "../../services/api.service";
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

// ── BE response types ──────────────────────────────────────────────────────────

interface GiftCategoryResult {
  rank: number;
  categoryKey: string;
  name: string;
  icon: string;
  type: "gift" | "experience";
  score: number;
  priceRange: string;
  specificIdeas: string[];
  shopeeKeyword: string;
  isCompanion: boolean;
  isTrending?: boolean;
}

interface CompanionGift {
  categoryKey: string;
  name: string;
  icon: string;
  subType: string;
  note: string;
  ideas: string[];
}

interface GiftSuggestionsResult {
  categories: GiftCategoryResult[];
  companion: CompanionGift | null;
  meta: {
    occasion: string;
    occasionKey: string;
    gender: string;
    budget: string;
    experienceLevel: string;
  };
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface ResultsModalProps {
  visible: boolean;
  surveyAnswers: Record<string, any>;
  onClose: () => void;
  onRetake: () => void;
  // Legacy props kept for compatibility — not used in new flow
  suggestions?: any[];
  products?: AffiliateProduct[];
}

// ── Styles (declared here so all components below can call useStyles()) ────────

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  closeBtn: { padding: 6 },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: colors.white,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontFamily: 'Manrope_500Medium',
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  aiBadgeText: { fontSize: 11, fontFamily: 'Manrope_800ExtraBold', color: colors.aiPrimary },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  // AI summary card
  aiCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.primary + "1A",
  },
  aiCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  aiAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  aiName: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: colors.textPrimary },
  aiOnline: {
    fontSize: 11,
    color: colors.success,
    fontFamily: 'Manrope_500Medium',
    marginTop: 1,
  },
  aiBubble: {
    backgroundColor: "rgba(255,107,107,0.07)",
    borderRadius: 14,
    borderTopLeftRadius: 4,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "rgba(255,107,107,0.30)",
  },
  aiBubbleText: { fontSize: 14, lineHeight: 21, color: colors.textPrimary },

  // Loading
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
    marginBottom: 12,
  },
  loadingText: { fontSize: 14, color: colors.textSecondary },

  // Companion card
  companionCard: {
    marginBottom: 16,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  companionGradient: { padding: 16 },
  companionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  companionIcon: { fontSize: 30 },
  companionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  companionTitle: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: "#C41E3A",
    flex: 1,
  },
  companionBadge: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  companionBadgeText: { fontSize: 10, color: colors.white, fontFamily: 'Manrope_700Bold'},
  companionNote: {
    fontSize: 12,
    color: "#8B0000",
    lineHeight: 17,
    fontStyle: "italic",
  },
  companionIdea: { fontSize: 13, color: "#5D1A1A", lineHeight: 20 },

  // Section title
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_800ExtraBold',
    color: colors.textPrimary,
    marginBottom: 12,
  },

  // Category card
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 12, fontFamily: 'Manrope_800ExtraBold', color: colors.white },
  categoryIcon: { fontSize: 24 },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: colors.textPrimary },
  categoryPrice: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  ideaText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingLeft: 4,
  },

  // Products section inside card
  productsSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  productsSectionTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  productLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  productLoadingText: { fontSize: 13, color: colors.textSecondary },

  // Trending badges
  hotBadge: {
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hotBadgeText: { fontSize: 10, color: colors.white, fontFamily: 'Manrope_700Bold'},
  trendingBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },
  trendingBadgeText: { fontSize: 10, color: colors.white, fontFamily: 'Manrope_700Bold'},

  // Shopee fallback button
  shopeeBtn: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  shopeeBtnText: { color: colors.white, fontFamily: 'Manrope_700Bold', fontSize: 14 },

  // Actions
  actions: { marginTop: 8, marginBottom: 8 },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: 8,
  },
  retakeBtnText: { color: colors.primary, fontSize: 15, fontFamily: 'Manrope_600SemiBold'},
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildAISummary(answers: Record<string, any>): string {
  const parts: string[] = [];
  const { gender, relationship, occasion } = answers;
  if (occasion) parts.push(`quà ${(occasion as string).toLowerCase()}`);
  if (gender === "Nam" && relationship)
    parts.push(`cho anh ấy (${relationship})`);
  else if (gender === "Nữ" && relationship)
    parts.push(`cho cô ấy (${relationship})`);
  else if (relationship) parts.push(`cho ${relationship}`);
  return parts.join(" ");
}

// ── Animated thinking dots ─────────────────────────────────────────────────────

const AIThinkingDots: React.FC = () => {
  const colors = useColors();
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 380,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    pulse(d1, 0);
    pulse(d2, 160);
    pulse(d3, 320);
  }, []);

  return (
    <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
      {[d1, d2, d3].map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.primary,
            opacity: dot,
          }}
        />
      ))}
    </View>
  );
};

// ── Category product drawer (expanded inline) ─────────────────────────────────

function budgetToMaxPrice(budget: string | undefined): number | undefined {
  if (!budget) return undefined;
  if (budget.includes("Dưới 200k")) return 200000;
  if (budget.includes("200k") && budget.includes("500k")) return 500000;
  if (budget.includes("500k")) return 1000000;
  if (budget.includes("1") && budget.includes("2")) return 2000000;
  if (budget.includes("2") && budget.includes("5")) return 5000000;
  return undefined; // Trên 5 triệu — không giới hạn
}

interface CategoryProductsProps {
  categoryKey: string;
  shopeeKeyword: string;
  maxPrice?: number;
  occasion?: string;
}

type ProductWithTrending = AffiliateProduct & { isTrending?: boolean };

const CategoryProducts: React.FC<CategoryProductsProps> = ({
  categoryKey,
  shopeeKeyword,
  maxPrice,
  occasion,
}) => {
  const styles = useStyles();
  const colors = useColors();
  const [products, setProducts] = useState<ProductWithTrending[]>([]);
  const [hasProducts, setHasProducts] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params: Record<string, any> = { limit: 6 };
        if (maxPrice) params.maxPrice = maxPrice;
        if (occasion) params.occasion = occasion;
        const res = await apiService.getRaw<{
          data: ProductWithTrending[];
          hasProducts: boolean;
        }>(`/products/by-gift-category/${categoryKey}`, { params });
        if (cancelled) return;
        setProducts(res.data ?? []);
        setHasProducts(res.hasProducts ?? false);
      } catch {
        if (!cancelled) {
          setProducts([]);
          setHasProducts(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryKey, occasion]);

  if (loading) {
    return (
      <View style={styles.productLoadingRow}>
        <AIThinkingDots />
        <Text style={styles.productLoadingText}>Đang tìm sản phẩm...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -16 }}
    >
      <View
        style={{
          paddingLeft: 16,
          paddingRight: 4,
          flexDirection: "row",
          gap: 10,
        }}
      >
        {products.map((p) => (
          <View key={p.id} style={{ position: "relative" }}>
            <ProductCard product={p} occasion={occasion} />
            {p.isTrending && (
              <View style={styles.trendingBadge}>
                <Ionicons name="flame" size={11} color={colors.white} />
                <Text style={styles.trendingBadgeText}> Đang hot</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// ── Category card ──────────────────────────────────────────────────────────────

interface CategoryCardProps {
  item: GiftCategoryResult;
  defaultExpanded?: boolean;
  maxPrice?: number;
  occasionKey?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  item,
  defaultExpanded = false,
  maxPrice,
  occasionKey,
}) => {
  const styles = useStyles();
  const colors = useColors();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.categoryCard}>
      {/* Header row */}
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{item.rank}</Text>
        </View>
        <Text style={styles.categoryIcon}>{item.icon}</Text>
        <View style={styles.categoryInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.categoryName}>{item.name}</Text>
            {item.isTrending && (
              <View style={styles.hotBadge}>
                <Ionicons name="flame" size={10} color="#D97706" />
                <Text style={styles.hotBadgeText}> Hot</Text>
              </View>
            )}
          </View>
          <Text style={styles.categoryPrice}>{item.priceRange}</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Specific ideas */}
      {item.specificIdeas.slice(0, 3).map((idea, i) => (
        <Text key={i} style={styles.ideaText}>
          • {idea}
        </Text>
      ))}

      {/* Expanded: show products */}
      {expanded && (
        <View style={styles.productsSection}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Ionicons
              name="bag-handle-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={[styles.productsSectionTitle, { marginBottom: 0 }]}>
              Sản phẩm gợi ý
            </Text>
          </View>
          <CategoryProducts
            categoryKey={item.categoryKey}
            shopeeKeyword={item.shopeeKeyword}
            maxPrice={maxPrice}
            occasion={occasionKey}
          />
        </View>
      )}
    </View>
  );
};

// ── Companion gift card ────────────────────────────────────────────────────────

const CompanionCard: React.FC<{ companion: CompanionGift }> = ({
  companion,
}) => {
  const styles = useStyles();
  return (
  <View style={styles.companionCard}>
    <LinearGradient
      colors={["#FFE0E6", "#FFF0F3"]}
      style={styles.companionGradient}
    >
      <View style={styles.companionHeader}>
        <Text style={styles.companionIcon}>{companion.icon}</Text>
        <View style={{ flex: 1 }}>
          <View style={styles.companionTitleRow}>
            <Text style={styles.companionTitle}>{companion.name}</Text>
            <View style={styles.companionBadge}>
              <Text style={styles.companionBadgeText}>Kèm theo</Text>
            </View>
          </View>
          <Text style={styles.companionNote}>{companion.note}</Text>
        </View>
      </View>
      {companion.ideas.map((idea, i) => (
        <Text key={i} style={styles.companionIdea}>
          • {idea}
        </Text>
      ))}
    </LinearGradient>
  </View>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const ResultsModal: React.FC<ResultsModalProps> = ({
  visible,
  surveyAnswers,
  onClose,
  onRetake,
}) => {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const aiSummary = buildAISummary(surveyAnswers);

  const [giftResult, setGiftResult] = useState<GiftSuggestionsResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchGiftCategories = useCallback(async () => {
    if (Object.keys(surveyAnswers).length === 0) return;
    try {
      setIsLoading(true);
      setError(false);
      const data = await apiService.post("/surveys/gift-suggestions", {
        answers: surveyAnswers,
      });
      setGiftResult(data as GiftSuggestionsResult);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [surveyAnswers]);

  useEffect(() => {
    if (visible) {
      setGiftResult(null);
      fetchGiftCategories();
    }
  }, [visible]);

  const categories = giftResult?.categories ?? [];
  const companion = giftResult?.companion ?? null;
  const maxPrice = budgetToMaxPrice(giftResult?.meta.budget);
  const occasionKey = giftResult?.meta.occasionKey;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ── Header ── */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Gợi ý dành cho bạn</Text>
            <Text style={styles.headerSub}>
              {isLoading
                ? "Đang phân tích..."
                : `${categories.length} danh mục phù hợp nhất`}
            </Text>
          </View>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={11} color={colors.aiPrimary} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── AI summary bubble ── */}
          {aiSummary ? (
            <View style={styles.aiCard}>
              <View style={styles.aiCardHeader}>
                <LinearGradient
                  colors={[colors.aiPrimary, colors.aiSecondary]}
                  style={styles.aiAvatar}
                >
                  <Ionicons name="sparkles" size={17} color={colors.white} />
                </LinearGradient>
                <View>
                  <Text style={styles.aiName}>Trợ lý quà tặng AI</Text>
                  <Text style={styles.aiOnline}>● Đang hoạt động</Text>
                </View>
              </View>
              <View style={styles.aiBubble}>
                {isLoading ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <AIThinkingDots />
                    <Text style={styles.aiBubbleText}>
                      Đang phân tích câu trả lời của bạn...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.aiBubbleText}>
                    Mình đã chấm điểm{" "}
                    <Text style={{ fontFamily: 'Manrope_700Bold'}}>16 danh mục quà</Text>{" "}
                    và tìm ra{" "}
                    <Text style={{ fontFamily: 'Manrope_700Bold'}}>
                      {categories.length} lựa chọn
                    </Text>{" "}
                    phù hợp nhất cho{" "}
                    <Text style={{ fontFamily: 'Manrope_700Bold'}}>{aiSummary}</Text> nhé!
                  </Text>
                )}
              </View>
            </View>
          ) : null}

          {/* ── Loading state ── */}
          {isLoading && (
            <View style={styles.loadingBox}>
              <AIThinkingDots />
              <Text style={styles.loadingText}>
                Gift DNA Matrix đang tính điểm...
              </Text>
            </View>
          )}

          {/* ── Error state ── */}
          {error && !isLoading && (
            <EmptyState
              icon="alert-circle-outline"
              title="Không thể tải gợi ý"
              subtitle="Vui lòng thử lại"
              actionLabel="Thử lại"
              onAction={fetchGiftCategories}
            />
          )}

          {/* ── Companion gift (hoa) ── */}
          {!isLoading && companion && <CompanionCard companion={companion} />}

          {/* ── Category cards ── */}
          {!isLoading && categories.length > 0 && (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name="gift-outline"
                  size={16}
                  color={colors.textPrimary}
                />
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  Top danh mục quà phù hợp
                </Text>
              </View>
              {categories.map((cat, idx) => (
                <CategoryCard
                  key={cat.categoryKey}
                  item={cat}
                  defaultExpanded={idx === 0}
                  maxPrice={maxPrice}
                  occasionKey={occasionKey}
                />
              ))}
            </View>
          )}

          {/* ── Bottom actions ── */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.retakeBtn} onPress={onRetake}>
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text style={styles.retakeBtnText}>Làm lại khảo sát</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default React.memo(ResultsModal);
