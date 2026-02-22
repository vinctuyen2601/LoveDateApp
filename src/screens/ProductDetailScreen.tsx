import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Share,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AffiliateProduct } from '../types';
import { COLORS } from '../constants/colors';
import {
  formatPrice,
  SERVICE_CATEGORIES,
  OCCASION_OPTIONS,
} from '../data/affiliateProducts';
import {
  trackProductView,
  trackAffiliateClick,
  getProductsByCategory,
} from '../services/affiliateProductService';
import ProductCard from '../components/suggestions/ProductCard';

const { width: screenWidth } = Dimensions.get('window');

const ProductDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { product } = route.params as { product: AffiliateProduct };

  const [similarProducts, setSimilarProducts] = useState<AffiliateProduct[]>([]);

  const categoryInfo = SERVICE_CATEGORIES.find((c) => c.id === product.category);

  const discountPercent =
    product.originalPrice && product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  const savings =
    product.originalPrice && product.price
      ? product.originalPrice - product.price
      : 0;

  useEffect(() => {
    // Track view on mount (fire-and-forget)
    trackProductView(product.id);

    // Load similar products async
    const loadSimilar = async () => {
      try {
        const categoryProducts = await getProductsByCategory(product.category);
        setSimilarProducts(
          categoryProducts.filter((p) => p.id !== product.id).slice(0, 6)
        );
      } catch {
        // Fallback - no similar products shown
      }
    };
    loadSimilar();
  }, [product.id, product.category]);

  const productOccasions = useMemo(() => {
    if (!product.occasion || product.occasion.length === 0) {
      return [] as Array<(typeof OCCASION_OPTIONS)[number]>;
    }
    return OCCASION_OPTIONS.filter((o) =>
      product.occasion!.includes(o.id)
    );
  }, [product.occasion]);

  const handleBuy = () => {
    if (product.affiliateUrl && product.affiliateUrl !== '#') {
      trackAffiliateClick(product.id);
      Linking.openURL(product.affiliateUrl);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${product.name} - ${product.price ? formatPrice(product.price) : product.priceRange} | Love Date App`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleSimilarProduct = (similarProduct: AffiliateProduct) => {
    navigation.replace('ProductDetail', { product: similarProduct });
  };

  // Render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.floor(rating) ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={18}
          color="#FFB300"
        />
      );
    }
    return stars;
  };

  const isDisabled = !product.affiliateUrl || product.affiliateUrl === '#';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>

        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[product.color, product.color + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroIconCircle}>
            <Ionicons name={product.icon as any} size={64} color={COLORS.white} />
          </View>
          {discountPercent > 0 && (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>-{discountPercent}%</Text>
            </View>
          )}
        </LinearGradient>

        {/* Product Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.subcategoryLabel}>
            {categoryInfo?.name || product.category} • {product.subcategory}
          </Text>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price Section */}
          <View style={styles.priceSection}>
            {product.price ? (
              <Text style={styles.currentPrice}>{formatPrice(product.price)}</Text>
            ) : (
              <Text style={styles.currentPrice}>{product.priceRange}</Text>
            )}
            {product.originalPrice && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>
          {savings > 0 && (
            <View style={styles.savingsBadge}>
              <Ionicons name="pricetag" size={13} color={COLORS.success} />
              <Text style={styles.savingsText}>
                Tiết kiệm {formatPrice(savings)}
              </Text>
            </View>
          )}

          {/* Rating */}
          <View style={styles.ratingSection}>
            <View style={styles.starsRow}>{renderStars(product.rating)}</View>
            <Text style={styles.ratingNumber}>{product.rating}</Text>
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
              color={COLORS.primary}
            />
            <Text style={styles.cardHeaderText}>Mô tả</Text>
          </View>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="list-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardHeaderText}>Thông tin chi tiết</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.detailIconWrap, { backgroundColor: (categoryInfo?.color || COLORS.primary) + '15' }]}>
              <Ionicons
                name={(categoryInfo?.icon || 'pricetag-outline') as any}
                size={18}
                color={categoryInfo?.color || COLORS.primary}
              />
            </View>
            <Text style={styles.detailLabel}>Danh mục</Text>
            <Text style={styles.detailValue}>
              {categoryInfo?.name || product.category}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.detailIconWrap, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="cash-outline" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.detailLabel}>Khoảng giá</Text>
            <Text style={styles.detailValue}>{product.priceRange}</Text>
          </View>

          {product.affiliatePartner && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIconWrap, { backgroundColor: COLORS.info + '15' }]}>
                <Ionicons name="storefront-outline" size={18} color={COLORS.info} />
              </View>
              <Text style={styles.detailLabel}>Đối tác</Text>
              <Text style={styles.detailValue}>
                {product.affiliatePartner}
              </Text>
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
                color={COLORS.primary}
              />
              <Text style={styles.cardHeaderText}>Phù hợp cho dịp</Text>
            </View>
            <View style={styles.occasionsWrap}>
              {productOccasions.map((occasion) => (
                <View
                  key={occasion.id}
                  style={[
                    styles.occasionPill,
                    { backgroundColor: occasion.color + '15', borderColor: occasion.color + '30' },
                  ]}
                >
                  <Ionicons
                    name={occasion.icon as any}
                    size={14}
                    color={occasion.color}
                  />
                  <Text style={[styles.occasionText, { color: occasion.color }]}>
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
                color={COLORS.primary}
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
              <Ionicons name="grid-outline" size={20} color={COLORS.primary} />
              <Text style={styles.cardHeaderText}>Sản phẩm tương tự</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </ScrollView>
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
                ? [COLORS.textLight, COLORS.textLight]
                : [product.color, product.color + 'DD']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Ionicons
              name={isDisabled ? 'time-outline' : 'bag-handle-outline'}
              size={22}
              color={COLORS.white}
            />
            <Text style={styles.ctaText}>
              {isDisabled
                ? 'Sắp có hàng'
                : product.price
                ? `Mua ngay - ${formatPrice(product.price)}`
                : 'Xem tại cửa hàng'}
            </Text>
            {!isDisabled && (
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 8,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },

  // Hero
  heroGradient: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  subcategoryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 30,
    marginBottom: 12,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 6,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.success,
  },
  originalPrice: {
    fontSize: 16,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Generic Card
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textPrimary,
  },

  // Detail Rows
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Occasions
  occasionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  occasionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  occasionText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Tags
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // Similar Products
  similarSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  horizontalScroll: {
    paddingRight: 16,
    gap: 0,
  },

  // Sticky CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default ProductDetailScreen;
