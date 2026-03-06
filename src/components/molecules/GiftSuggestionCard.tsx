import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AffiliateProduct } from "../../types";
import { COLORS } from "@themes/colors";
import { logProductClick } from "../../services/analyticsService";

const CATEGORY_VI: Record<string, string> = {
  gift: "Quà tặng",
  restaurant: "Nhà hàng",
  hotel: "Khách sạn",
  spa: "Spa",
  travel: "Du lịch",
};

// Gradient fallback colors per category
const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  gift: ["#FF6B6B", "#FF8E53"],
  spa: ["#A18CD1", "#FBC2EB"],
  restaurant: ["#F093FB", "#F5576C"],
  hotel: ["#4FACFE", "#00F2FE"],
  travel: ["#43E97B", "#38F9D7"],
};

const stripHtml = (html: string): string =>
  html?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() ?? '';

function formatPrice(price?: number): string | null {
  if (price == null) return null;
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  if (price >= 1_000) return `${Math.round(price / 1_000)}k`;
  return String(price);
}

interface GiftSuggestionCardProps {
  product: AffiliateProduct;
  onSave?: (giftName: string) => void;
  showSaveButton?: boolean;
}

const GiftSuggestionCard: React.FC<GiftSuggestionCardProps> = ({
  product,
  onSave,
  showSaveButton = true,
}) => {
  const navigation = useNavigation<any>();
  const [imageError, setImageError] = useState(false);

  const handleCardPress = () => {
    navigation.navigate('ProductDetail', { product });
  };

  const handleOpenLink = () => {
    logProductClick({ id: product.id, name: product.name, affiliateUrl: product.affiliateUrl });
    Linking.canOpenURL(product.affiliateUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(product.affiliateUrl);
        } else {
          Alert.alert("Lỗi", "Không thể mở liên kết này");
        }
      })
      .catch(() => Alert.alert("Lỗi", "Không thể mở liên kết"));
  };

  const priceFormatted = formatPrice(product.price);
  const numPrice = Number(product.price) || 0;
  const numOriginal = Number(product.originalPrice) || 0;
  const discount =
    numOriginal > 0 && numPrice > 0 && numOriginal > numPrice
      ? Math.round((1 - numPrice / numOriginal) * 100)
      : 0;

  const showImage = product.imageUrl && !imageError;
  const gradientColors = CATEGORY_GRADIENTS[product.category] ?? [
    "#FF6B6B",
    "#4ECDC4",
  ];

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.85} onPress={handleCardPress}>
      {/* Image / Fallback */}
      <View style={styles.imageWrapper}>
        {showImage ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.imageFallback}
          >
            <Text style={styles.fallbackIcon}>{product.icon || "🎁"}</Text>
          </LinearGradient>
        )}

        {/* Discount badge (top-right) */}
        {discount > 0 && (
          <View style={styles.discountOverlay}>
            <Text style={styles.discountOverlayText}>-{discount}%</Text>
          </View>
        )}

        {/* Featured / Popular badges (top-left) */}
        {(product.isFeatured || product.isPopular) && (
          <View style={styles.featuredOverlay}>
            {product.isFeatured && (
              <View
                style={[
                  styles.overlayBadge,
                  { backgroundColor: COLORS.primary },
                ]}
              >
                <Text style={styles.overlayBadgeText}>⭐ Nổi bật</Text>
              </View>
            )}
            {product.isPopular && (
              <View
                style={[styles.overlayBadge, { backgroundColor: "#D97706" }]}
              >
                <Text style={styles.overlayBadgeText}>🔥 Phổ biến</Text>
              </View>
            )}
          </View>
        )}

        {/* Category badge (bottom-left on image) */}
        <View style={styles.categoryOverlay}>
          <Text style={styles.categoryOverlayText}>
            {CATEGORY_VI[product.category] || product.category}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Name */}
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Price row */}
        <View style={styles.priceRow}>
          {priceFormatted ? (
            <>
              <Text style={styles.priceText}>{priceFormatted}</Text>
              {discount > 0 && product.originalPrice && (
                <Text style={styles.originalPrice}>
                  {formatPrice(product.originalPrice)}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.priceText}>
              {product.priceRange || "Xem giá"}
            </Text>
          )}

          {/* Rating (right-aligned) */}
          {product.rating != null && Number(product.rating) > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {Number(product.rating).toFixed(1)}
              </Text>
              {product.reviewCount > 0 && (
                <Text style={styles.reviewCount}>({product.reviewCount})</Text>
              )}
            </View>
          )}
        </View>

        {/* Description */}
        {product.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {stripHtml(product.description)}
          </Text>
        ) : null}

        {/* AI Reason callout */}
        {product.reason ? (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonIcon}>💡</Text>
            <Text style={styles.reasonText}>{product.reason}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.buyButton} onPress={handleOpenLink}>
            <Ionicons name="cart-outline" size={16} color={COLORS.white} />
            <Text style={styles.buyButtonText}>Mua ngay</Text>
          </TouchableOpacity>

          {showSaveButton && onSave && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => onSave(product.name)}
            >
              <Ionicons
                name="bookmark-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.saveButtonText}>Lưu</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },

  // Image area
  imageWrapper: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackIcon: {
    fontSize: 52,
  },

  // Overlays on image
  discountOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountOverlayText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },
  featuredOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    gap: 4,
    flexDirection: "column",
  },
  overlayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  overlayBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.white,
  },
  categoryOverlay: {
    position: "absolute",
    bottom: 8,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryOverlayText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.white,
  },

  // Content below image
  content: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 21,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: "auto",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  reviewCount: {
    fontSize: 11,
    color: "#B45309",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  buyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // AI reason callout
  reasonBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  reasonIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#166534",
    fontStyle: "italic",
  },
});

export default GiftSuggestionCard;
