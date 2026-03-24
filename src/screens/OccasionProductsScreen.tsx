import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { COLORS } from '@themes/colors';
import { AffiliateProduct } from '../types';
import { fetchProductsByOccasionPaginated } from '../services/affiliateProductService';
import { useInfiniteList } from '../hooks/useInfiniteList';
import ProductCard from '../components/suggestions/ProductCard';
import { useEvents } from '@contexts/EventsContext';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

type OccasionProductsRouteProp = RouteProp<
  { OccasionProducts: { occasionId: string; occasionName: string; occasionColor?: string; eventId?: string } },
  'OccasionProducts'
>;

// ─── Budget filter config ─────────────────────────────────────────────────────

type BudgetKey = 'all' | 'under200' | '200to500' | '500to1m' | 'over1m';

const BUDGET_FILTERS: { key: BudgetKey; label: string }[] = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'under200', label: 'Dưới 200k' },
  { key: '200to500', label: '200k–500k' },
  { key: '500to1m',  label: '500k–1M' },
  { key: 'over1m',   label: 'Trên 1M' },
];

const BUDGET_PRICE: Record<BudgetKey, { minPrice?: number; maxPrice?: number }> = {
  all:        {},
  under200:   { maxPrice: 200_000 },
  '200to500': { minPrice: 200_000, maxPrice: 500_000 },
  '500to1m':  { minPrice: 500_000, maxPrice: 1_000_000 },
  over1m:     { minPrice: 1_000_000 },
};

// ─── Sort config ──────────────────────────────────────────────────────────────

type SortKey = 'default' | 'price_asc' | 'price_desc' | 'rating';

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'default',    label: 'Phổ biến nhất', icon: 'flame-outline' },
  { key: 'price_asc',  label: 'Giá: Thấp → Cao', icon: 'arrow-up-outline' },
  { key: 'price_desc', label: 'Giá: Cao → Thấp', icon: 'arrow-down-outline' },
  { key: 'rating',     label: 'Đánh giá cao nhất', icon: 'star-outline' },
];

const SORT_PARAMS: Record<SortKey, { sortBy: string; sortOrder: 'ASC' | 'DESC' }> = {
  default:    { sortBy: 'rating',  sortOrder: 'DESC' },
  price_asc:  { sortBy: 'price',   sortOrder: 'ASC'  },
  price_desc: { sortBy: 'price',   sortOrder: 'DESC' },
  rating:     { sortBy: 'rating',  sortOrder: 'DESC' },
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const OccasionProductsScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();

  const insets = useSafeAreaInsets();
  const route = useRoute<OccasionProductsRouteProp>();
  const navigation = useNavigation<any>();
  const { occasionId, occasionName, occasionColor = colors.primary, eventId } = route.params;
  const { upsertEventNote } = useEvents();

  const [budget, setBudget] = useState<BudgetKey>('all');
  const [sort, setSort] = useState<SortKey>('default');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);

  const handleSaveToEvent = useCallback(async (product: AffiliateProduct) => {
    if (!eventId || savingProductId) return;
    setSavingProductId(product.id);
    try {
      await upsertEventNote(eventId, {
        gift: {
          name: product.name,
          price: product.price ? Number(product.price) : undefined,
          source: 'occasion_products',
          productId: product.id,
          link: product.affiliateUrl,
        },
      });
      Alert.alert('Đã lưu', `"${product.name}" đã được lưu vào sự kiện.`, [{ text: 'OK' }]);
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu quà tặng. Thử lại nhé.');
    } finally {
      setSavingProductId(null);
    }
  }, [eventId, savingProductId, upsertEventNote]);

  const fetchFn = useCallback(
    (page: number) =>
      fetchProductsByOccasionPaginated(occasionId, {
        page,
        limit: 12,
        ...BUDGET_PRICE[budget],
        ...SORT_PARAMS[sort],
      }),
    [occasionId, budget, sort],
  );

  const { items, total, loading, loadingMore, hasMore, error, refresh, loadMore } = useInfiniteList(
    fetchFn,
    [occasionId, budget, sort],
  );

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? '';

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: occasionColor, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{occasionName}</Text>
          {!loading && (
            <Text style={styles.headerCount}>
              {total} gợi ý{budget !== 'all' || sort !== 'default' ? ' (đã lọc)' : ''}
            </Text>
          )}
        </View>
        <View style={styles.iconBtn} />
      </View>

      {/* ── Filter bar ── */}
      <View style={styles.filterBar}>
        {/* Budget chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {BUDGET_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.chip,
                budget === f.key && { backgroundColor: occasionColor, borderColor: occasionColor },
              ]}
              onPress={() => setBudget(f.key)}
            >
              <Text
                style={[styles.chipText, budget === f.key && styles.chipTextActive]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort button */}
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setShowSortSheet(true)}
        >
          <Ionicons name="funnel-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.sortBtnText} numberOfLines={1}>
            {sort === 'default' ? 'Sắp xếp' : activeSortLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={occasionColor} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="wifi-outline" size={44} color={colors.textSecondary} />
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: occasionColor }]}
            onPress={refresh}
          >
            <Text style={[styles.resetBtnText, { color: occasionColor }]}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={44} color={colors.textSecondary} />
          <Text style={styles.stateText}>Không có sản phẩm phù hợp</Text>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: occasionColor }]}
            onPress={() => { setBudget('all'); setSort('default'); }}
          >
            <Text style={[styles.resetBtnText, { color: occasionColor }]}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              variant="vertical"
              occasion={occasionId}
              onSaveToEvent={eventId ? handleSaveToEvent : undefined}
            />
          )}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          onRefresh={refresh}
          refreshing={loading}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={occasionColor} />
            ) : !hasMore && items.length > 0 ? (
              <Text style={styles.footerEnd}>Đã hiển thị tất cả sản phẩm</Text>
            ) : null
          }
        />
      )}

      {/* ── Sort bottom sheet ── */}
      {showSortSheet && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowSortSheet(false)}
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
                onPress={() => { setSort(option.key); setShowSortSheet(false); }}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={sort === option.key ? occasionColor : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.sheetRowText,
                    sort === option.key && { color: occasionColor, fontFamily: 'Manrope_700Bold'},
                  ]}
                >
                  {option.label}
                </Text>
                {sort === option.key && (
                  <Ionicons name="checkmark" size={18} color={occasionColor} />
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

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 0,
    paddingBottom: 14,
    paddingHorizontal: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    color: colors.white,
  },
  headerCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Filter bar
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  chipsRow: {
    paddingHorizontal: 12,
    gap: 8,
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
    fontFamily: 'Manrope_700Bold',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    minWidth: 90,
    maxWidth: 110,
  },
  sortBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 1,
  },

  // Content states
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  stateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  resetBtnText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  footerEnd: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.textSecondary,
    paddingVertical: 20,
  },

  // Sort sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
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
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
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
    color: colors.textPrimary,
    flex: 1,
  },
}));export default OccasionProductsScreen;
