import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { Article, filterArticlesByCategory } from "../../data/articles";
import { LoadingState } from "../LoadingState";
import PressableCard from "../PressableCard";

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
  const filteredArticles = useMemo(
    () => filterArticlesByCategory(articles, selectedCategory as any),
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
              color={selectedCategory === cat.id ? COLORS.white : cat.color}
            />
            <Text
              style={[
                styles.categoryChipText,
                {
                  color:
                    selectedCategory === cat.id ? COLORS.white : cat.color,
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
              <View
                style={[styles.articleColorBar, { backgroundColor: article.color }]}
              />
              <View style={styles.articleBody}>
                <View
                  style={[
                    styles.articleIconWrap,
                    { backgroundColor: article.color + "15" },
                  ]}
                >
                  <Ionicons
                    name={article.icon}
                    size={20}
                    color={article.color}
                  />
                </View>
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
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.articleTimeText}>
                      {article.readTime || 5} phút
                    </Text>
                  </View>
                </View>
              </View>
            </PressableCard>
          ))}
          {filteredArticles.length === 0 && !loading && (
            <View style={styles.emptyArticles}>
              <Text style={styles.emptyText}>Chưa có bài viết</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 4,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  articleCard: {
    width: 200,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  articleColorBar: {
    height: 8,
  },
  articleBody: {
    padding: 12,
  },
  articleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
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
    fontWeight: "600",
    color: COLORS.white,
  },
  articleTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  articleTimeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  emptyArticles: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default React.memo(ArticlesSection);
