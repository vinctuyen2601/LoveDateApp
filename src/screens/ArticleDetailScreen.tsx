import React, { useState, useMemo, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import RenderHTML from 'react-native-render-html';
import { COLORS } from '@themes/colors';
import { htmlStyles } from '@styles/htmlStyles';
import { Article, getRelatedArticles, ARTICLE_CATEGORIES } from '../data/articles';
import { getRelatedProductsForArticleAsync } from '../services/affiliateProductService';
import { getArticles } from '../services/articleService';
import { AffiliateProduct } from '../types';
import ProductCard from '../components/suggestions/ProductCard';
import PressableCard from '@components/atoms/PressableCard';

const { width: screenWidth } = Dimensions.get('window');

const ArticleDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { article } = route.params as { article: Article };

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes || 0);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<AffiliateProduct[]>([]);

  useEffect(() => {
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

  const categoryInfo = ARTICLE_CATEGORIES.find((c) => c.id === article.category);

  const relatedArticles = useMemo(
    () => getRelatedArticles(article, allArticles, 3),
    [article.id, allArticles]
  );

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${article.title} - Love Date App`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleRelatedArticle = (relatedArticle: Article) => {
    navigation.replace('ArticleDetail', { article: relatedArticle });
  };

  const heroPaddingTop = insets.top + 8;

  return (
    <View style={styles.container}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ── Hero Image ── */}
        <View style={styles.heroWrapper}>
          {article.imageUrl ? (
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: article.color, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name={article.icon as any} size={88} color="rgba(255,255,255,0.2)" />
            </View>
          )}

          {/* Gradient overlay — dark at bottom for text */}
          <View style={styles.heroGradient} />

          {/* Floating back button */}
          <TouchableOpacity
            style={[styles.heroBack, { top: heroPaddingTop }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.white} />
          </TouchableOpacity>

          {/* Floating share + like */}
          <View style={[styles.heroActionRow, { top: heroPaddingTop }]}>
            <TouchableOpacity style={styles.heroActionBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroActionBtn} onPress={handleLike}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? '#FF6B6B' : COLORS.white}
              />
            </TouchableOpacity>
          </View>

          {/* Category badge + title at bottom */}
          <View style={styles.heroContent}>
            {categoryInfo && (
              <View style={[styles.heroCatBadge, { backgroundColor: article.color }]}>
                <Ionicons name={article.icon as any} size={11} color={COLORS.white} />
                <Text style={styles.heroCatText}>{categoryInfo.name}</Text>
              </View>
            )}
            <Text style={styles.heroTitle} numberOfLines={3}>{article.title}</Text>
          </View>
        </View>

        {/* Metadata Bar */}
        <View style={styles.metadataCard}>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{article.author || 'Love Date App'}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{article.readTime || 5} phút đọc</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{article.views || 0}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={14}
              color={isLiked ? COLORS.error : COLORS.textSecondary}
            />
            <Text style={styles.metaText}>{likeCount}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentCard}>
          <RenderHTML
            contentWidth={screenWidth - 72}
            source={{ html: article.content }}
            tagsStyles={htmlStyles}
          />
        </View>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pricetags-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.sectionHeaderText}>Thẻ</Text>
            </View>
            <View style={styles.tagsWrap}>
              {article.tags.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tagPill,
                    {
                      backgroundColor: article.color + '15',
                      borderColor: article.color + '30',
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: article.color }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Related Products (Affiliate Funnel) */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bag-outline" size={18} color={COLORS.primary} />
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
              <Ionicons name="newspaper-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionHeaderText}>Bài viết tương tự</Text>
            </View>
            {relatedArticles.map((relArticle) => {
              const relCat = ARTICLE_CATEGORIES.find((c) => c.id === relArticle.category);
              return (
                <PressableCard
                  key={relArticle.id}
                  style={styles.relatedArticleCard}
                  onPress={() => handleRelatedArticle(relArticle)}
                >
                  <View
                    style={[
                      styles.relatedArticleIcon,
                      { backgroundColor: relArticle.color + '20' },
                    ]}
                  >
                    <Ionicons
                      name={relArticle.icon as any}
                      size={22}
                      color={relArticle.color}
                    />
                  </View>
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
                    color={COLORS.textLight}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },

  // ── Hero image ──────────────────────────────────────────────────────────────
  heroWrapper: {
    height: 260,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  heroBack: {
    position: 'absolute',
    left: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionRow: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  heroActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  heroCatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  heroCatText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 27,
  },

  // Metadata
  metadataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -8,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },

  // Content
  contentCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 1,
    shadowColor: COLORS.shadow,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  relatedArticleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  relatedArticleContent: {
    flex: 1,
    marginRight: 8,
  },
  relatedArticleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  relatedArticleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  relatedArticleCat: {
    fontSize: 12,
    fontWeight: '600',
  },
  relatedArticleTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default ArticleDetailScreen;
