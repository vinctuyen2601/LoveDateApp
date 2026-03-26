import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AffiliateProduct } from "../../types";
import { formatPrice } from "../../data/affiliateProducts";
import PressableCard from "@components/atoms/PressableCard";
import { trackAffiliateClick } from "../../services/affiliateProductService";
import { makeStyles } from "@utils/makeStyles";
import { useColors } from "@contexts/ThemeContext";

interface ProductCardProps {
  product: AffiliateProduct;
  variant?: "horizontal" | "vertical" | "grid";
  occasion?: string;
  onSaveToEvent?: (product: AffiliateProduct) => void;
}

const stripHtml = (html: string): string =>
  html
    ?.replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";

const getDiscountPercent = (
  price: number | string | undefined,
  originalPrice: number | string | undefined
): number | null => {
  const p = Number(price);
  const op = Number(originalPrice);
  if (!op || !p || op <= 0 || p >= op) return null;
  return Math.round((1 - p / op) * 100);
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = "horizontal",
  occasion,
  onSaveToEvent,
}) => {
  const styles = useStyles();
  const colors = useColors();

  const navigation = useNavigation<any>();
  const discount = getDiscountPercent(product.price, product.originalPrice);

  const handlePress = () => {
    navigation.navigate("ProductDetail", { product });
  };

  const handleBuyPress = () => {
    if (product.affiliateUrl) {
      trackAffiliateClick(product.id, occasion);
      Linking.openURL(product.affiliateUrl);
    }
  };

  if (variant === "vertical") {
    return (
      <PressableCard style={styles.verticalCard} onPress={handlePress}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.verticalImage}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[styles.verticalIcon, { backgroundColor: product.color }]}
          >
            <Ionicons
              name={product.icon as any}
              size={24}
              color={colors.white}
            />
          </View>
        )}
        <View style={styles.verticalContent}>
          <Text style={styles.verticalName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.verticalDesc} numberOfLines={1}>
            {stripHtml(product.description)}
          </Text>
        </View>
        <View style={styles.verticalRight}>
          {product.price && (
            <Text style={styles.verticalPrice}>
              {formatPrice(product.price)}
            </Text>
          )}
          <TouchableOpacity style={styles.verticalCta} onPress={handleBuyPress}>
            <Text style={styles.verticalCtaText}>Mua</Text>
          </TouchableOpacity>
          {onSaveToEvent && (
            <TouchableOpacity
              style={styles.verticalSave}
              onPress={() => onSaveToEvent(product)}
            >
              <Ionicons
                name="bookmark-outline"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
          <Text style={styles.affiliateLabel}>AD</Text>
        </View>
      </PressableCard>
    );
  }

  const cardStyle =
    variant === "grid" ? [styles.card, styles.gridCard] : styles.card;

  return (
    <PressableCard style={cardStyle} onPress={handlePress}>
      {product.imageUrl ? (
        <View style={styles.imageHeader}>
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {discount !== null && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>
      ) : (
        <View
          style={[styles.gradientHeader, { backgroundColor: product.color }]}
        >
          <Ionicons name={product.icon as any} size={28} color={colors.white} />
          {discount !== null && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {product.price && (
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {discount !== null && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.originalPrice!)}
              </Text>
            )}
          </View>
        )}

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color={colors.warning} />
          <Text style={styles.ratingText}>{product.rating}</Text>
          <Text style={styles.reviewCount}>({product.reviewCount})</Text>
        </View>

        <TouchableOpacity
          style={[styles.ctaButton, { borderColor: colors.primary }]}
          onPress={handleBuyPress}
        >
          <Text style={[styles.ctaText, { color: colors.primary }]}>
            Mua ngay
          </Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </PressableCard>
  );
};

const useStyles = makeStyles((colors) => ({
  // Horizontal card (default)
  card: {
    width: 180,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    marginRight: 12,
  },
  gridCard: {
    width: "100%" as any,
    marginRight: 0,
  },
  imageHeader: {
    height: 120,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 120,
  },
  gradientHeader: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  discountBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },
  cardBody: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
    marginBottom: 6,
    lineHeight: 19,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  price: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: colors.success,
    flexShrink: 1,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.textLight,
    textDecorationLine: "line-through",
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
  },
  reviewCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 7,
    gap: 4,
  },
  ctaText: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
  },

  // Vertical card (for budget filter list)
  verticalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: colors.shadow,
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  verticalContent: {
    flex: 1,
    marginRight: 8,
  },
  verticalName: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  verticalDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  verticalRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  verticalPrice: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: colors.success,
  },
  verticalCta: {
    backgroundColor: colors.primary + "15",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verticalCtaText: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    color: colors.primary,
  },
  verticalSave: {
    backgroundColor: colors.primary + "15",
    borderRadius: 8,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  affiliateLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    opacity: 0.6,
    marginTop: 4,
  },
}));
export default React.memo(ProductCard);
