import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '@themes/colors';
import { AffiliateProduct } from '../types';
import { getProducts, trackAffiliateClick } from '../services/affiliateProductService';
import { useMasterData } from '../contexts/MasterDataContext';
import { formatPrice } from '../data/affiliateProducts';
import PressableCard from '@components/atoms/PressableCard';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;

// ─── Filter types ─────────────────────────────────────────────────────────────

type BudgetKey = 'all' | 'under200' | '200to500' | '500to1m' | 'over1m';
type SortKey = 'popular' | 'price_asc' | 'price_desc' | 'rating';

const BUDGET_OPTIONS: { key: BudgetKey; label: string }[] = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'under200', label: '< 200k' },
  { key: '200to500', label: '200–500k' },
  { key: '500to1m',  label: '500k–1M' },
  { key: 'over1m',   label: '> 1M' },
];

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'popular',    label: 'Phổ biến nhất',    icon: 'flame-outline' },
  { key: 'price_asc',  label: 'Giá: Thấp → Cao',  icon: 'arrow-up-outline' },
  { key: 'price_desc', label: 'Giá: Cao → Thấp',  icon: 'arrow-down-outline' },
  { key: 'rating',     label: 'Đánh giá cao nhất', icon: 'star-outline' },
];

function matchesBudget(price: number | undefined, key: BudgetKey): boolean {
  if (key === 'all' || price == null) return true;
  if (key === 'under200') return price < 200_000;
  if (key === '200to500') return price >= 200_000 && price < 500_000;
  if (key === '500to1m')  return price >= 500_000 && price < 1_000_000;
  if (key === 'over1m')   return price >= 1_000_000;
  return true;
}

function applySort(products: AffiliateProduct[], key: SortKey): AffiliateProduct[] {
  const arr = [...products];
  if (key === 'price_asc')  return arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  if (key === 'price_desc') return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  if (key === 'rating')     return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  // popular: featured first, then popular, then rest
  return arr.sort((a, b) => {
    const scoreA = (a.isFeatured ? 2 : 0) + (a.isPopular ? 1 : 0);
    const scoreB = (b.isFeatured ? 2 : 0) + (b.isPopular ? 1 : 0);
    return scoreB - scoreA;
  });
}

// ─── Grid card ────────────────────────────────────────────────────────────────

const GridCard: React.FC<{ product: AffiliateProduct }> = React.memo(({ product }) => {
  const navigation = useNavigation<any>();

  const handleCardPress = () => navigation.navigate('ProductDetail', { product });
  const handleBuyPress  = () => {
    if (product.affiliateUrl) {
      trackAffiliateClick(product.id);
      Linking.openURL(product.affiliateUrl);
    }
  };

  return (
    <PressableCard style={[styles.gridCard, { width: CARD_WIDTH }]} onPress={handleCardPress}>
      {/* Thumbnail */}
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.gridImage} resizeMode="cover" />
      ) : (
        <View style={[styles.gridIconBox, { backgroundColor: product.color }]}>
          <Ionicons name={product.icon as any} size={28} color={COLORS.white} />
        </View>
      )}

      {/* Discount badge */}
      {product.originalPrice && product.price && product.originalPrice > product.price && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
          </Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.gridBody}>
        <Text style={styles.gridName} numberOfLines={2}>{product.name}</Text>

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
            {product.originalPrice && (
              <Text style={styles.gridOriginal}>{formatPrice(product.originalPrice)}</Text>
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
});

// ─── Main screen ──────────────────────────────────────────────────────────────

const AllProductsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { productCategories, occasions } = useMasterData();

  const [products, setProducts]       = useState<AffiliateProduct[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categoryId, setCategoryId]   = useState<string>('all');
  const [budget, setBudget]           = useState<BudgetKey>('all');
  const [sort, setSort]               = useState<SortKey>('popular');

  // UI state
  const [showSort, setShowSort]       = useState(false);
  const searchRef = useRef<TextInput>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProducts();
        setProducts(data);
      } catch {
        setError('Không thể tải sản phẩm. Kiểm tra kết nối mạng.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Computed filtered + sorted list
  const filtered = useMemo(() => {
    let result = products;

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    if (categoryId !== 'all') {
      result = result.filter((p) => p.category === categoryId);
    }
    if (budget !== 'all') {
      result = result.filter((p) => matchesBudget(p.price, budget));
    }

    return applySort(result, sort);
  }, [products, debouncedQuery, categoryId, budget, sort]);

  // Active filter count (excluding sort — sort is always active)
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (debouncedQuery.trim()) n++;
    if (categoryId !== 'all') n++;
    if (budget !== 'all') n++;
    return n;
  }, [debouncedQuery, categoryId, budget]);

  const clearAll = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setCategoryId('all');
    setBudget('all');
    setSort('popular');
  }, []);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? '';

  const renderItem = useCallback(
    ({ item }: { item: AffiliateProduct }) => <GridCard product={item} />,
    []
  );

  const keyExtractor = useCallback((item: AffiliateProduct) => item.id, []);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
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

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          ref={searchRef}
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && Platform.OS === 'android' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Category chips ── */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[styles.chip, categoryId === 'all' && styles.chipActive]}
            onPress={() => setCategoryId('all')}
          >
            <Text style={[styles.chipText, categoryId === 'all' && styles.chipTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>

          {productCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                styles.chipWithIcon,
                categoryId === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
              ]}
              onPress={() => setCategoryId(cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={categoryId === cat.id ? COLORS.white : cat.color}
              />
              <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Budget + Sort row ── */}
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
              <Text style={[styles.chipText, budget === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(true)}>
          <Ionicons name="funnel-outline" size={15} color={COLORS.textSecondary} />
          <Text style={styles.sortBtnText} numberOfLines={1}>
            {sort === 'popular' ? 'Sắp xếp' : activeSortLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Results bar ── */}
      {!loading && !error && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsCount}>
            {filtered.length} sản phẩm
            {activeFilterCount > 0 ? ' (đang lọc)' : ''}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clearText}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateText}>Đang tải sản phẩm...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="wifi-outline" size={44} color={COLORS.textSecondary} />
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setLoading(true);
              getProducts()
                .then(setProducts)
                .catch(() => setError('Không thể tải sản phẩm.'))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={44} color={COLORS.textSecondary} />
          <Text style={styles.stateText}>
            {activeFilterCount > 0
              ? 'Không tìm thấy sản phẩm phù hợp'
              : 'Chưa có sản phẩm nào'}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity style={styles.retryBtn} onPress={clearAll}>
              <Text style={styles.retryBtnText}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* ── Sort bottom sheet ── */}
      {showSort && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowSort(false)}
        >
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Sắp xếp theo</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.sheetRow}
                onPress={() => { setSort(option.key); setShowSort(false); }}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={sort === option.key ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={[styles.sheetRowText, sort === option.key && styles.sheetRowActive]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  clearBadge: {
    backgroundColor: COLORS.primary + '18',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Search bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  clearText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Empty / loading states
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  stateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
    fontWeight: '600',
    color: COLORS.white,
  },

  // Grid
  grid: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Grid card
  gridCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  gridImage: {
    width: '100%',
    height: 110,
  },
  gridIconBox: {
    width: '100%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  gridBody: {
    padding: 10,
    gap: 4,
  },
  gridName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
    minHeight: 36,
  },
  gridRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  gridReviews: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  gridPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  gridOriginal: {
    fontSize: 11,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  gridPriceRange: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  gridCta: {
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  gridCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Sort sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
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
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
  },
});

export default AllProductsScreen;
