import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AffiliateProduct } from "../../types";
import { logProductClick } from "../../services/analyticsService";
import { useEvents } from "../../contexts/EventsContext";
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

const CATEGORY_VI: Record<string, string> = {
  gift: "Quà tặng",
  restaurant: "Nhà hàng",
  hotel: "Khách sạn",
  spa: "Spa",
  travel: "Du lịch",
};


const stripHtml = (html: string): string =>
  html
    ?.replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";

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
  eventId?: string;
}

const GiftSuggestionCard: React.FC<GiftSuggestionCardProps> = ({
  product,
  onSave,
  showSaveButton = true,
  eventId,
}) => {
  const styles = useStyles();
  const colors = useColors();
  const navigation = useNavigation<any>();
  const { upsertEventNote } = useEvents();
  const [imageError, setImageError] = useState(false);
  const [giftSaved, setGiftSaved] = useState(false);

  const handleCardPress = () => {
    navigation.navigate("ProductDetail", { product });
  };

  const handleOpenLink = () => {
    logProductClick({
      id: product.id,
      name: product.name,
      affiliateUrl: product.affiliateUrl,
    });
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

  const handleSelectGift = async () => {
    if (!eventId) return;
    try {
      await upsertEventNote(eventId, {
        gift: {
          name: product.name,
          price: Number(product.price) || undefined,
          source: "occasion_products",
          productId: product.id,
          link: product.affiliateUrl,
          imageUrl: product.imageUrl,
          rating: product.rating,
          reviewCount: product.reviewCount,
          description: product.description ? stripHtml(product.description) : undefined,
          reason: product.reason,
        },
      });
      setGiftSaved(true);
    } catch {
      // fail silently — gift save is best-effort
    }
    handleOpenLink();
  };

  const priceFormatted = formatPrice(product.price);
  const numPrice = Number(product.price) || 0;
  const numOriginal = Number(product.originalPrice) || 0;
  const discount =
    numOriginal > 0 && numPrice > 0 && numOriginal > numPrice
      ? Math.round((1 - numPrice / numOriginal) * 100)
      : 0;

  const showImage = product.imageUrl && !imageError;
  const gradientColors: [string, string] = [colors.gradientStart, colors.gradientEnd];

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.85}
      onPress={handleCardPress}
    >
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
            <Ionicons
              name="gift-outline"
              size={40}
              color="rgba(255,255,255,0.9)"
            />
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
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="star" size={11} color={colors.white} />
                <Text style={styles.overlayBadgeText}> Nổi bật</Text>
              </View>
            )}
            {product.isPopular && (
              <View
                style={[styles.overlayBadge, { backgroundColor: colors.warning }]}
              >
                <Ionicons name="flame" size={11} color={colors.white} />
                <Text style={styles.overlayBadgeText}> Phổ biến</Text>
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
              <Ionicons name="star" size={12} color={colors.warning} />
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
            <Ionicons name="bulb-outline" size={16} color={colors.warning} />
            <Text style={styles.reasonText}>{product.reason}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          {eventId ? (
            <TouchableOpacity
              style={[styles.buyButton, giftSaved && styles.buyButtonSaved]}
              onPress={handleSelectGift}
            >
              <Ionicons
                name={giftSaved ? "checkmark-circle-outline" : "gift-outline"}
                size={16}
                color={colors.white}
              />
              <Text style={styles.buyButtonText}>
                {giftSaved ? "Đã chọn" : "Chọn quà & Mua"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.buyButton} onPress={handleOpenLink}>
              <Ionicons name="cart-outline" size={16} color={colors.white} />
              <Text style={styles.buyButtonText}>Mua ngay</Text>
            </TouchableOpacity>
          )}

          {showSaveButton && onSave && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => onSave(product.name)}
            >
              <Ionicons
                name="bookmark-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.saveButtonText}>Lưu</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountOverlayText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: colors.white,
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
    fontFamily: 'Manrope_600SemiBold',
    color: colors.white,
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
    fontFamily: 'Manrope_600SemiBold',
    color: colors.white,
  },

  // Content below image
  content: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
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
    fontFamily: 'Manrope_700Bold',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: "auto",
    backgroundColor: colors.warning + '18',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: colors.warning,
  },
  reviewCount: {
    fontSize: 11,
    color: colors.warning,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
  },
  buyButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.white,
  },
  buyButtonSaved: {
    backgroundColor: colors.success,
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
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.primary,
  },

  // AI reason callout
  reasonBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: colors.success + '12',
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
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
    color: colors.success,
    fontStyle: "italic",
  },
}));

export default GiftSuggestionCard;
