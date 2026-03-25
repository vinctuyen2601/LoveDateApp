import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
  Linking,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import RenderHTML from "react-native-render-html";
import { AffiliateProduct } from "../types";
import { COLORS } from "@themes/colors";
import { htmlStyles } from "../styles/htmlStyles";
import { formatPrice, SERVICE_CATEGORIES } from "../data/affiliateProducts";
import { useMasterData } from "../contexts/MasterDataContext";
import {
  trackProductView,
  trackAffiliateClick,
  getProductsByCategory,
} from "../services/affiliateProductService";
import { logProductView, logProductClick } from "../services/analyticsService";
import ProductCard from "../components/suggestions/ProductCard";
import { makeStyles } from "@utils/makeStyles";
import { useColors, useTheme } from "@contexts/ThemeContext";

const { width: screenWidth } = Dimensions.get("window");
const PAGE_SIZE = 8;

const ProductDetailScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();
  const { themeName } = useTheme();

  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { product } = route.params as { product: AffiliateProduct };

  const [similarProducts, setSimilarProducts] = useState<AffiliateProduct[]>(
    []
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { occasions } = useMasterData();

  const categoryInfo = SERVICE_CATEGORIES.find(
    (c) => c.id === product.category
  );

  const numPrice = Number(product.price) || 0;
  const numOriginal = Number(product.originalPrice) || 0;

  const discountPercent =
    numOriginal > 0 && numPrice > 0 && numPrice < numOriginal
      ? Math.round((1 - numPrice / numOriginal) * 100)
      : 0;

  const savings =
    numOriginal > 0 && numPrice > 0 && numPrice < numOriginal
      ? numOriginal - numPrice
      : 0;

  useEffect(() => {
    // Track view on mount (fire-and-forget)
    trackProductView(product.id);
    logProductView({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price != null ? Number(product.price) : undefined,
    });

    // Load similar products async
    const loadSimilar = async () => {
      try {
        const categoryProducts = await getProductsByCategory(product.category);
        setSimilarProducts(categoryProducts.filter((p) => p.id !== product.id));
      } catch {
        // Fallback - no similar products shown
      }
    };
    loadSimilar();
  }, [product.id, product.category]);

  const productOccasions = useMemo(() => {
    if (!product.occasion || product.occasion.length === 0) return [];
    return occasions.filter((o) => product.occasion!.includes(o.id));
  }, [product.occasion, occasions]);

  const handleBuy = () => {
    const url = product.affiliateUrl;
    if (!url || url === "#") return;
    trackAffiliateClick(product.id);
    logProductClick({ id: product.id, name: product.name, affiliateUrl: url });
    if (Platform.OS === "web") {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      Linking.openURL(url);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${product.name} - ${
          product.price ? formatPrice(product.price) : product.priceRange
        } | Ngày yêu thương`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - contentOffset.y - layoutMeasurement.height;
      if (
        distanceFromBottom < 200 &&
        !isLoadingMore &&
        visibleCount < similarProducts.length
      ) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setVisibleCount((prev) => prev + PAGE_SIZE);
          setIsLoadingMore(false);
        }, 300);
      }
    },
    [isLoadingMore, visibleCount, similarProducts.length]
  );

  // Render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={
            i <= Math.floor(rating)
              ? "star"
              : i - 0.5 <= rating
              ? "star-half"
              : "star-outline"
          }
          size={18}
          color="#FFB300"
        />
      );
    }
    return stars;
  };

  const isDisabled = !product.affiliateUrl || product.affiliateUrl === "#";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>

        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        {product.galleryUrls && product.galleryUrls.length > 0 ? (
          <View style={styles.galleryContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.galleryScroll}
            >
              {product.galleryUrls.filter(Boolean).map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            <View style={styles.galleryDots}>
              {product.galleryUrls.map((_, index) => (
                <View key={index} style={styles.dot} />
              ))}
            </View>
            {discountPercent > 0 && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>-{discountPercent}%</Text>
              </View>
            )}
          </View>
        ) : product.imageUrl ? (
          <View style={styles.heroImageContainer}>
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {discountPercent > 0 && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>-{discountPercent}%</Text>
              </View>
            )}
          </View>
        ) : (
          <LinearGradient
            colors={[product.color, product.color + "CC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroIconCircle}>
              <Ionicons
                name={product.icon as any}
                size={64}
                color={colors.white}
              />
            </View>
            {discountPercent > 0 && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>-{discountPercent}%</Text>
              </View>
            )}
          </LinearGradient>
        )}

        {/* Product Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.subcategoryLabel}>
            {categoryInfo?.name || product.category} • {product.subcategory}
          </Text>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price Section */}
          <View style={styles.priceSection}>
            {product.price ? (
              <Text style={styles.currentPrice}>
                {formatPrice(product.price)}
              </Text>
            ) : (
              <Text style={styles.currentPrice}>{product.priceRange}</Text>
            )}
            {discountPercent > 0 && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.originalPrice!)}
              </Text>
            )}
          </View>
          {savings > 0 && (
            <View style={styles.savingsBadge}>
              <Ionicons name="pricetag" size={13} color={colors.success} />
              <Text style={styles.savingsText}>
                Tiết kiệm {formatPrice(savings)}
              </Text>
            </View>
          )}

          {/* Rating */}
          <View style={styles.ratingSection}>
            <View style={styles.starsRow}>
              {renderStars(Number(product.rating))}
            </View>
            <Text style={styles.ratingNumber}>
              {Number(product.rating).toFixed(1)}
            </Text>
            <Text style={styles.reviewCount}>
              ({product.reviewCount} đánh giá)
            </Text>
          </View>
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.cardHeaderText}>Mô tả</Text>
          </View>
          <RenderHTML
            contentWidth={screenWidth - 64}
            source={{ html: product.description }}
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

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="list-outline" size={20} color={colors.primary} />
            <Text style={styles.cardHeaderText}>Thông tin chi tiết</Text>
          </View>

          <View style={styles.detailRow}>
            <View
              style={[
                styles.detailIconWrap,
                {
                  backgroundColor:
                    (categoryInfo?.color || colors.primary) + "15",
                },
              ]}
            >
              <Ionicons
                name={(categoryInfo?.icon || "pricetag-outline") as any}
                size={18}
                color={categoryInfo?.color || colors.primary}
              />
            </View>
            <Text style={styles.detailLabel}>Danh mục</Text>
            <Text style={styles.detailValue}>
              {categoryInfo?.name || product.category}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View
              style={[
                styles.detailIconWrap,
                { backgroundColor: colors.success + "15" },
              ]}
            >
              <Ionicons name="cash-outline" size={18} color={colors.success} />
            </View>
            <Text style={styles.detailLabel}>Khoảng giá</Text>
            <Text style={styles.detailValue}>{product.priceRange}</Text>
          </View>

          {product.affiliatePartner && (
            <View style={styles.detailRow}>
              <View
                style={[
                  styles.detailIconWrap,
                  { backgroundColor: colors.info + "15" },
                ]}
              >
                <Ionicons
                  name="storefront-outline"
                  size={18}
                  color={colors.info}
                />
              </View>
              <Text style={styles.detailLabel}>Đối tác</Text>
              <Text style={styles.detailValue}>{product.affiliatePartner}</Text>
            </View>
          )}
        </View>

        {/* Occasions Card */}
        {productOccasions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.cardHeaderText}>Phù hợp cho dịp</Text>
            </View>
            <View style={styles.occasionsWrap}>
              {productOccasions.map((occasion) => (
                <View
                  key={occasion.id}
                  style={[
                    styles.occasionPill,
                    {
                      backgroundColor: occasion.color + "15",
                      borderColor: occasion.color + "30",
                    },
                  ]}
                >
                  <Ionicons
                    name={occasion.icon as any}
                    size={14}
                    color={occasion.color}
                  />
                  <Text
                    style={[styles.occasionText, { color: occasion.color }]}
                  >
                    {occasion.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="pricetags-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.cardHeaderText}>Thẻ</Text>
            </View>
            <View style={styles.tagsWrap}>
              {product.tags.map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <View style={styles.similarSection}>
            <View style={styles.cardHeader}>
              <Ionicons name="grid-outline" size={20} color={colors.primary} />
              <Text style={styles.cardHeaderText}>Sản phẩm tương tự</Text>
            </View>
            <View style={styles.similarList}>
              {similarProducts.slice(0, visibleCount).map((p) => (
                <ProductCard key={p.id} product={p} variant="vertical" />
              ))}
              {isLoadingMore && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginVertical: 12 }}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky CTA Button */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[styles.ctaButton, isDisabled && styles.ctaDisabled]}
          onPress={handleBuy}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isDisabled
                ? [colors.textLight, colors.textLight]
                : [colors.primary, colors.primaryDark]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Ionicons
              name={isDisabled ? "time-outline" : "bag-handle-outline"}
              size={22}
              color={colors.white}
            />
            <Text style={styles.ctaText}>
              {isDisabled
                ? "Sắp có hàng"
                : product.price
                ? `Mua ngay - ${formatPrice(product.price)}`
                : "Xem tại cửa hàng"}
            </Text>
            {!isDisabled && (
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },

  // Hero
  heroImageContainer: {
    height: 260,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: 260,
  },
  galleryContainer: {
    height: 260,
    overflow: "hidden",
  },
  galleryScroll: {
    height: 260,
  },
  galleryImage: {
    width: screenWidth,
    height: 260,
  },
  galleryDots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  heroGradient: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  subcategoryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Manrope_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  productName: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
    lineHeight: 30,
    marginBottom: 12,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 6,
  },
  currentPrice: {
    fontSize: 28,
    fontFamily: "Manrope_800ExtraBold",
    color: colors.success,
  },
  originalPrice: {
    fontSize: 16,
    color: colors.textLight,
    textDecorationLine: "line-through",
  },
  savingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.success + "15",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  savingsText: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: colors.success,
  },
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  ratingNumber: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  reviewCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Generic Card
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardHeaderText: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  // Detail Rows
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
  },

  // Occasions
  occasionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  occasionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  occasionText: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
  },

  // Tags
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
    color: colors.textSecondary,
  },

  // Similar Products
  similarSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  similarList: {
    gap: 0,
  },

  // Sticky CTA
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  ctaText: {
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },
}));
export default ProductDetailScreen;
