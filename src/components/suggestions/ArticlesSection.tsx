import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from '@themes/colors';
import { Article, filterArticlesByCategory } from "../../data/articles";
import { LoadingState } from '@components/atoms/LoadingState';
import PressableCard from '@components/atoms/PressableCard';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

const ARTICLE_CATEGORIES = [
  { id: "all", name: "Tất cả", icon: "apps" as const, color: COLORS.primary },
  { id: "gifts", name: "Quà tặng", icon: "gift" as const, color: COLORS.categoryBirthday },
  { id: "dates", name: "Hẹn hò", icon: "heart" as const, color: COLORS.categoryAnniversary },
  { id: "communication", name: "Giao tiếp", icon: "chatbubbles" as const, color: COLORS.info },
  { id: "zodiac", name: "Cung hoàng đạo", icon: "sparkles" as const, color: COLORS.warning },
  { id: "personality", name: "Tính cách", icon: "people" as const, color: COLORS.success },
];

interface ArticlesSectionProps {
  articles: Article[];
  loading: boolean;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onArticlePress: (article: Article) => void;
  onViewAll?: () => void;
}

const ArticlesSection: React.FC<ArticlesSectionProps> = ({
  articles,
  loading,
  selectedCategory,
  onCategoryChange,
  onArticlePress,
  onViewAll,
}) => {
  const styles = useStyles();
  const colors = useColors();

  const MAX_DISPLAY = 12;

  const filteredArticles = useMemo(
    () => filterArticlesByCategory(articles, selectedCategory as any).slice(0, MAX_DISPLAY),
    [articles, selectedCategory]
  );

  const getCategoryName = useCallback(
    (categoryId: string) =>
      ARTICLE_CATEGORIES.find((c) => c.id === categoryId)?.name,
    []
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cẩm nang yêu thương</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryChipsScroll}
      >
        {ARTICLE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && {
                backgroundColor: cat.color,
                borderColor: cat.color,
              },
            ]}
            onPress={() => onCategoryChange(cat.id)}
          >
            <Ionicons
              name={cat.icon}
              size={14}
              color={selectedCategory === cat.id ? colors.white : cat.color}
            />
            <Text
              style={[
                styles.categoryChipText,
                {
                  color:
                    selectedCategory === cat.id ? colors.white : cat.color,
                },
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <LoadingState variant="skeleton" skeletonType="card" skeletonCount={2} />
      ) : filteredArticles.length === 0 ? (
        <View style={styles.emptyArticles}>
          <Ionicons name="newspaper-outline" size={36} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Chưa có bài viết</Text>
          <Text style={styles.emptyText}>
            {selectedCategory === 'all'
              ? 'Nội dung đang được cập nhật, quay lại sau nhé!'
              : 'Chưa có bài viết trong danh mục này.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {filteredArticles.map((article) => (
            <PressableCard
              key={article.id}
              style={styles.articleCard}
              onPress={() => onArticlePress(article)}
            >
              {/* Image or colored banner */}
              <View style={[styles.articleBanner, { backgroundColor: article.color }]}>
                {article.imageUrl ? (
                  <Image
                    source={{ uri: article.imageUrl }}
                    style={styles.articleBannerImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name={article.icon as keyof typeof Ionicons.glyphMap} size={28} color="rgba(255,255,255,0.85)" />
                )}
              </View>
              <View style={styles.articleBody}>
                <Text style={styles.articleTitle} numberOfLines={2}>
                  {article.title}
                </Text>
                <View style={styles.articleMeta}>
                  <View
                    style={[
                      styles.articleCategoryBadge,
                      { backgroundColor: article.color },
                    ]}
                  >
                    <Text style={styles.articleCategoryText}>
                      {getCategoryName(article.category)}
                    </Text>
                  </View>
                  <View style={styles.articleTime}>
                    <Ionicons
                      name="time-outline"
                      size={11}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.articleTimeText}>
                      {article.readTime || 5} phút
                    </Text>
                  </View>
                </View>
              </View>
            </PressableCard>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.primary,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
  },
  categoryChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
  },
  articleCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  articleBanner: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  articleBannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  articleBody: {
    padding: 12,
  },
  articleTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 10,
  },
  articleMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  articleCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  articleCategoryText: {
    fontSize: 10,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.white,
  },
  articleTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  articleTimeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  emptyArticles: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
}));export default React.memo(ArticlesSection);
