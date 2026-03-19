import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Linking,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS } from "@themes/colors";
import { AffiliateProduct } from "../types";
import {
  trackAffiliateClick,
  fetchProductsPaginated,
} from "../services/affiliateProductService";
import { useInfiniteList } from "../hooks/useInfiniteList";
import { useMasterData } from "../contexts/MasterDataContext";
import { formatPrice } from "../data/affiliateProducts";
import PressableCard from "@components/atoms/PressableCard";
import { apiService } from "../services/api.service";
import GiftSuggestionCard from "@components/molecules/GiftSuggestionCard";
import { useToast } from "../contexts/ToastContext";
import { useAiRateLimit } from "../hooks/useAiRateLimit";
import AiRateLimitModal from "@components/molecules/AiRateLimitModal";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;

const AI_QUICK_IDEAS = [
  "🌹 Quà sinh nhật bạn gái",
  "💍 Quà kỷ niệm tình yêu",
  "🎁 Quà tặng cho mẹ",
  "🏃 Người thích thể thao",
  "📚 Người thích đọc sách",
  "💄 Quà làm đẹp",
  "🍫 Quà ngọt ngào",
  "🌸 Quà ngày 8/3",
];

// ─── Skeleton card ─────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);
  return (
    <Animated.View style={[styles.skeletonCard, { opacity: anim }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View
          style={[styles.skeletonLine, { width: "75%", marginBottom: 8 }]}
        />
        <View
          style={[styles.skeletonLine, { width: "45%", marginBottom: 12 }]}
        />
        <View
          style={[
            styles.skeletonLine,
            { width: "100%", height: 36, borderRadius: 10 },
          ]}
        />
      </View>
    </Animated.View>
  );
};

// ─── Filter types ─────────────────────────────────────────────────────────────

type BudgetKey = "all" | "under200" | "200to500" | "500to1m" | "over1m";
type SortKey = "popular" | "price_asc" | "price_desc" | "rating";

const BUDGET_OPTIONS: { key: BudgetKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "under200", label: "< 200k" },
  { key: "200to500", label: "200–500k" },
  { key: "500to1m", label: "500k–1M" },
  { key: "over1m", label: "> 1M" },
];

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: "popular", label: "Phổ biến nhất", icon: "flame-outline" },
  { key: "price_asc", label: "Giá: Thấp → Cao", icon: "arrow-up-outline" },
  { key: "price_desc", label: "Giá: Cao → Thấp", icon: "arrow-down-outline" },
  { key: "rating", label: "Đánh giá cao nhất", icon: "star-outline" },
];

// Map budget key → { minPrice, maxPrice }
const BUDGET_PRICE: Record<
  BudgetKey,
  { minPrice?: number; maxPrice?: number }
> = {
  all: {},
  under200: { maxPrice: 200_000 },
  "200to500": { minPrice: 200_000, maxPrice: 500_000 },
  "500to1m": { minPrice: 500_000, maxPrice: 1_000_000 },
  over1m: { minPrice: 1_000_000 },
};

// Map sort key → backend sortBy/sortOrder
const SORT_PARAMS: Record<
  SortKey,
  { sortBy: string; sortOrder: "ASC" | "DESC" }
> = {
  popular: { sortBy: "rating", sortOrder: "DESC" },
  price_asc: { sortBy: "price", sortOrder: "ASC" },
  price_desc: { sortBy: "price", sortOrder: "DESC" },
  rating: { sortBy: "rating", sortOrder: "DESC" },
};

// ─── Grid card ────────────────────────────────────────────────────────────────

