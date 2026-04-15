import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AiIcon from "@components/atoms/AiIcon";
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
import { LoadingState } from "@components/atoms/LoadingState";
import HeroBanner from "../components/suggestions/HeroBanner";
import ArticlesSection from "../components/suggestions/ArticlesSection";
import ProductCard from "../components/suggestions/ProductCard";
import { makeStyles } from "@utils/makeStyles";
import { useColors } from "@contexts/ThemeContext";
// import ExperienceCard from "../components/suggestions/ExperienceCard"; // tạm ẩn
// import OccasionCards from "../components/suggestions/OccasionCard"; // tạm ẩn
import { useMasterData } from "../contexts/MasterDataContext";
// import BudgetFilter from "../components/suggestions/BudgetFilter"; // tạm ẩn
import SurveyModal from "../components/suggestions/SurveyModal";
import QuickSurveyModal from "../components/suggestions/QuickSurveyModal";
import {
  logGiftSurveyStart,
  logGiftSurveyComplete,
} from "../services/analyticsService";
import ResultsModal from "../components/suggestions/ResultsModal";
import PressableCard from "@components/atoms/PressableCard";
import AiViewAllBtn from "@components/atoms/AiViewAllBtn";

const TOOL_ITEMS = [
  {
    id: "personality",
    icon: "person-circle-outline" as const,
    title: "Khảo sát tính cách",
    desc: "Khám phá phong cách yêu thương của bạn",
    pills: ["8 câu", "3 phút"],
    route: "PersonalitySurvey",
    routeParams: {},
    isAI: true,
  },
  {
    id: "mbti",
    icon: "people" as const,
    title: "Trắc nghiệm MBTI",
    desc: "Khám phá 16 loại tính cách & sự tương hợp",
    pills: ["40 câu", "10 phút"],
    route: "MBTISurvey",
    routeParams: {},
    isAI: false,
  },
  {
    id: "activities",
    icon: "map-outline" as const,
    title: "Gợi ý hoạt động",
    desc: "Nhà hàng, spa, trải nghiệm hẹn hò lãng mạn",
    pills: ["Ẩm thực", "Spa"],
    route: "ActivitySuggestions",
    routeParams: {},
    isAI: true,
  },
];

