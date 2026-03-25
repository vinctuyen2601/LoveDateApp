import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
  Dimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import RenderHTML from "react-native-render-html";
import { COLORS } from "@themes/colors";
import { htmlStyles } from "@styles/htmlStyles";
import { WEB_BASE_URL } from "../constants/config";
import { logArticleView, logArticleShare } from "../services/analyticsService";
import {
  Article,
  getRelatedArticles,
  ARTICLE_CATEGORIES,
} from "../data/articles";
import { getRelatedProductsForArticleAsync } from "../services/affiliateProductService";
import { getArticles } from "../services/articleService";
import { AffiliateProduct } from "../types";
import ProductCard from "../components/suggestions/ProductCard";
import PressableCard from "@components/atoms/PressableCard";
import { makeStyles } from "@utils/makeStyles";
import { useColors, useTheme } from "@contexts/ThemeContext";

const { width: screenWidth } = Dimensions.get("window");

const ArticleDetailScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();
  const { themeName } = useTheme();

  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { article } = route.params as { article: Article };

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes || 0);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<AffiliateProduct[]>(
    []
  );

  useEffect(() => {
    logArticleView({
      id: article.id,
      title: article.title,
      category: article.category,
    });
    loadArticles();
    loadRelatedProducts();
  }, []);

  const loadArticles = async () => {
    try {
      const articles = await getArticles();
      setAllArticles(articles);
    } catch {
      // Fallback - no related articles shown
    }
  };

  const loadRelatedProducts = async () => {
    try {
      const products = await getRelatedProductsForArticleAsync(article.tags);
      setRelatedProducts(products);
    } catch {
      // Fallback - no related products shown
    }
  };

  const categoryInfo = ARTICLE_CATEGORIES.find(
    (c) => c.id === article.category
  );

  const relatedArticles = useMemo(
    () => getRelatedArticles(article, allArticles, 3),
    [article.id, allArticles]
  );

  const handleShare = async () => {
    const slug = article.slug || article.id;
    const url = `${WEB_BASE_URL}/blog/${slug}`;
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n${url}`,
        url, // iOS native share sheet uses this field
      });
      logArticleShare({ id: article.id, title: article.title });
    } catch {
      // User cancelled
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleRelatedArticle = (relatedArticle: Article) => {
    navigation.replace("ArticleDetail", { article: relatedArticle });
  };

  const heroPaddingTop = insets.top + 8;

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        barStyle="light-content"
        backgroundColor="transparent"
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Image ── */}
        <View style={styles.heroWrapper}>
          {article.imageUrl ? (
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.heroImage,
                {
                  backgroundColor: article.color,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <Ionicons
                name={article.icon as any}
                size={88}
                color="rgba(255,255,255,0.2)"
              />
            </View>
          )}

          {/* Gradient overlay — dark at bottom for text */}
          <View style={styles.heroGradient} />

          {/* Floating back button */}
          <TouchableOpacity
            style={[styles.heroBack, { top: heroPaddingTop }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </TouchableOpacity>

          {/* Floating share + like */}
          <View style={[styles.heroActionRow, { top: heroPaddingTop }]}>
            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroActionBtn} onPress={handleLike}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? colors.primary : colors.white}
              />
            </TouchableOpacity>
          </View>

          {/* Category badge + title at bottom */}
          <View style={styles.heroContent}>
            {categoryInfo && (
              <View
                style={[
                  styles.heroCatBadge,
                  { backgroundColor: article.color },
                ]}
              >
                <Ionicons
                  name={article.icon as any}
                  size={11}
                  color={colors.white}
                />
                <Text style={styles.heroCatText}>{categoryInfo.name}</Text>
              </View>
            )}
            <Text style={styles.heroTitle} numberOfLines={3}>
              {article.title}
            </Text>
          </View>
        </View>

        {/* Metadata Bar */}
        <View style={styles.metadataCard}>
          <View style={styles.metaItem}>
            <Ionicons
              name="person-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.metaText}>
              {article.author || "Love Date App"}
            </Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.metaText}>
              {article.readTime || 5} phút đọc
            </Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons
              name="eye-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.metaText}>{article.views || 0}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={14}
              color={isLiked ? colors.error : colors.textSecondary}
            />
            <Text style={styles.metaText}>{likeCount}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentCard}>
          <RenderHTML
            contentWidth={screenWidth - 72}
            source={{ html: article.content }}
            tagsStyles={htmlStyles(themeName)}
            baseStyle={{ fontFamily: "Manrope_400Regular" }}
            systemFonts={[
              "Manrope_400Regular",
              "Manrope_500Medium",
              "Manrope_600SemiBold",
              "Manrope_700Bold",
              "Manrope_800ExtraBold",
            ]}
          />
        </View>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="pricetags-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.sectionHeaderText}>Thẻ</Text>
            </View>
            <View style={styles.tagsWrap}>
              {article.tags.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tagPill,
                    {
                      backgroundColor: article.color + "15",
                      borderColor: article.color + "30",
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: article.color }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Related Products (Affiliate Funnel) */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bag-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionHeaderText}>Sản phẩm gợi ý</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {relatedProducts.map((product: AffiliateProduct) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="newspaper-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.sectionHeaderText}>Bài viết tương tự</Text>
            </View>
            {relatedArticles.map((relArticle) => {
              const relCat = ARTICLE_CATEGORIES.find(
                (c) => c.id === relArticle.category
              );
              return (
                <PressableCard
                  key={relArticle.id}
                  style={styles.relatedArticleCard}
                  onPress={() => handleRelatedArticle(relArticle)}
                >
                  {relArticle.imageUrl ? (
                    <Image
                      source={{ uri: relArticle.imageUrl }}
                      style={styles.relatedArticleImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.relatedArticleIcon,
                        { backgroundColor: relArticle.color + "20" },
                      ]}
                    >
                      <Ionicons
                        name={relArticle.icon as any}
                        size={22}
                        color={relArticle.color}
                      />
                    </View>
                  )}
                  <View style={styles.relatedArticleContent}>
                    <Text style={styles.relatedArticleTitle} numberOfLines={2}>
                      {relArticle.title}
                    </Text>
                    <View style={styles.relatedArticleMeta}>
                      {relCat && (
                        <Text
                          style={[
                            styles.relatedArticleCat,
                            { color: relArticle.color },
                          ]}
                        >
                          {relCat.name}
                        </Text>
                      )}
                      <Text style={styles.relatedArticleTime}>
                        {relArticle.readTime || 5} phút
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textLight}
                    style={{ marginRight: 12 }}
                  />
                </PressableCard>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },

  // ── Hero image ──────────────────────────────────────────────────────────────
  heroWrapper: {
    height: 260,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  heroBack: {
    position: "absolute",
    left: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroActionRow: {
    position: "absolute",
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  heroActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  heroCatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  heroCatText: {
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
    lineHeight: 27,
  },

  // Metadata
  metadataCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: -8,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "Manrope_500Medium",
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },

  // Content
  contentCard: {
    backgroundColor: colors.surface,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  // Tags
  tagsSection: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
  },

  // Related Sections
  relatedSection: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  horizontalScroll: {
    paddingRight: 16,
    gap: 0,
  },

  // Related Article Card
  relatedArticleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    overflow: "hidden",
  },
  relatedArticleImg: {
    width: 90,
    height: 72,
    flexShrink: 0,
  },
  relatedArticleIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  relatedArticleContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  relatedArticleTitle: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  relatedArticleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  relatedArticleCat: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
  },
  relatedArticleTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
}));
export default ArticleDetailScreen;
