import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { COLORS } from "@themes/colors";
import { Suggestion } from "../data/suggestions";
import { Article } from "../data/articles";
import {
  getArticles,
  trackArticleView,
  refreshArticles,
} from "../services/articleService";
import { databaseService } from "../services/database.service";
import { getTrendingProducts } from "../services/affiliateProductService";
import { AffiliateProduct } from "../types";
import { useLazySection } from "../hooks/useLazySection";
import { LoadingState } from "@components/atoms/LoadingState";
import HeroBanner from "../components/suggestions/HeroBanner";
import ArticlesSection from "../components/suggestions/ArticlesSection";
import ProductCard from "../components/suggestions/ProductCard";
// import ExperienceCard from "../components/suggestions/ExperienceCard"; // tạm ẩn
import OccasionCards from "../components/suggestions/OccasionCard";
import { useMasterData } from "../contexts/MasterDataContext";
// import BudgetFilter from "../components/suggestions/BudgetFilter"; // tạm ẩn
import SurveyModal from "../components/suggestions/SurveyModal";
import {
  logGiftSurveyStart,
  logGiftSurveyComplete,
} from "../services/analyticsService";
import ResultsModal from "../components/suggestions/ResultsModal";
import PressableCard from "@components/atoms/PressableCard";

const SuggestionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { occasions } = useMasterData();

  // Core state
  const [articles, setArticles] = useState<Article[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<AffiliateProduct[]>(
    []
  );
  // const [experiences, setExperiences] = useState<AffiliateProduct[]>([]); // tạm ẩn
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticleCategory, setSelectedArticleCategory] =
    useState<string>("all");
  const [productsError, setProductsError] = useState<string | null>(null);

  // Modal state
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultSuggestions, setResultSuggestions] = useState<Suggestion[]>([]);
  const [resultSurveyAnswers, setResultSurveyAnswers] = useState<
    Record<string, any>
  >({});

  // Lazy loading sections
  const showArticles = useLazySection(3);
  const showTrending = useLazySection(4);
  const showOccasions = useLazySection(5);
  // const showBudget = useLazySection(6); // hidden — budget filter tạm ẩn
  // const showExperiences = useLazySection(7); // hidden — tạm ẩn

  // Load data — small delay to let initial render paint, then fetch
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) loadData();
    }, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (route.params?.openSurvey) {
      setTimeout(() => setShowSurveyModal(true), 300);
    }
  }, [route.params?.openSurvey]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch all in parallel — single batch of state updates at the end
      const [articlesResult, trendingResult, readIdsResult] =
        await Promise.allSettled([
          getArticles(),
          getTrendingProducts(),
          databaseService.getReadArticleIds(),
        ]);

      if (articlesResult.status === "fulfilled") {
        const readSet = new Set(
          readIdsResult.status === "fulfilled" ? readIdsResult.value : []
        );
        setArticles(articlesResult.value.filter((a) => !readSet.has(a.id)));
      }

      if (trendingResult.status === "fulfilled") {
        setTrendingProducts(trendingResult.value);
      } else {
        setProductsError("Không thể tải sản phẩm. Kiểm tra kết nối mạng.");
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // const loadExperiences = async () => { // tạm ẩn
  //   try {
  //     const fetched = await getExperienceProducts();
  //     setExperiences(fetched);
  //   } catch (error) {
  //     console.error("Error loading experiences:", error);
  //   }
  // };

  // Handlers with useCallback
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setProductsError(null);
      const [articlesResult, trendingResult, readIds] =
        await Promise.allSettled([
          refreshArticles(),
          getTrendingProducts(),
          databaseService.getReadArticleIds(),
        ]);
      if (articlesResult.status === "fulfilled") {
        const readSet = new Set(
          readIds.status === "fulfilled" ? readIds.value : []
        );
        setArticles(articlesResult.value.filter((a) => !readSet.has(a.id)));
      }
      if (trendingResult.status === "fulfilled") {
        setTrendingProducts(trendingResult.value);
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
      databaseService.markArticleRead(article.id).catch(console.error);
    },
    [navigation]
  );

  const handleOccasionPress = useCallback(
    (occasionId: string) => {
      const occasion = occasions.find((o) => o.id === occasionId);
      navigation.navigate("OccasionProducts", {
        occasionId,
        occasionName: occasion?.name ?? occasionId,
        occasionColor: occasion?.color,
      });
    },
    [occasions, navigation]
  );

  const handleStartSurvey = useCallback(() => {
    logGiftSurveyStart();
    setShowSurveyModal(true);
  }, []);

  const handleSurveyComplete = useCallback(
    (suggestions: Suggestion[], answers: Record<string, any>) => {
      logGiftSurveyComplete({
        occasion: answers.occasion,
        budget: answers.budget,
      });
      setResultSuggestions(suggestions);
      setResultSurveyAnswers(answers);
      setShowSurveyModal(false);
      setTimeout(() => {
        setShowResultsModal(true);
      }, 300);
    },
    []
  );

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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 10 },
        ]}
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

        {/* Section 2: Tools */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trắc nghiệm & Khám phá</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>3 công cụ</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolCards}
            removeClippedSubviews={false}
          >
            {/* Personality Survey card */}
            <PressableCard
              style={[styles.toolCard, { backgroundColor: "#7C3AED" }]}
              onPress={() => navigation.navigate("PersonalitySurvey")}
            >
              <View style={styles.toolTop}>
                <View style={styles.toolHeader}>
                  <View style={styles.toolIconWrap}>
                    <Ionicons
                      name="person-circle-outline"
                      size={32}
                      color="rgba(255,255,255,0.9)"
                    />
                  </View>
                  <View style={styles.toolPills}>
                    <View style={styles.toolPill}>
                      <Ionicons
                        name="help-circle-outline"
                        size={10}
                        color="rgba(255,255,255,0.9)"
                      />
                      <Text style={styles.toolPillText}>8 câu</Text>
                    </View>
                    <View style={styles.toolPill}>
                      <Ionicons
                        name="time-outline"
                        size={10}
                        color="rgba(255,255,255,0.9)"
                      />
                      <Text style={styles.toolPillText}>3 phút</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.toolTitle}>Khảo sát tính cách</Text>
                <Text style={styles.toolDesc}>
                  Khám phá phong cách yêu thương của bạn
                </Text>
              </View>
              <View style={styles.toolCta}>
                <Text style={styles.toolCtaText}>Khám phá</Text>
                <Ionicons name="arrow-forward" size={13} color={COLORS.white} />
              </View>
            </PressableCard>

            {/* MBTI card */}
            <PressableCard
              style={[styles.toolCard, { backgroundColor: "#1A9E6E" }]}
              onPress={() => navigation.navigate("MBTISurvey")}
            >
              <View style={styles.toolTop}>
                <View style={styles.toolHeader}>
                  <View style={styles.toolIconWrap}>
                    <Ionicons
                      name="people"
                      size={32}
                      color="rgba(255,255,255,0.9)"
                    />
                  </View>
                  <View style={styles.toolPills}>
                    <View style={styles.toolPill}>
                      <Ionicons
                        name="help-circle-outline"
                        size={10}
                        color="rgba(255,255,255,0.9)"
                      />
                      <Text style={styles.toolPillText}>40 câu</Text>
                    </View>
                    <View style={styles.toolPill}>
                      <Ionicons
                        name="time-outline"
                        size={10}
                        color="rgba(255,255,255,0.9)"
                      />
                      <Text style={styles.toolPillText}>10 phút</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.toolTitle}>Trắc nghiệm MBTI</Text>
                <Text style={styles.toolDesc}>
                  Khám phá tính cách và sự tương hợp
                </Text>
              </View>
              <View style={styles.toolCta}>
                <Text style={styles.toolCtaText}>Bắt đầu</Text>
                <Ionicons name="arrow-forward" size={13} color={COLORS.white} />
              </View>
            </PressableCard>

            {/* AI Activity Suggestion card */}
            <PressableCard
              style={[styles.toolCard, { backgroundColor: COLORS.secondary }]}
              onPress={() => navigation.navigate("ActivitySuggestions", {})}
            >
              <View style={styles.toolTop}>
                <View style={styles.toolHeader}>
                  <View style={styles.toolIconWrap}>
                    <Ionicons
                      name="map-outline"
                      size={32}
                      color="rgba(255,255,255,0.9)"
                    />
                  </View>
                  <View style={styles.toolPills}>
                    <View style={styles.toolPill}>
                      <Ionicons
                        name="restaurant-outline"
                        size={10}
                        color="rgba(255,255,255,0.9)"
                      />
                      <Text style={styles.toolPillText}>Ẩm thực</Text>
                    </View>
                    <View style={styles.toolPill}>
                      <Ionicons
                        name="leaf-outline"
                        size={10}
                        color="rgba(255,255,255,0.9)"
                      />
                      <Text style={styles.toolPillText}>Spa</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.toolTitle}>Gợi ý hoạt động</Text>
                <Text style={styles.toolDesc}>
                  Nhà hàng, spa, trải nghiệm hẹn hò lãng mạn
                </Text>
              </View>
              <View style={styles.toolCta}>
                <Text style={styles.toolCtaText}>Khám phá</Text>
                <Ionicons name="arrow-forward" size={13} color={COLORS.white} />
              </View>
            </PressableCard>
          </ScrollView>
        </View>

        {/* Section 4: Articles */}
        {showArticles ? (
          <ArticlesSection
            articles={articles}
            loading={loading}
            selectedCategory={selectedArticleCategory}
            onCategoryChange={handleArticleCategoryChange}
            onArticlePress={handleArticlePress}
            onViewAll={() => navigation.navigate("AllArticles")}
          />
        ) : (
          <View style={styles.section}>
            <LoadingState
              variant="skeleton"
              skeletonType="card"
              skeletonCount={2}
            />
          </View>
        )}

        {/* Section 5: Gift by Occasion */}
        {showOccasions ? (
          <OccasionCards onOccasionPress={handleOccasionPress} />
        ) : (
          <View style={styles.section}>
            <LoadingState
              variant="skeleton"
              skeletonType="list"
              skeletonCount={2}
            />
          </View>
        )}

        {/* Section 6: Trending Products */}
        {showTrending ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh sách quà tặng</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("AllProducts")}
              >
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {productsError ? (
              <View style={styles.offlineBanner}>
                <Ionicons
                  name="wifi-outline"
                  size={20}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.offlineBannerText}>{productsError}</Text>
              </View>
            ) : trendingProducts.length === 0 ? (
              <View style={styles.offlineBanner}>
                <Ionicons
                  name="gift-outline"
                  size={20}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.offlineBannerText}>
                  Chưa có sản phẩm nào
                </Text>
              </View>
            ) : (
              <View style={styles.verticalProductList}>
                {trendingProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="vertical"
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <LoadingState
              variant="skeleton"
              skeletonType="card"
              skeletonCount={2}
            />
          </View>
        )}

        {/* Section 7: Gift by Budget — tạm ẩn */}

        {/* Section 8: Experience Packages — tạm ẩn */}

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
        products={trendingProducts}
        surveyAnswers={resultSurveyAnswers}
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
    paddingTop: 0,
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

  // Tool Cards — horizontal scroll, fixed-width cards
  toolCards: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingRight: 24,
    gap: 12,
  },
  sectionBadge: {
    backgroundColor: COLORS.primary + "18",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  toolCard: {
    width: Math.round((SCREEN_WIDTH - 32 - 12) * 0.45),
    borderRadius: 18,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  toolTop: {
    marginBottom: 14,
  },
  toolHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  toolIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
    lineHeight: 21,
    minHeight: 42,
    marginBottom: 6,
  },
  toolDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 15,
    flexShrink: 1,
  },
  toolPills: {
    flexDirection: "column",
    gap: 5,
    alignItems: "flex-end",
  },
  toolPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  toolPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
  },
  toolCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 10,
    paddingVertical: 9,
  },
  toolCtaText: {
    fontSize: 13,
    fontWeight: "700",
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
  verticalProductList: {
    paddingHorizontal: 16,
  },
});

export default SuggestionsScreen;