const ToolCardsSection: React.FC<{ navigation: any }> = React.memo(
  ({ navigation }) => {
    const styles = useStyles();
    const colors = useColors();

    const toolColors = [colors.primary, colors.success, colors.secondary];

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trắc nghiệm & Khám phá</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>3 công cụ</Text>
          </View>
        </View>

        <View style={styles.toolList}>
          {TOOL_ITEMS.map((item, idx) => {
            const color = toolColors[idx];
            return (
              <PressableCard
                key={item.id}
                style={styles.toolRow}
                onPress={() =>
                  navigation.navigate(item.route, item.routeParams)
                }
              >
                {/* Colored icon block */}
                <View
                  style={[
                    styles.toolRowIcon,
                    { backgroundColor: color + "18" },
                  ]}
                >
                  <Ionicons name={item.icon} size={26} color={color} />
                </View>

                {/* Text */}
                <View style={styles.toolRowContent}>
                  <View style={styles.toolRowTitleRow}>
                    <Text style={styles.toolRowTitle}>{item.title}</Text>
                    {item.isAI && (
                      <View style={styles.aiBadge}>
                        <AiIcon size={12} primaryColor={colors.aiPrimary} secondaryColor={colors.aiSecondary} />
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.toolRowDesc} numberOfLines={1}>
                    {item.desc}
                  </Text>
                  <View style={styles.toolRowPills}>
                    {item.pills.map((p) => (
                      <View
                        key={p}
                        style={[
                          styles.toolRowPill,
                          { backgroundColor: color + "12" },
                        ]}
                      >
                        <Text style={[styles.toolRowPillText, { color }]}>
                          {p}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Arrow */}
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textLight}
                />
              </PressableCard>
            );
          })}
        </View>
      </View>
    );
  }
);


const SuggestionsScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();

  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  useMasterData();

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
  const [showQuickSurveyModal, setShowQuickSurveyModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultSuggestions, setResultSuggestions] = useState<Suggestion[]>([]);
  const [resultSurveyAnswers, setResultSurveyAnswers] = useState<
    Record<string, any>
  >({});

  // Removed useLazySection — cascading setTimeout re-renders caused jank

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

  const handleStartQuickSurvey = useCallback(() => {
    logGiftSurveyStart();
    setShowQuickSurveyModal(true);
  }, []);

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
      setShowResultsModal(true);
      setTimeout(() => setShowSurveyModal(false), 400);
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
        removeClippedSubviews={true}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 10 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Section 1: Hero Banner */}
        <HeroBanner
          onStartSurvey={handleStartQuickSurvey}
          onStartDetailedSurvey={handleStartSurvey}
        />

        {/* Section 2: Tools */}
        <ToolCardsSection navigation={navigation} />

        {/* Section 4: Articles */}
        <ArticlesSection
          articles={articles}
          loading={loading}
          selectedCategory={selectedArticleCategory}
          onCategoryChange={handleArticleCategoryChange}
          onArticlePress={handleArticlePress}
          onViewAll={() => navigation.navigate("AllArticles")}
        />

        {/* Section 5: Gift by Occasion — tạm ẩn */}
        {/* <OccasionCards onOccasionPress={handleOccasionPress} /> */}

        {/* Section 6: Trending Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Xu hướng quà tặng</Text>
            <AiViewAllBtn
              onPress={() =>
                navigation.navigate("AllProducts", { initialAiMode: true })
              }
            />
          </View>
          {loading ? (
            <LoadingState
              variant="skeleton"
              skeletonType="card"
              skeletonCount={2}
            />
          ) : productsError ? (
            <View style={styles.offlineBanner}>
              <Ionicons
                name="wifi-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.offlineBannerText}>{productsError}</Text>
            </View>
          ) : trendingProducts.length === 0 ? (
            <View style={styles.offlineBanner}>
              <Ionicons
                name="gift-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.offlineBannerText}>Chưa có sản phẩm nào</Text>
            </View>
          ) : (
            <View style={styles.verticalProductList}>
              {trendingProducts.slice(0, 6).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="vertical"
                />
              ))}
            </View>
          )}
        </View>

        {/* Section 7: Gift by Budget — tạm ẩn */}

        {/* Section 8: Experience Packages — tạm ẩn */}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals — lazy-mounted to avoid heavy render when hidden */}
      {showQuickSurveyModal && (
        <QuickSurveyModal
          visible={showQuickSurveyModal}
          onClose={() => setShowQuickSurveyModal(false)}
          onComplete={(suggestions, answers) => {
            setResultSuggestions(suggestions);
            setResultSurveyAnswers(answers);
            setShowResultsModal(true);
            setTimeout(() => setShowQuickSurveyModal(false), 400);
          }}
        />
      )}

      {showSurveyModal && (
        <SurveyModal
          visible={showSurveyModal}
          onClose={() => setShowSurveyModal(false)}
          onComplete={handleSurveyComplete}
        />
      )}

      {showResultsModal && (
        <ResultsModal
          visible={showResultsModal}
          suggestions={resultSuggestions}
          products={trendingProducts}
          surveyAnswers={resultSurveyAnswers}
          onClose={() => setShowResultsModal(false)}
          onRetake={handleRetakeSurvey}
        />
      )}
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  sectionTitlePadded: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
  },

  // Tool Cards — vertical stacked list
  toolList: {
    marginHorizontal: 16,
    gap: 10,
  },
  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 14,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  toolRowIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  toolRowContent: {
    flex: 1,
    gap: 3,
  },
  toolRowTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toolRowTitle: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.aiLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 10,
    fontFamily: "Manrope_700Bold",
    color: colors.aiPrimary,
  },
  toolRowDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  toolRowPills: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  toolRowPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  toolRowPillText: {
    fontSize: 11,
    fontFamily: "Manrope_600SemiBold",
  },
  sectionBadge: {
    backgroundColor: colors.primary + "18",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    color: colors.primary,
  },

  // Offline / empty state banner
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offlineBannerText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  verticalProductList: {
    paddingHorizontal: 16,
  },
}));
export default SuggestionsScreen;
