import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import RenderHTML from 'react-native-render-html';
import { AffiliateProduct } from '../types';
import { COLORS } from '@themes/colors';
import { htmlStyles } from '../styles/htmlStyles';
import { SERVICE_CATEGORIES } from '../data/affiliateProducts';
import { useMasterData } from '../contexts/MasterDataContext';
import { trackAffiliateClick, getExperienceProducts } from '../services/affiliateProductService';
import ExperienceCard from '../components/suggestions/ExperienceCard';

const { width: screenWidth } = Dimensions.get('window');

// Category màu và icon cho từng loại trải nghiệm
const EXPERIENCE_CATEGORY_META: Record<string, { label: string; icon: string; color: string; highlight: string }> = {
  restaurant: {
    label: 'Nhà hàng',
    icon: 'restaurant',
    color: '#FF8C00',
    highlight: 'Ẩm thực',
  },
  hotel: {
    label: 'Khách sạn',
    icon: 'bed',
    color: '#9B59B6',
    highlight: 'Lưu trú',
  },
  spa: {
    label: 'Spa & Wellness',
    icon: 'leaf',
    color: '#2ECC71',
    highlight: 'Thư giãn',
  },
  travel: {
    label: 'Du lịch',
    icon: 'airplane',
    color: '#3498DB',
    highlight: 'Khám phá',
  },
};

const ExperienceDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { product } = route.params as { product: AffiliateProduct };

  const [similarExperiences, setSimilarExperiences] = useState<AffiliateProduct[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const { occasions } = useMasterData();

  const meta = EXPERIENCE_CATEGORY_META[product.category] || {
    label: product.category,
    icon: 'star',
    color: product.color,
    highlight: 'Trải nghiệm',
  };

  const categoryInfo = SERVICE_CATEGORIES.find((c) => c.id === product.category);

  useEffect(() => {
    const loadSimilar = async () => {
      try {
        const all = await getExperienceProducts(10);
        setSimilarExperiences(all.filter((p) => p.id !== product.id).slice(0, 5));
      } catch {
        // ignore
      }
    };
    loadSimilar();
  }, [product.id]);

  const productOccasions = useMemo(() => {
    if (!product.occasion || product.occasion.length === 0) return [];
    return occasions.filter((o) => product.occasion!.includes(o.id));
  }, [product.occasion, occasions]);

  const highlights = useMemo(() => {
    return product.tags && product.tags.length > 0 ? product.tags.slice(0, 6) : [];
  }, [product.tags]);

  const handleBook = () => {
    const url = product.affiliateUrl;
    if (!url || url === '#') return;
    trackAffiliateClick(product.id);
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${product.name} — ${product.priceRange || 'Liên hệ'} | Love Date App`,
      });
    } catch {
      // cancelled
    }
  };

  const isBookable = product.affiliateUrl && product.affiliateUrl !== '#';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.categoryBadge, { backgroundColor: meta.color }]}>
            <Ionicons name={meta.icon as any} size={13} color={COLORS.white} />
            <Text style={styles.categoryBadgeText}>{meta.label}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={meta.color} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Hero */}
        {product.galleryUrls && product.galleryUrls.length > 0 ? (
          <View style={styles.heroContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setGalleryIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth));
              }}
            >
              {product.galleryUrls.filter(Boolean).map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.heroImage} resizeMode="cover" />
              ))}
            </ScrollView>
            {/* Dot indicators */}
            <View style={styles.galleryDots}>
              {product.galleryUrls.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === galleryIndex && styles.dotActive]}
                />
              ))}
            </View>
          </View>
        ) : product.imageUrl ? (
          <View style={styles.heroContainer}>
            <Image source={{ uri: product.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          </View>
        ) : (
          <View style={[styles.heroFallback, { backgroundColor: meta.color }]}>
            <Ionicons name={meta.icon as any} size={72} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroFallbackLabel}>{meta.highlight}</Text>
          </View>
        )}

        {/* Main Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.experienceName}>{product.name}</Text>

          {/* Price + Partner row */}
          <View style={styles.metaRow}>
            <View style={[styles.priceChip, { backgroundColor: meta.color + '18' }]}>
              <Ionicons name="pricetag" size={14} color={meta.color} />
              <Text style={[styles.priceText, { color: meta.color }]}>
                {product.priceRange || (product.price ? `${(product.price / 1000).toFixed(0)}k` : 'Liên hệ')}
              </Text>
            </View>
            {product.affiliatePartner && (
              <View style={styles.partnerChip}>
                <Ionicons name="storefront-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.partnerText}>{product.affiliatePartner}</Text>
              </View>
            )}
          </View>

          {/* Rating */}
          {product.rating > 0 && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={
                    star <= Math.floor(product.rating)
                      ? 'star'
                      : star - 0.5 <= product.rating
                      ? 'star-half'
                      : 'star-outline'
                  }
                  size={16}
                  color="#FFB300"
                />
              ))}
              <Text style={styles.ratingNum}>{product.rating}</Text>
              <Text style={styles.reviewCount}>({product.reviewCount} đánh giá)</Text>
            </View>
          )}
        </View>

        {/* Highlights */}
        {highlights.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles" size={18} color={meta.color} />
              <Text style={styles.cardTitle}>Điểm nổi bật</Text>
            </View>
            <View style={styles.tagsWrap}>
              {highlights.map((tag, i) => (
                <View key={i} style={[styles.highlightChip, { borderColor: meta.color + '40', backgroundColor: meta.color + '10' }]}>
                  <Ionicons name="checkmark-circle" size={13} color={meta.color} />
                  <Text style={[styles.highlightText, { color: meta.color }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Giới thiệu */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={18} color={meta.color} />
            <Text style={styles.cardTitle}>Giới thiệu</Text>
          </View>
          <RenderHTML
            contentWidth={screenWidth - 64}
            source={{ html: product.description }}
            tagsStyles={htmlStyles}
          />
        </View>

        {/* Thông tin đặt chỗ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={18} color={meta.color} />
            <Text style={styles.cardTitle}>Thông tin đặt chỗ</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: meta.color + '15' }]}>
              <Ionicons name={meta.icon as any} size={16} color={meta.color} />
            </View>
            <Text style={styles.infoLabel}>Loại</Text>
            <Text style={styles.infoValue}>{meta.label}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: meta.color + '15' }]}>
              <Ionicons name="cash-outline" size={16} color={meta.color} />
            </View>
            <Text style={styles.infoLabel}>Mức giá</Text>
            <Text style={styles.infoValue}>{product.priceRange || 'Liên hệ'}</Text>
          </View>

          {product.affiliatePartner && (
            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: meta.color + '15' }]}>
                <Ionicons name="storefront-outline" size={16} color={meta.color} />
              </View>
              <Text style={styles.infoLabel}>Đối tác</Text>
              <Text style={styles.infoValue}>{product.affiliatePartner}</Text>
            </View>
          )}

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.infoIconWrap, { backgroundColor: meta.color + '15' }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={meta.color} />
            </View>
            <Text style={styles.infoLabel}>Đặt cọc</Text>
            <Text style={styles.infoValue}>Qua đối tác</Text>
          </View>
        </View>

        {/* Phù hợp cho dịp */}
        {productOccasions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart-outline" size={18} color={meta.color} />
              <Text style={styles.cardTitle}>Phù hợp cho dịp</Text>
            </View>
            <View style={styles.tagsWrap}>
              {productOccasions.map((occasion) => (
                <View
                  key={occasion.id}
                  style={[styles.occasionPill, { backgroundColor: occasion.color + '15', borderColor: occasion.color + '30' }]}
                >
                  <Ionicons name={occasion.icon as any} size={13} color={occasion.color} />
                  <Text style={[styles.occasionText, { color: occasion.color }]}>{occasion.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Trải nghiệm tương tự */}
        {similarExperiences.length > 0 && (
          <View style={styles.similarSection}>
            <View style={styles.cardHeader}>
              <Ionicons name="compass-outline" size={18} color={meta.color} />
              <Text style={styles.cardTitle}>Trải nghiệm tương tự</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {similarExperiences.map((exp) => (
                <ExperienceCard key={exp.id} product={exp} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: isBookable ? meta.color : COLORS.textLight }]}
          onPress={handleBook}
          disabled={!isBookable}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isBookable ? 'calendar' : 'time-outline'}
            size={22}
            color={COLORS.white}
          />
          <Text style={styles.ctaText}>
            {isBookable
              ? `Đặt trải nghiệm${product.priceRange ? ` — ${product.priceRange}` : ''}`
              : 'Sắp có lịch'}
          </Text>
          {isBookable && <Ionicons name="arrow-forward" size={18} color={COLORS.white} />}
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Scroll
  scroll: {
    flex: 1,
  },

  // Hero
  heroContainer: {
    height: 260,
    overflow: 'hidden',
  },
  heroImage: {
    width: screenWidth,
    height: 260,
  },
  heroFallback: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroFallbackLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
  },
  galleryDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: COLORS.white,
    width: 18,
  },

  // Info card
  infoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 18,
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
  },
  experienceName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 30,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  priceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  partnerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
  partnerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  ratingNum: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Generic card
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Highlights
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  highlightText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Booking info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Occasions
  occasionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  occasionText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Similar
  similarSection: {
    marginTop: 16,
    paddingHorizontal: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default ExperienceDetailScreen;
