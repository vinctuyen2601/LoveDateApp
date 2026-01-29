import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AIGiftSuggestion } from "../types";
import { COLORS } from "../constants/colors";

interface GiftSuggestionCardProps {
  suggestion: AIGiftSuggestion;
  onSave?: (giftName: string) => void;
  showSaveButton?: boolean;
}

const GiftSuggestionCard: React.FC<GiftSuggestionCardProps> = ({
  suggestion,
  onSave,
  showSaveButton = true,
}) => {
  const handleOpenLink = (url: string) => {
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Lỗi", "Không thể mở liên kết này");
        }
      })
      .catch((err) => console.error("Error opening URL:", err));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(suggestion.name);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="gift-outline" size={24} color={COLORS.primary} />
          <Text style={styles.name} numberOfLines={2}>
            {suggestion.name}
          </Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{suggestion.category}</Text>
        </View>
      </View>

      {/* Price Range */}
      <View style={styles.priceContainer}>
        <Ionicons name="pricetag-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.priceText}>{suggestion.priceRange}</Text>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {suggestion.description}
      </Text>

      {/* Reasoning */}
      <View style={styles.reasoningContainer}>
        <Ionicons name="bulb-outline" size={16} color={COLORS.primary} />
        <Text style={styles.reasoningText} numberOfLines={3}>
          {suggestion.reasoning}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Purchase Links */}
        {suggestion.purchaseLinks && suggestion.purchaseLinks.length > 0 && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleOpenLink(suggestion.purchaseLinks![0])}
          >
            <Ionicons name="cart-outline" size={18} color={COLORS.primary} />
            <Text style={styles.linkButtonText}>Mua ngay</Text>
          </TouchableOpacity>
        )}

        {/* Save Button */}
        {showSaveButton && onSave && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="bookmark-outline" size={18} color={COLORS.white} />
            <Text style={styles.saveButtonText}>Lưu lại</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  categoryBadge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  reasoningContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: `${COLORS.primary}08`,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasoningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  linkButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
});

export default GiftSuggestionCard;
