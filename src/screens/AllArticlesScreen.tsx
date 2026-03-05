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
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '@themes/colors';
import { Article } from '../data/articles';
import { trackArticleView, fetchArticlesPaginated } from '../services/articleService';
import { useInfiniteList } from '../hooks/useInfiniteList';
import { useMasterData } from '../contexts/MasterDataContext';
import PressableCard from '@components/atoms/PressableCard';

const SCREEN_WIDTH = Dimensions.get('window').width;

const AI_TOPIC_CHIPS = [
  '💝 Giữ lửa tình yêu',
  '🎁 Ý tưởng tặng quà',
  '💬 Giao tiếp với người yêu',
  '🌟 Hẹn hò lãng mạn',
  '⭐ Chòm sao & tình yêu',
  '🧠 Hiểu tính cách bạn đời',
  '😢 Hàn gắn sau cãi nhau',
  '💕 Lời nói ngọt ngào',
];

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey = 'popular' | 'newest' | 'liked' | 'quick';

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'popular', label: 'Phổ biến nhất',  icon: 'eye-outline' },
  { key: 'newest',  label: 'Mới nhất',        icon: 'time-outline' },
  { key: 'liked',   label: 'Được yêu thích',  icon: 'heart-outline' },
  { key: 'quick',   label: 'Đọc nhanh nhất',  icon: 'flash-outline' },
];

// Map UI sort key → backend params
const SORT_PARAMS: Record<SortKey, { sortBy: 'created_at' | 'views' | 'likes'; sortOrder: 'ASC' | 'DESC' }> = {
  popular: { sortBy: 'views',      sortOrder: 'DESC' },
  newest:  { sortBy: 'created_at', sortOrder: 'DESC' },
  liked:   { sortBy: 'likes',      sortOrder: 'DESC' },
  quick:   { sortBy: 'created_at', sortOrder: 'ASC'  },
};

// ─── Category config ──────────────────────────────────────────────────────────

const STATIC_CATEGORIES = [
  { id: 'all',           name: 'Tất cả',        icon: 'apps',         color: COLORS.primary },
  { id: 'gifts',         name: 'Quà tặng',      icon: 'gift',         color: '#FF6B6B' },
  { id: 'dates',         name: 'Hẹn hò',        icon: 'heart',        color: '#E91E63' },
  { id: 'communication', name: 'Giao tiếp',     icon: 'chatbubbles',  color: '#2196F3' },
  { id: 'zodiac',        name: 'Hoàng đạo',     icon: 'sparkles',     color: '#FF9800' },
  { id: 'personality',   name: 'Tính cách',     icon: 'people',       color: '#4CAF50' },
];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Hero card (featured, full-width) ─────────────────────────────────────────

