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
import { LinearGradient } from "expo-linear-gradient";
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
import { makeStyles } from "@utils/makeStyles";
import { useColors } from "@contexts/ThemeContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;

const AI_QUICK_IDEAS = [
  "Quà sinh nhật bạn gái",
  "Quà kỷ niệm tình yêu",
  "Quà tặng cho mẹ",
  "Người thích thể thao",
  "Người thích đọc sách",
  "Quà làm đẹp",
  "Quà ngọt ngào",
  "Quà ngày 8/3",
];

// ─── Skeleton card ─────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();

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
    const styles = useStyles();
    const colors = useColors();

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
              color={colors.white}
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
          <TouchableOpacity style={styles.gridCta} onPress={handleBuyPress}>
            <Text style={styles.gridCtaText}>Mua ngay</Text>
          </TouchableOpacity>
        </View>
      </PressableCard>
    );
  }
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const AllProductsScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();

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
  const [filtersOpen, setFiltersOpen] = useState(true);

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
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gợi ý quà tặng</Text>
        {activeFilterCount > 0 ? (
          <TouchableOpacity style={styles.clearBadge} onPress={clearAll}>
            <Text style={styles.clearBadgeText}>Xóa ({activeFilterCount})</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </LinearGradient>

      {/* ── Mode toggle ── */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, !aiMode && styles.modeBtnActive]}
          onPress={() => setAiMode(false)}
        >
          <Ionicons
            name="grid-outline"
            size={14}
            color={!aiMode ? colors.white : colors.textSecondary}
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
            color={aiMode ? colors.white : colors.aiPrimary}
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
              color={colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm sản phẩm..."
              placeholderTextColor={colors.textSecondary}
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
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.filterToggleBtn}
              onPress={() => setFiltersOpen((v) => !v)}
            >
              <Ionicons
                name={filtersOpen ? "chevron-up" : "options-outline"}
                size={18}
                color={
                  activeFilterCount > 0 ? colors.primary : colors.textSecondary
                }
              />
              {activeFilterCount > 0 && !filtersOpen && (
                <View style={styles.filterDot} />
              )}
            </TouchableOpacity>
          </View>

          {/* Collapsible filters */}
          {filtersOpen && (
            <>
              {/* Category chips */}
              <View style={styles.categoryBar}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      categoryId === "all" && styles.chipActive,
                    ]}
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
                        color={categoryId === cat.id ? colors.white : cat.color}
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
                      style={[
                        styles.chip,
                        budget === f.key && styles.chipActive,
                      ]}
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
                    color={colors.textSecondary}
                  />
                  <Text style={styles.sortBtnText} numberOfLines={1}>
                    {sort === "popular" ? "Sắp xếp" : activeSortLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

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
          {/* <TouchableOpacity
            style={styles.shopPromoCard}
            onPress={() => navigation.navigate("LocalShop")}
            activeOpacity={0.85}
          >
            <Ionicons
              name="flower-outline"
              size={28}
              color={colors.primary}
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
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </View>
          </TouchableOpacity> */}

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.stateText}>Đang tải sản phẩm...</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Ionicons
                name="wifi-outline"
                size={44}
                color={colors.textSecondary}
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
                color={colors.textSecondary}
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
                    color={colors.primary}
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
              <Ionicons name="gift-outline" size={20} color={colors.primary} />
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
                placeholderTextColor={colors.textLight}
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
                    color={colors.textSecondary}
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
              <Ionicons name="sparkles" size={18} color={colors.white} />
              <Text style={styles.generateBtnText}>
                {aiLoading ? "Đang tìm..." : "Tìm quà với AI"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reasoning banner */}
          {aiReasoning ? (
            <View style={styles.reasoningBanner}>
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={colors.primary}
              />
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
                    sort === option.key ? colors.primary : colors.textSecondary
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
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
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

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 0,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  iconBtn: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },
  clearBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearBadgeText: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    color: colors.white,
  },

  // Search bar
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  filterToggleBtn: {
    padding: 6,
    marginLeft: 4,
    position: "relative",
  },
  filterDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  // Category + filter bars
  categoryBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  chipWithIcon: {},
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
    fontFamily: "Manrope_700Bold",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    minWidth: 90,
    maxWidth: 115,
    flexShrink: 0,
  },
  sortBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    fontFamily: "Manrope_500Medium",
  },
  clearText: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: "Manrope_600SemiBold",
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
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: colors.white,
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
    color: colors.textSecondary,
    paddingVertical: 20,
  },

  // Grid card
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: colors.shadow,
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
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },
  gridBody: {
    padding: 10,
    gap: 4,
  },
  gridName: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
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
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
  },
  gridReviews: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  gridPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  gridPrice: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: colors.success,
  },
  gridOriginal: {
    fontSize: 11,
    color: colors.textLight,
    textDecorationLine: "line-through",
  },
  gridPriceRange: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  gridCta: {
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  gridCtaText: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },

  // Sort sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
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
    color: colors.textPrimary,
    flex: 1,
  },
  sheetRowActive: {
    color: colors.primary,
    fontFamily: "Manrope_700Bold",
  },

  // Mode toggle
  modeToggle: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeBtnAiActive: {
    backgroundColor: colors.aiPrimary,
    borderColor: colors.aiPrimary,
  },
  modeBtnText: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textSecondary,
  },
  modeBtnTextActive: {
    color: colors.white,
  },
  modeBtnAiTextActive: {
    color: colors.white,
  },

  // AI mode scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  // AI input card
  aiCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.warning + "30",
    shadowColor: colors.warning,
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
  aiCardLabel: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  inputWrap: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    marginBottom: 12,
  },
  aiInput: {
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 52,
    lineHeight: 20,
  },
  clearBtn: { alignSelf: "flex-end", padding: 2, marginTop: 2 },
  ideasRow: { gap: 8, paddingBottom: 4, marginBottom: 14 },
  ideaChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ideaChipText: { fontSize: 12, color: colors.textSecondary },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.warning,
    paddingVertical: 14,
    borderRadius: 14,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },

  // Reasoning banner
  reasoningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.warning + "20",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  reasoningIcon: { fontSize: 15, marginTop: 1 },
  reasoningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
    fontStyle: "italic",
  },
  reasoningDismiss: { fontSize: 14, color: colors.textSecondary, padding: 2 },

  // AI results
  aiResultCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Manrope_500Medium",
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
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  aiEmptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 28,
    lineHeight: 21,
  },

  // Skeleton
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  skeletonImage: {
    width: "100%",
    height: 140,
    backgroundColor: colors.borderLight,
  },
  skeletonContent: { padding: 14 },
  skeletonLine: {
    height: 12,
    backgroundColor: colors.borderLight,
    borderRadius: 6,
  },

  aiDefaultHeader: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textSecondary,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  // Local shop promo card
  shopPromoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "12",
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.primary + "30",
  },
  shopPromoEmoji: {
    fontSize: 22,
  },
  shopPromoText: {
    flex: 1,
  },
  shopPromoTitle: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  shopPromoSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  shopPromoArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
}));
export default AllProductsScreen;