const GridCard: React.FC<{ product: AffiliateProduct }> = React.memo(
  ({ product }) => {
    const navigation = useNavigation<any>();

    const handleCardPress = () =>
      navigation.navigate("ProductDetail", { product });
    const handleBuyPress = () => {
      if (product.affiliateUrl) {
        trackAffiliateClick(product.id);
        Linking.openURL(product.affiliateUrl);
      }
    };

    return (
      <PressableCard
        style={[styles.gridCard, { width: CARD_WIDTH }]}
        onPress={handleCardPress}
      >
        {/* Thumbnail */}
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.gridImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[styles.gridIconBox, { backgroundColor: product.color }]}
          >
            <Ionicons
              name={product.icon as any}
              size={28}
              color={COLORS.white}
            />
          </View>
        )}

        {/* Discount badge */}
        {Number(product.originalPrice) > 0 &&
          Number(product.price) > 0 &&
          Number(product.originalPrice) > Number(product.price) && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -
                {Math.round(
                  (1 - Number(product.price) / Number(product.originalPrice)) *
                    100
                )}
                %
              </Text>
            </View>
          )}

        {/* Info */}
        <View style={styles.gridBody}>
          <Text style={styles.gridName} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Rating row */}
          <View style={styles.gridRating}>
            <Ionicons name="star" size={11} color="#FFB300" />
            <Text style={styles.gridRatingText}>{product.rating}</Text>
            <Text style={styles.gridReviews}>({product.reviewCount})</Text>
          </View>

          {/* Price */}
          {product.price ? (
            <View style={styles.gridPriceRow}>
              <Text style={styles.gridPrice}>{formatPrice(product.price)}</Text>
              {Number(product.originalPrice) > Number(product.price) && (
                <Text style={styles.gridOriginal}>
                  {formatPrice(product.originalPrice!)}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.gridPriceRange}>{product.priceRange}</Text>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.gridCta, { backgroundColor: product.color }]}
            onPress={handleBuyPress}
          >
            <Text style={styles.gridCtaText}>Mua ngay</Text>
          </TouchableOpacity>
        </View>
      </PressableCard>
    );
  }
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const AllProductsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { productCategories } = useMasterData();

  const { showError } = useToast();
  const { handleAiError, rateLimitModal } = useAiRateLimit();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [budget, setBudget] = useState<BudgetKey>("all");
  const [sort, setSort] = useState<SortKey>("popular");

  // UI state
  const [showSort, setShowSort] = useState(false);

  // AI mode
  const [aiMode, setAiMode] = useState(!!route.params?.initialAiMode);
  const [aiPrompt, setAiPrompt] = useState(route.params?.initialPrompt ?? "");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<AffiliateProduct[]>([]);
  const [aiReasoning, setAiReasoning] = useState("");

  const appendIdea = (idea: string) => {
    const clean = idea.replace(/^[\p{Emoji}\s]+/u, "").trim();
    setAiPrompt((prev: any) => {
      if (prev.endsWith(clean)) return prev;
      return prev ? `${prev}, ${clean.toLowerCase()}` : clean;
    });
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setAiLoading(true);
      setAiReasoning("");
      setAiResults([]);
      const data = await apiService.post("/products/ai-suggest", {
        prompt: aiPrompt.trim(),
      });
      const products: AffiliateProduct[] = data.products || [];
      setAiResults(products);
      setAiReasoning(data.reasoning || "");
      if (products.length === 0)
        showError("Không tìm thấy sản phẩm phù hợp. Thử mô tả khác.");
    } catch (err) {
      handleAiError(err, "Không thể kết nối AI. Vui lòng thử lại.");
    } finally {
      setAiLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Infinite-scroll hook (browse mode)
  const fetchFn = useCallback(
    (page: number) =>
      fetchProductsPaginated({
        page,
        limit: 12,
        search: debouncedQuery.trim() || undefined,
        category: categoryId !== "all" ? categoryId : undefined,
        ...BUDGET_PRICE[budget],
        ...SORT_PARAMS[sort],
      }),
    [debouncedQuery, categoryId, budget, sort]
  );

  const {
    items,
    total,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
  } = useInfiniteList(fetchFn, [debouncedQuery, categoryId, budget, sort]);

  // Active filter count (excluding sort — sort is always active)
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (debouncedQuery.trim()) n++;
    if (categoryId !== "all") n++;
    if (budget !== "all") n++;
    return n;
  }, [debouncedQuery, categoryId, budget]);

  const clearAll = useCallback(() => {
    setSearchQuery("");
    setDebouncedQuery("");
    setCategoryId("all");
    setBudget("all");
    setSort("popular");
  }, []);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "";

  const renderItem = useCallback(
    ({ item }: { item: AffiliateProduct }) => <GridCard product={item} />,
    []
  );

  const keyExtractor = useCallback((item: AffiliateProduct) => item.id, []);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm quà tặng</Text>
        {activeFilterCount > 0 ? (
          <TouchableOpacity style={styles.clearBadge} onPress={clearAll}>
            <Text style={styles.clearBadgeText}>Xóa ({activeFilterCount})</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {/* ── Mode toggle ── */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, !aiMode && styles.modeBtnActive]}
          onPress={() => setAiMode(false)}
        >
          <Ionicons
            name="grid-outline"
            size={14}
            color={!aiMode ? COLORS.white : COLORS.textSecondary}
          />
          <Text
            style={[styles.modeBtnText, !aiMode && styles.modeBtnTextActive]}
          >
            Duyệt sản phẩm
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, aiMode && styles.modeBtnAiActive]}
          onPress={() => setAiMode(true)}
        >
          <Ionicons
            name="sparkles"
            size={14}
            color={aiMode ? COLORS.white : "#D97706"}
          />
          <Text
            style={[styles.modeBtnText, aiMode && styles.modeBtnAiTextActive]}
          >
            Tìm với AI
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Browse mode ── */}
      {!aiMode && (
        <>
          {/* Search bar */}
          <View style={styles.searchRow}>
            <Ionicons
              name="search-outline"
              size={18}
              color={COLORS.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm sản phẩm..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && Platform.OS === "android" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Category chips */}
          <View style={styles.categoryBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              <TouchableOpacity
                style={[styles.chip, categoryId === "all" && styles.chipActive]}
                onPress={() => setCategoryId("all")}
              >
                <Text
                  style={[
                    styles.chipText,
                    categoryId === "all" && styles.chipTextActive,
                  ]}
                >
                  Tất cả
                </Text>
              </TouchableOpacity>
              {productCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    styles.chipWithIcon,
                    categoryId === cat.id && {
                      backgroundColor: cat.color,
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={categoryId === cat.id ? COLORS.white : cat.color}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      categoryId === cat.id && styles.chipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Budget + Sort row */}
          <View style={styles.filterRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {BUDGET_OPTIONS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, budget === f.key && styles.chipActive]}
                  onPress={() => setBudget(f.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      budget === f.key && styles.chipTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.sortBtn}
              onPress={() => setShowSort(true)}
            >
              <Ionicons
                name="funnel-outline"
                size={15}
                color={COLORS.textSecondary}
              />
              <Text style={styles.sortBtnText} numberOfLines={1}>
                {sort === "popular" ? "Sắp xếp" : activeSortLabel}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Results bar */}
          {!loading && !error && (
            <View style={styles.resultsBar}>
              <Text style={styles.resultsCount}>
                {total} sản phẩm{activeFilterCount > 0 ? " (đang lọc)" : ""}
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={clearAll}>
                  <Text style={styles.clearText}>Xóa bộ lọc</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          {/* Local shop promo card */}
          <TouchableOpacity
            style={styles.shopPromoCard}
            onPress={() => navigation.navigate("LocalShop")}
            activeOpacity={0.85}
          >
            <Ionicons
              name="flower-outline"
              size={28}
              color={COLORS.primary}
              style={styles.shopPromoEmoji}
            />
            <View style={styles.shopPromoText}>
              <Text style={styles.shopPromoTitle}>
                Đặt hoa & bánh giao tận nơi
              </Text>
              <Text style={styles.shopPromoSub}>
                Hàng nội địa · Giao trong ngày · COD
              </Text>
            </View>
            <View style={styles.shopPromoArrow}>
              <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.stateText}>Đang tải sản phẩm...</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Ionicons
                name="wifi-outline"
                size={44}
                color={COLORS.textSecondary}
              />
              <Text style={styles.stateText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
                <Text style={styles.retryBtnText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.center}>
              <Ionicons
                name="search-outline"
                size={44}
                color={COLORS.textSecondary}
              />
              <Text style={styles.stateText}>
                {activeFilterCount > 0
                  ? "Không tìm thấy sản phẩm phù hợp"
                  : "Chưa có sản phẩm nào"}
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity style={styles.retryBtn} onPress={clearAll}>
                  <Text style={styles.retryBtnText}>Xóa bộ lọc</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              onRefresh={refresh}
              refreshing={loading}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator
                    style={{ marginVertical: 16 }}
                    color={COLORS.primary}
                  />
                ) : !hasMore && items.length > 0 ? (
                  <Text style={styles.footerEnd}>
                    Đã hiển thị tất cả sản phẩm
                  </Text>
                ) : null
              }
            />
          )}
        </>
      )}

      {/* ── AI mode ── */}
      {aiMode && (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* AI input card */}
          <View style={styles.aiCard}>
            <View style={styles.aiCardTitle}>
              <Ionicons name="gift-outline" size={20} color={COLORS.primary} />
              <Text style={styles.aiCardLabel}>Bạn muốn tìm quà gì?</Text>
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.aiInput}
                value={aiPrompt}
                onChangeText={setAiPrompt}
                multiline
                numberOfLines={2}
                placeholder="VD: quà sinh nhật bạn gái thích yoga, ngân sách 500k..."
                placeholderTextColor={COLORS.textLight}
                textAlignVertical="top"
              />
              {aiPrompt.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => setAiPrompt("")}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ideasRow}
            >
              {AI_QUICK_IDEAS.map((idea) => (
                <TouchableOpacity
                  key={idea}
                  style={styles.ideaChip}
                  onPress={() => appendIdea(idea)}
                >
                  <Text style={styles.ideaChipText}>{idea}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.generateBtn,
                (aiLoading || !aiPrompt.trim()) && styles.generateBtnDisabled,
              ]}
              onPress={handleAiGenerate}
              disabled={aiLoading || !aiPrompt.trim()}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={18} color={COLORS.white} />
              <Text style={styles.generateBtnText}>
                {aiLoading ? "Đang tìm..." : "Tìm quà với AI"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reasoning banner */}
          {aiReasoning ? (
            <View style={styles.reasoningBanner}>
              <Text style={styles.reasoningIcon}>🤖</Text>
              <Text style={styles.reasoningText}>{aiReasoning}</Text>
              <TouchableOpacity
                onPress={() => {
                  setAiResults([]);
                  setAiReasoning("");
                }}
              >
                <Text style={styles.reasoningDismiss}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Skeleton loading */}
          {aiLoading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {/* AI results */}
          {!aiLoading && aiResults.length > 0 && (
            <>
              <Text style={styles.aiResultCount}>
                {aiResults.length} gợi ý cho bạn
              </Text>
              {aiResults.map((p) => (
                <GiftSuggestionCard
                  key={p.id}
                  product={p}
                  showSaveButton={false}
                  eventId={route.params?.eventId}
                />
              ))}
            </>
          )}

          {/* Default: all products */}
          {!aiLoading && aiResults.length === 0 && items.length > 0 && (
            <>
              <Text style={styles.aiDefaultHeader}>
                Tất cả sản phẩm ({total})
              </Text>
              {items.map((p) => (
                <GiftSuggestionCard
                  key={p.id}
                  product={p}
                  showSaveButton={false}
                  eventId={route.params?.eventId}
                />
              ))}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── Sort bottom sheet ── */}
      {showSort && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowSort(false)}
        >
          <TouchableOpacity
            style={styles.sheet}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Sắp xếp theo</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.sheetRow}
                onPress={() => {
                  setSort(option.key);
                  setShowSort(false);
                }}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={
                    sort === option.key ? COLORS.primary : COLORS.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.sheetRowText,
                    sort === option.key && styles.sheetRowActive,
                  ]}
                >
                  {option.label}
                </Text>
                {sort === option.key && (
                  <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      <AiRateLimitModal {...rateLimitModal} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 0,
    paddingBottom: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconBtn: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  clearBadge: {
    backgroundColor: COLORS.primary + "18",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // Search bar
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  // Category + filter bars
  categoryBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
  },
  chipsRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 4,
  },
  chipWithIcon: {},
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: "700",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    minWidth: 90,
    maxWidth: 115,
    flexShrink: 0,
  },
  sortBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },

  // Results bar
  resultsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  clearText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },

  // Empty / loading states
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  stateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },

  // Grid
  grid: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  footerEnd: {
    textAlign: "center",
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingVertical: 20,
  },

  // Grid card
  gridCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  gridImage: {
    width: "100%",
    height: 110,
  },
  gridIconBox: {
    width: "100%",
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  discountBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.white,
  },
  gridBody: {
    padding: 10,
    gap: 4,
  },
  gridName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 18,
    minHeight: 36,
  },
  gridRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  gridRatingText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  gridReviews: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  gridPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.success,
  },
  gridOriginal: {
    fontSize: 11,
    color: COLORS.textLight,
    textDecorationLine: "line-through",
  },
  gridPriceRange: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  gridCta: {
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: "center",
  },
  gridCtaText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },

  // Sort sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sheetRowText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  sheetRowActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  // Mode toggle
  modeToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: 8,
    gap: 8,
    paddingHorizontal: 12,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeBtnAiActive: {
    backgroundColor: "#D97706",
    borderColor: "#D97706",
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  modeBtnTextActive: {
    color: COLORS.white,
  },
  modeBtnAiTextActive: {
    color: COLORS.white,
  },

  // AI mode scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  // AI input card
  aiCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#D97706" + "30",
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  aiCardTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  aiSparkle: { fontSize: 18 },
  aiCardLabel: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
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
  clearBtn: { alignSelf: "flex-end", padding: 2, marginTop: 2 },
  ideasRow: { gap: 8, paddingBottom: 4, marginBottom: 14 },
  ideaChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ideaChipText: { fontSize: 12, color: COLORS.textSecondary },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#D97706",
    paddingVertical: 14,
    borderRadius: 14,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },

  // Reasoning banner
  reasoningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#D97706" + "12",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#D97706",
  },
  reasoningIcon: { fontSize: 15, marginTop: 1 },
  reasoningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textPrimary,
    fontStyle: "italic",
  },
  reasoningDismiss: { fontSize: 14, color: COLORS.textSecondary, padding: 2 },

  // AI results
  aiResultCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  // AI empty state
  aiEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
  },
  aiEmptyIcon: { fontSize: 52, marginBottom: 16 },
  aiEmptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  aiEmptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 28,
    lineHeight: 21,
  },

  // Skeleton
  skeletonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  skeletonImage: {
    width: "100%",
    height: 140,
    backgroundColor: COLORS.borderLight,
  },
  skeletonContent: { padding: 14 },
  skeletonLine: {
    height: 12,
    backgroundColor: COLORS.borderLight,
    borderRadius: 6,
  },

  aiDefaultHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  // Local shop promo card
  shopPromoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "12",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "30",
  },
  shopPromoEmoji: {
    fontSize: 22,
  },
  shopPromoText: {
    flex: 1,
  },
  shopPromoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  shopPromoSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  shopPromoArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AllProductsScreen;