const HeroCard: React.FC<{ article: Article; onPress: () => void }> = ({ article, onPress }) => (
  <PressableCard style={styles.heroCard} onPress={onPress}>
    {article.imageUrl ? (
      <Image source={{ uri: article.imageUrl }} style={styles.heroImage} resizeMode="cover" />
    ) : (
      <View style={[styles.heroImage, { backgroundColor: article.color, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name={article.icon as any} size={56} color="rgba(255,255,255,0.4)" />
      </View>
    )}

    {/* Gradient overlay */}
    <View style={styles.heroOverlay}>
      <View style={styles.heroBadgeRow}>
        <View style={[styles.heroCategoryBadge, { backgroundColor: article.color }]}>
          <Ionicons name={article.icon as any} size={11} color={COLORS.white} />
          <Text style={styles.heroCategoryText}>
            {STATIC_CATEGORIES.find((c) => c.id === article.category)?.name ?? article.category}
          </Text>
        </View>
        {article.isFeatured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color="#FFB300" />
            <Text style={styles.featuredText}>Nổi bật</Text>
          </View>
        )}
      </View>

      <Text style={styles.heroTitle} numberOfLines={2}>{article.title}</Text>

      <View style={styles.heroMeta}>
        <View style={styles.heroMetaItem}>
          <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={styles.heroMetaText}>{article.readTime ?? 5} phút đọc</Text>
        </View>
        <View style={styles.heroMetaItem}>
          <Ionicons name="eye-outline" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={styles.heroMetaText}>{formatCount(article.views ?? 0)}</Text>
        </View>
        <View style={styles.heroMetaItem}>
          <Ionicons name="heart-outline" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={styles.heroMetaText}>{formatCount(article.likes ?? 0)}</Text>
        </View>
      </View>
    </View>
  </PressableCard>
);

// ─── Editorial list card ───────────────────────────────────────────────────────

const ArticleListCard: React.FC<{ article: Article; onPress: () => void }> = ({ article, onPress }) => {
  const catInfo = STATIC_CATEGORIES.find((c) => c.id === article.category);

  return (
    <PressableCard style={styles.listCard} onPress={onPress}>
      {/* Thumbnail */}
      {article.imageUrl ? (
        <Image source={{ uri: article.imageUrl }} style={styles.listThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.listThumb, styles.listThumbIcon, { backgroundColor: article.color + '20' }]}>
          <Ionicons name={article.icon as any} size={22} color={article.color} />
        </View>
      )}

      {/* Content */}
      <View style={styles.listContent}>
        {/* Category + read time */}
        <View style={styles.listTopRow}>
          <View style={[styles.listCatBadge, { backgroundColor: catInfo?.color ?? article.color }]}>
            <Text style={styles.listCatText}>{catInfo?.name ?? article.category}</Text>
          </View>
          <View style={styles.listReadTime}>
            <Ionicons name="time-outline" size={11} color={COLORS.textSecondary} />
            <Text style={styles.listReadTimeText}>{article.readTime ?? 5} phút</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.listTitle} numberOfLines={2}>{article.title}</Text>

        {/* Stats */}
        <View style={styles.listStats}>
          <View style={styles.listStat}>
            <Ionicons name="eye-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.listStatText}>{formatCount(article.views ?? 0)}</Text>
          </View>
          <View style={styles.listStat}>
            <Ionicons name="heart-outline" size={12} color="#E91E63" />
            <Text style={styles.listStatText}>{formatCount(article.likes ?? 0)}</Text>
          </View>
        </View>
      </View>

      {/* Right arrow */}
      <Ionicons name="chevron-forward" size={16} color={COLORS.border} style={styles.listArrow} />
    </PressableCard>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

type ListItem =
  | { type: 'hero'; article: Article }
  | { type: 'article'; article: Article }
  | { type: 'count'; count: number; activeFilters: number };

const AllArticlesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery]       = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categoryId, setCategoryId]         = useState('all');
  const [sort, setSort]                     = useState<SortKey>('popular');
  const [showSort, setShowSort]             = useState(false);

  // AI mode
  const [aiMode, setAiMode]         = useState(false);
  const [aiQuery, setAiQuery]       = useState('');
  const [aiSearched, setAiSearched] = useState(false);

  const appendTopic = (topic: string) => {
    const clean = topic.replace(/^[\p{Emoji}\s]+/u, '').trim();
    setAiQuery((prev) => {
      if (prev.includes(clean)) return prev;
      return prev ? `${prev}, ${clean.toLowerCase()}` : clean;
    });
  };

  // Debounce search — 500ms để tránh spam API
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Infinite scroll for browse mode ──────────────────────────────────────────
  const fetchFn = useCallback(
    (page: number) => fetchArticlesPaginated({
      page,
      limit: 12,
      search: debouncedQuery || undefined,
      category: categoryId !== 'all' ? categoryId : undefined,
      ...SORT_PARAMS[sort],
    }),
    [debouncedQuery, categoryId, sort],
  );

  const {
    items, total, loading, loadingMore, hasMore, error, refresh, loadMore,
  } = useInfiniteList(fetchFn, [debouncedQuery, categoryId, sort] as const);

  // ── Infinite scroll for AI mode default list ──────────────────────────────────
  const aiFetchFn = useCallback(
    (page: number) => {
      if (!aiMode) return Promise.resolve({ data: [], total: 0, page: 1, limit: 12, totalPages: 0 });
      return fetchArticlesPaginated({ page, limit: 12 });
    },
    [aiMode],
  );
  const {
    items: aiItems,
    loadingMore: aiLoadingMore,
    hasMore: aiHasMore,
    loadMore: aiLoadMore,
  } = useInfiniteList(aiFetchFn, [aiMode] as const);

  const handleArticlePress = useCallback((article: Article) => {
    trackArticleView(article.id);
    navigation.navigate('ArticleDetail', { article });
  }, [navigation]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (debouncedQuery.trim()) n++;
    if (categoryId !== 'all') n++;
    return n;
  }, [debouncedQuery, categoryId]);

  // AI smart filter — keyword match trên các bài viết đã load (aiItems)
  const aiFiltered = useMemo(() => {
    if (!aiQuery.trim()) return [];
    const keywords = aiQuery.toLowerCase().split(/[,\s]+/).filter((k) => k.length > 1);
    return aiItems.filter((article) => {
      const haystack = [
        article.title,
        ...(article.tags ?? []),
        STATIC_CATEGORIES.find((c) => c.id === article.category)?.name ?? '',
      ].join(' ').toLowerCase();
      return keywords.some((kw) => haystack.includes(kw));
    });
  }, [aiItems, aiQuery]);

  const clearAll = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setCategoryId('all');
    setSort('popular');
  }, []);

  // Build list data: hero (first) + count bar + rest as list cards
  const listData = useMemo((): ListItem[] => {
    if (items.length === 0) return [];
    const [hero, ...rest] = items;
    return [
      { type: 'hero', article: hero },
      { type: 'count', count: total, activeFilters: activeFilterCount },
      ...rest.map((a): ListItem => ({ type: 'article', article: a })),
    ];
  }, [items, total, activeFilterCount]);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? '';

  const renderItem: ListRenderItem<ListItem> = useCallback(({ item }) => {
    if (item.type === 'hero') {
      return <HeroCard article={item.article} onPress={() => handleArticlePress(item.article)} />;
    }
    if (item.type === 'count') {
      return (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsCount}>
            {item.count} bài viết{item.activeFilters > 0 ? ' (đang lọc)' : ''}
          </Text>
          {item.activeFilters > 0 && (
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clearText}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return <ArticleListCard article={item.article} onPress={() => handleArticlePress(item.article)} />;
  }, [handleArticlePress, clearAll]);

  const keyExtractor = useCallback((item: ListItem, index: number) => {
    if (item.type === 'count') return 'count-bar';
    return item.article.id + '-' + index;
  }, []);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Cẩm nang yêu thương</Text>
          <Text style={styles.headerSub}>Bí quyết cho tình yêu bền lâu</Text>
        </View>
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
          <Ionicons name="list-outline" size={14} color={!aiMode ? COLORS.white : COLORS.textSecondary} />
          <Text style={[styles.modeBtnText, !aiMode && styles.modeBtnTextActive]}>Duyệt bài viết</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, aiMode && styles.modeBtnAiActive]}
          onPress={() => setAiMode(true)}
        >
          <Ionicons name="sparkles" size={14} color={aiMode ? COLORS.white : COLORS.primary} />
          <Text style={[styles.modeBtnText, aiMode && styles.modeBtnAiTextActive]}>AI Gợi ý</Text>
        </TouchableOpacity>
      </View>

      {/* ── Browse mode ── */}
      {!aiMode && (
        <>
          {/* Search + Sort row */}
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={17} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm bài viết, chủ đề..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            <TouchableOpacity style={styles.sortPill} onPress={() => setShowSort(true)}>
              <Ionicons name="swap-vertical-outline" size={14} color={COLORS.primary} />
              <Text style={styles.sortPillText} numberOfLines={1}>
                {sort === 'popular' ? 'Sắp xếp' : activeSortLabel}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category tabs */}
          <View style={styles.categoryBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {STATIC_CATEGORIES.map((cat) => {
                const active = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Ionicons name={cat.icon as any} size={13} color={active ? COLORS.white : cat.color} />
                    <Text style={[styles.catChipText, { color: active ? COLORS.white : cat.color }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateText}>Đang tải bài viết...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="wifi-outline" size={44} color={COLORS.textSecondary} />
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="document-text-outline" size={44} color={COLORS.textSecondary} />
            <Text style={styles.stateText}>
              {activeFilterCount > 0 ? 'Không tìm thấy bài viết phù hợp' : 'Chưa có bài viết nào'}
            </Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity style={styles.retryBtn} onPress={clearAll}>
                <Text style={styles.retryBtnText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            onRefresh={refresh}
            refreshing={loading && items.length > 0}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : !hasMore && items.length > 0 ? (
                <Text style={styles.footerEnd}>— Hết danh sách —</Text>
              ) : null
            }
          />
        )}
        </>
      )}

      {/* ── AI mode ── */}
      {aiMode && (
        <FlatList
          style={styles.aiScroll}
          data={!aiSearched || !aiQuery.trim() ? aiItems : []}
          keyExtractor={(item, i) => `ai-${item.id}-${i}`}
          renderItem={({ item }) => (
            <ArticleListCard
              article={item}
              onPress={() => handleArticlePress(item)}
            />
          )}
          contentContainerStyle={styles.aiScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={!aiSearched || !aiQuery.trim() ? aiLoadMore : undefined}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <View>
              {/* AI input card */}
              <View style={styles.aiCard}>
                <View style={styles.aiCardTitle}>
                  <Text style={styles.aiSparkle}>📖</Text>
                  <Text style={styles.aiCardLabel}>Bạn muốn đọc về chủ đề gì?</Text>
                </View>
                <View style={styles.aiInputWrap}>
                  <TextInput
                    style={styles.aiTextInput}
                    value={aiQuery}
                    onChangeText={(text) => { setAiQuery(text); setAiSearched(false); }}
                    multiline
                    numberOfLines={2}
                    placeholder="VD: cách tặng quà bạn gái, hẹn hò lần đầu, giao tiếp trong tình yêu..."
                    placeholderTextColor={COLORS.textLight}
                    textAlignVertical="top"
                  />
                  {aiQuery.length > 0 && (
                    <TouchableOpacity
                      style={styles.aiClearBtn}
                      onPress={() => { setAiQuery(''); setAiSearched(false); }}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Quick topic chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.topicRow}
                >
                  {AI_TOPIC_CHIPS.map((topic) => (
                    <TouchableOpacity
                      key={topic}
                      style={styles.topicChip}
                      onPress={() => { appendTopic(topic); setAiSearched(false); }}
                    >
                      <Text style={styles.topicChipText}>{topic}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.aiSearchBtn, !aiQuery.trim() && styles.aiSearchBtnDisabled]}
                  onPress={() => setAiSearched(true)}
                  disabled={!aiQuery.trim()}
                  activeOpacity={0.85}
                >
                  <Ionicons name="sparkles" size={18} color={COLORS.white} />
                  <Text style={styles.aiSearchBtnText}>Tìm bài viết phù hợp</Text>
                </TouchableOpacity>
              </View>

              {/* AI results (khi đã search) */}
              {aiSearched && aiQuery.trim() && (
                aiFiltered.length > 0 ? (
                  <>
                    <View style={styles.aiResultHeader}>
                      <Text style={styles.aiResultCount}>
                        Tìm thấy {aiFiltered.length} bài viết
                      </Text>
                      <TouchableOpacity onPress={() => { setAiQuery(''); setAiSearched(false); }}>
                        <Text style={styles.aiResultClear}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                    {aiFiltered.map((article) => (
                      <ArticleListCard
                        key={article.id}
                        article={article}
                        onPress={() => handleArticlePress(article)}
                      />
                    ))}
                  </>
                ) : (
                  <View style={styles.aiEmpty}>
                    <Text style={styles.aiEmptyIcon}>📭</Text>
                    <Text style={styles.aiEmptyTitle}>Không tìm thấy bài viết</Text>
                    <Text style={styles.aiEmptyText}>Thử từ khóa khác hoặc chọn chủ đề gợi ý bên trên</Text>
                  </View>
                )
              )}

              {/* Header mặc định */}
              {(!aiSearched || !aiQuery.trim()) && aiItems.length > 0 && (
                <Text style={styles.aiDefaultHeader}>Tất cả bài viết</Text>
              )}
            </View>
          }
          ListFooterComponent={
            aiLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : !aiHasMore && aiItems.length > 0 && (!aiSearched || !aiQuery.trim()) ? (
              <Text style={styles.footerEnd}>— Hết danh sách —</Text>
            ) : null
          }
        />
      )}

      {/* ── Sort sheet ── */}
      {showSort && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowSort(false)}>
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

  // Header — warm gradient feel
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 0,
    paddingBottom: 14,
    paddingHorizontal: 12,
    backgroundColor: '#C62A47',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  clearBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: 40,
    alignItems: 'center',
  },
  clearBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Search + sort row
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
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    maxWidth: 100,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    flexShrink: 1,
  },

  // Category chips
  categoryBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
  },
  chipsRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // List
  list: {
    paddingBottom: 40,
  },

  // Hero card
  heroCard: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 14,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  heroCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,179,0,0.25)',
    borderWidth: 1,
    borderColor: '#FFB300',
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFB300',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 23,
    marginBottom: 10,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 14,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },

  // Results bar
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
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

  // Editorial list card
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 14,
    padding: 12,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  listThumb: {
    width: 76,
    height: 76,
    borderRadius: 12,
    marginRight: 12,
    flexShrink: 0,
  },
  listThumbIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flex: 1,
    gap: 5,
  },
  listTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listCatBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  listCatText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  listReadTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  listReadTimeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  listStats: {
    flexDirection: 'row',
    gap: 10,
  },
  listStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  listStatText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  listArrow: {
    marginLeft: 6,
    flexShrink: 0,
  },

  // States
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

  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerEnd: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 13,
    color: COLORS.textSecondary,
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

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: 8,
    gap: 8,
    paddingHorizontal: 12,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  modeBtnActive: {
    backgroundColor: '#C62A47',
    borderColor: '#C62A47',
  },
  modeBtnAiActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeBtnTextActive: {
    color: COLORS.white,
  },
  modeBtnAiTextActive: {
    color: COLORS.white,
  },

  // AI scroll
  aiScroll: { flex: 1 },
  aiScrollContent: { padding: 14 },

  // AI input card
  aiCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  aiCardTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  aiSparkle: { fontSize: 18 },
  aiCardLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  aiInputWrap: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    marginBottom: 12,
  },
  aiTextInput: {
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 52,
    lineHeight: 20,
  },
  aiClearBtn: { alignSelf: 'flex-end', padding: 2, marginTop: 2 },
  topicRow: { gap: 8, paddingBottom: 4, marginBottom: 14 },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topicChipText: { fontSize: 12, color: COLORS.textSecondary },
  aiSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  aiSearchBtnDisabled: { opacity: 0.6 },
  aiSearchBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  // AI result header
  aiResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  aiResultCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  aiResultClear: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // AI empty
  aiEmpty: { alignItems: 'center', paddingVertical: 40 },
  aiEmptyIcon: { fontSize: 44, marginBottom: 12 },
  aiEmptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  aiEmptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 24 },

  aiDefaultHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
});

export default AllArticlesScreen;
