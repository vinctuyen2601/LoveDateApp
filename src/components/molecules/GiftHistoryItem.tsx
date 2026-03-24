import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GiftHistoryItem as GiftHistoryItemType } from "../../types";
import { COLORS } from '@themes/colors';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

interface GiftHistoryItemProps {
  item: GiftHistoryItemType;
  onTogglePurchase?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (item: GiftHistoryItemType) => void;
}

const GiftHistoryItem: React.FC<GiftHistoryItemProps> = ({
  item,
  onTogglePurchase,
  onDelete,
  onEdit,
}) => {
  const styles = useStyles();
  const colors = useColors();

  const handleDelete = () => {
    if (onDelete) {
      Alert.alert("Xóa quà tặng", "Bạn có chắc muốn xóa quà tặng này?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => onDelete(item.id),
        },
      ]);
    }
  };

  const handleOpenLink = () => {
    if (item.purchaseUrl) {
      Linking.canOpenURL(item.purchaseUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(item.purchaseUrl!);
          } else {
            Alert.alert("Lỗi", "Không thể mở liên kết này");
          }
        })
        .catch((err) => console.error("Error opening URL:", err));
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={14}
          color={i <= rating ? colors.warning : colors.textSecondary}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  return (
    <View style={[styles.container, item.isPurchased && styles.containerPurchased]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => onTogglePurchase && onTogglePurchase(item.id)}
        >
          <View
            style={[
              styles.checkbox,
              item.isPurchased && styles.checkboxPurchased,
            ]}
          >
            {item.isPurchased && (
              <Ionicons name="checkmark" size={18} color={colors.white} />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text
            style={[styles.name, item.isPurchased && styles.namePurchased]}
            numberOfLines={2}
          >
            {item.giftName}
          </Text>

          {/* Price & Rating */}
          <View style={styles.metaRow}>
            {item.price && (
              <View style={styles.priceContainer}>
                <Ionicons
                  name="pricetag-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.priceText}>
                  {Number(item.price).toLocaleString("vi-VN")} đ
                </Text>
              </View>
            )}
            {item.rating && renderStars(item.rating)}
          </View>

          {/* Notes */}
          {item.notes && (
            <Text style={styles.notes} numberOfLines={2}>
              {item.notes}
            </Text>
          )}

          {/* Purchased Date */}
          {item.isPurchased && item.purchasedAt && (
            <Text style={styles.purchasedDate}>
              Đã mua: {new Date(item.purchasedAt).toLocaleDateString("vi-VN")}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {item.purchaseUrl && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleOpenLink}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="link-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  containerPurchased: {
    backgroundColor: `${colors.success}08`,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  checkboxPurchased: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  namePurchased: {
    textDecorationLine: "line-through",
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceText: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textSecondary,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  notes: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  purchasedDate: {
    fontSize: 12,
    color: colors.success,
    fontFamily: 'Manrope_500Medium',
  },
  actions: {
    flexDirection: "column",
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
  },
}));

export default GiftHistoryItem;
