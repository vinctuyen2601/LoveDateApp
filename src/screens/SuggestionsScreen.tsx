import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { COLORS } from '@themes/colors';
import { Suggestion } from "../data/suggestions";
import { Article } from "../data/articles";
import {
  getArticles,
  trackArticleView,
  refreshArticles,
} from "../services/articleService";
import { EXPERIENCE_PACKAGES } from "../data/affiliateProducts";
import {
  getProducts,
} from "../services/affiliateProductService";
import { AffiliateProduct, AffiliateCategory } from "../types";
import { useLazySection } from "../hooks/useLazySection";
import { LoadingState } from "@components/atoms/LoadingState";
import HeroBanner from "../components/suggestions/HeroBanner";
import ServiceCategories from "../components/suggestions/ServiceCategories";
import ArticlesSection from "../components/suggestions/ArticlesSection";
import ProductCard from "../components/suggestions/ProductCard";
import OccasionCards from "../components/suggestions/OccasionCard";
import BudgetFilter from "../components/suggestions/BudgetFilter";
import SurveyModal from "../components/suggestions/SurveyModal";
import ResultsModal from "../components/suggestions/ResultsModal";
import PressableCard from "@components/atoms/PressableCard";

const SuggestionsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  // Core state
  const [articles, setArticles] = useState<Article[]>([]);
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticleCategory, setSelectedArticleCategory] = useState<string>("all");
  const [productsError, setProductsError] = useState<string | null>(null);

  // Modal state
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultSuggestions, setResultSuggestions] = useState<Suggestion[]>([]);

  // Lazy loading sections
  const showArticles = useLazySection(3);
  const showTrending = useLazySection(4);
  const showOccasions = useLazySection(5);
  const showBudget = useLazySection(6);
  const showExperiences = useLazySection(7);

  // Memoized computed values
  const trendingProducts = useMemo(
    () =>
      products
        .filter((p) => p.isPopular)
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, 8),
    [products]
  );

  // Load data
  useEffect(() => {
    loadArticles();
    loadProducts();
  }, []);

  useEffect(() => {
    if (route.params?.openSurvey) {
      setTimeout(() => setShowSurveyModal(true), 300);
    }
  }, [route.params?.openSurvey]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const fetchedArticles = await getArticles();
      setArticles(fetchedArticles);
    } catch (error) {
      console.error("Error loading articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsError(null);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error loading products:", error);
      setProductsError("Không thể tải sản phẩm. Kiểm tra kết nối mạng.");
    }
  };

  // Handlers with useCallback
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setProductsError(null);
      const [articlesResult, productsResult] = await Promise.allSettled([
        refreshArticles(),
        getProducts(),
      ]);
      if (articlesResult.status === "fulfilled") setArticles(articlesResult.value);
      if (productsResult.status === "fulfilled") {
        setProducts(productsResult.value);
      } else {
        setProductsError("Không thể tải sản phẩm. Kiểm tra kết nối mạng.");
      }
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleArticlePress = useCallback(
    (article: Article) => {
      navigation.navigate("ArticleDetail", { article });
      trackArticleView(article.id);
    },
    [navigation]
  );

  const handleCategoryPress = useCallback((category: AffiliateCategory) => {
    // TODO: Navigate to filtered product list or scroll to section
    console.log("Category pressed:", category);
  }, []);

  const handleOccasionPress = useCallback((occasionId: string) => {
    // TODO: Show filtered products modal
    console.log("Occasion pressed:", occasionId);
  }, []);

  const handleExperiencePress = useCallback((affiliateUrl: string) => {
    if (affiliateUrl && affiliateUrl !== "#") {
      Linking.openURL(affiliateUrl);
    }
  }, []);

  const handleStartSurvey = useCallback(() => {
    setShowSurveyModal(true);
  }, []);

  const handleSurveyComplete = useCallback((suggestions: Suggestion[]) => {
    setResultSuggestions(suggestions);
    setShowSurveyModal(false);
    setTimeout(() => {
      setShowResultsModal(true);
    }, 300);
  }, []);

  const handleRetakeSurvey = useCallback(() => {
    setShowResultsModal(false);
    setTimeout(() => setShowSurveyModal(true), 300);
  }, []);

  const handleArticleCategoryChange = useCallback((category: string) => {
    setSelectedArticleCategory(category);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Section 1: Hero Banner */}
        <HeroBanner onStartSurvey={handleStartSurvey} />

        {/* Section 2: Service Categories */}
        <ServiceCategories onCategoryPress={handleCategoryPress} />

        {/* Section 3: Survey + MBTI Compact */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitlePadded]}>
            Công cụ cá nhân hóa
          </Text>
          <View style={styles.toolCards}>
            <PressableCard style={styles.toolCard} onPress={handleStartSurvey}>
              <View style={styles.toolCardLeft}>
                <Ionicons name="heart-circle" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.toolCardContent}>
                <Text style={styles.toolCardTitle}>Khảo sát tính cách</Text>
                <Text style={styles.toolCardSub}>12 câu hỏi • 2 phút</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </PressableCard>

            <PressableCard
              style={[styles.toolCard, styles.toolCardMbti]}
              onPress={() => navigation.navigate("MBTISurvey")}
            >
              <View style={styles.toolCardLeft}>
                <Ionicons name="people" size={28} color={COLORS.success} />
              </View>
              <View style={styles.toolCardContent}>
                <Text style={styles.toolCardTitle}>Trắc nghiệm MBTI</Text>
                <Text style={styles.toolCardSub}>40 câu hỏi • 10 phút</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </PressableCard>
          </View>
        </View>

        {/* Section 4: Articles */}
        {showArticles ? (
          <ArticlesSection
            articles={articles}
            loading={loading}
            selectedCategory={selectedArticleCategory}
            onCategoryChange={handleArticleCategoryChange}
            onArticlePress={handleArticlePress}
          />
        ) : (
          <View style={styles.section}>
            <LoadingState variant="skeleton" skeletonType="card" skeletonCount={2} />
          </View>
        )}

        {/* Section 5: Trending Products */}
        {showTrending ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Xu hướng quà tặng</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {productsError ? (
              <View style={styles.offlineBanner}>
                <Ionicons name="wifi-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.offlineBannerText}>{productsError}</Text>
              </View>
            ) : trendingProducts.length === 0 ? (
              <View style={styles.offlineBanner}>
                <Ionicons name="gift-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.offlineBannerText}>Chưa có sản phẩm nào</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {trendingProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <LoadingState variant="skeleton" skeletonType="card" skeletonCount={2} />
          </View>
        )}

        {/* Section 6: Gift by Occasion */}
        {showOccasions ? (
          <OccasionCards onOccasionPress={handleOccasionPress} />
        ) : (
          <View style={styles.section}>
            <LoadingState variant="skeleton" skeletonType="list" skeletonCount={2} />
          </View>
        )}

        {/* Section 7: Gift by Budget */}
        {showBudget ? (
          <BudgetFilter />
        ) : (
          <View style={styles.section}>
            <LoadingState variant="skeleton" skeletonType="list" skeletonCount={2} />
          </View>
        )}

        {/* Section 8: Experience Packages */}
        {showExperiences ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trải nghiệm cho cặp đôi</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {EXPERIENCE_PACKAGES.map((exp) => (
                <PressableCard
                  key={exp.id}
                  style={[styles.experienceCard, { backgroundColor: exp.color }]}
                  onPress={() => handleExperiencePress(exp.affiliateUrl)}
                >
                  <Ionicons name={exp.icon as any} size={32} color={COLORS.white} />
                  <Text style={styles.experienceName}>{exp.name}</Text>
                  <Text style={styles.experienceDesc} numberOfLines={2}>
                    {exp.description}
                  </Text>
                  <View style={styles.experienceBottom}>
                    <Text style={styles.experiencePrice}>{exp.priceFrom}</Text>
                    <View style={styles.experienceCta}>
                      <Text style={styles.experienceCtaText}>Đặt ngay</Text>
                      <Ionicons name="arrow-forward" size={12} color={COLORS.white} />
                    </View>
                  </View>
                </PressableCard>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.section}>
            <LoadingState variant="skeleton" skeletonType="card" skeletonCount={2} />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <SurveyModal
        visible={showSurveyModal}
        onClose={() => setShowSurveyModal(false)}
        onComplete={handleSurveyComplete}
      />

      <ResultsModal
        visible={showResultsModal}
        suggestions={resultSuggestions}
        products={products}
        onClose={() => setShowResultsModal(false)}
        onRetake={handleRetakeSurvey}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 10,
  },
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
  sectionTitlePadded: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
  },

  // Tool Cards (Survey + MBTI)
  toolCards: {
    paddingHorizontal: 16,
    gap: 10,
  },
  toolCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  toolCardMbti: {
    borderLeftColor: COLORS.success,
  },
  toolCardLeft: {
    marginRight: 12,
  },
  toolCardContent: {
    flex: 1,
  },
  toolCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  toolCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Experience Cards
  experienceCard: {
    width: 220,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    justifyContent: "space-between",
    minHeight: 170,
  },
  experienceName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    marginTop: 8,
  },
  experienceDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 17,
    marginTop: 4,
  },
  experienceBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  experiencePrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  experienceCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  experienceCtaText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },

  // Offline / empty state banner
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  offlineBannerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
});

export default SuggestionsScreen;
