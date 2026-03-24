import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AffiliateProduct } from '../../types';
import { COLORS } from '@themes/colors';
import { SERVICE_CATEGORIES } from '../../data/affiliateProducts';
import PressableCard from '@components/atoms/PressableCard';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

const stripHtml = (html: string): string =>
  html?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() ?? '';

interface ExperienceCardProps {
  product: AffiliateProduct;
}

const ExperienceCard: React.FC<ExperienceCardProps> = ({ product }) => {
  const styles = useStyles();
  const colors = useColors();

  const navigation = useNavigation<any>();
  const categoryInfo = SERVICE_CATEGORIES.find((c) => c.id === product.category);

  const handlePress = () => {
    navigation.navigate('ExperienceDetail', { product });
  };

  return (
    <PressableCard style={styles.card} onPress={handlePress}>
      {/* Header: ảnh hoặc gradient */}
      {product.imageUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
        </View>
      ) : (
        <View style={[styles.gradientFallback, { backgroundColor: categoryInfo?.color || product.color }]}>
          <Ionicons name={(categoryInfo?.icon || product.icon) as any} size={40} color="rgba(255,255,255,0.9)" />
        </View>
      )}

      {/* Category badge */}
      <View style={[styles.categoryBadge, { backgroundColor: (categoryInfo?.color || product.color) + 'EE' }]}>
        <Ionicons name={(categoryInfo?.icon || product.icon) as any} size={11} color={colors.white} />
        <Text style={styles.categoryText}>{categoryInfo?.name || product.category}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{stripHtml(product.description)}</Text>

        <View style={styles.footer}>
          <Text style={styles.price}>{product.priceRange || 'Liên hệ'}</Text>
          <View style={[styles.ctaButton, { backgroundColor: categoryInfo?.color || product.color }]}>
            <Text style={styles.ctaText}>Khám phá</Text>
            <Ionicons name="arrow-forward" size={12} color={colors.white} />
          </View>
        </View>
      </View>
    </PressableCard>
  );
};

const useStyles = makeStyles((colors) => ({
  card: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  imageContainer: {
    height: 130,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 130,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  gradientFallback: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: colors.white,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textSecondary,
    flex: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ctaText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: colors.white,
  },
}));export default React.memo(ExperienceCard);
