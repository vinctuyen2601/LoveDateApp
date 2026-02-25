import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AffiliateProduct } from '../../types';
import { COLORS } from '@themes/colors';
import { formatPrice } from '../../data/affiliateProducts';
import PressableCard from '@components/atoms/PressableCard';

interface ProductCardProps {
  product: AffiliateProduct;
  variant?: 'horizontal' | 'vertical';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, variant = 'horizontal' }) => {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    navigation.navigate('ProductDetail', { product });
  };

  if (variant === 'vertical') {
    return (
      <PressableCard style={styles.verticalCard} onPress={handlePress}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.verticalImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.verticalIcon, { backgroundColor: product.color }]}>
            <Ionicons name={product.icon as any} size={24} color={COLORS.white} />
          </View>
        )}
        <View style={styles.verticalContent}>
          <Text style={styles.verticalName} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.verticalDesc} numberOfLines={1}>{product.description}</Text>
        </View>
        <View style={styles.verticalRight}>
          {product.price && (
            <Text style={styles.verticalPrice}>{formatPrice(product.price)}</Text>
          )}
          <TouchableOpacity style={styles.verticalCta}>
            <Text style={styles.verticalCtaText}>Xem</Text>
          </TouchableOpacity>
        </View>
      </PressableCard>
    );
  }

  return (
    <PressableCard style={styles.card} onPress={handlePress}>
      {product.imageUrl ? (
        <View style={styles.imageHeader}>
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {product.originalPrice && product.price && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.gradientHeader, { backgroundColor: product.color }]}>
          <Ionicons name={product.icon as any} size={28} color={COLORS.white} />
          {product.originalPrice && product.price && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>

        {product.price && (
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
            )}
          </View>
        )}

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#FFB300" />
          <Text style={styles.ratingText}>{product.rating}</Text>
          <Text style={styles.reviewCount}>({product.reviewCount})</Text>
        </View>

        <TouchableOpacity style={[styles.ctaButton, { borderColor: product.color }]}>
          <Text style={[styles.ctaText, { color: product.color }]}>Xem ngay</Text>
          <Ionicons name="arrow-forward" size={14} color={product.color} />
        </TouchableOpacity>
      </View>
    </PressableCard>
  );
};

const styles = StyleSheet.create({
  // Horizontal card (default)
  card: {
    width: 180,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginRight: 12,
  },
  imageHeader: {
    height: 120,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  gradientHeader: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  cardBody: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 19,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.success,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reviewCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 7,
    gap: 4,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Vertical card (for budget filter list)
  verticalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  verticalImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
  },
  verticalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  verticalContent: {
    flex: 1,
    marginRight: 8,
  },
  verticalName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  verticalDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  verticalRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  verticalPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  verticalCta: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verticalCtaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default React.memo(ProductCard);
