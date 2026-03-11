import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChecklistItem as ChecklistItemType } from "../../types";
import { COLORS } from '@themes/colors';

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  showDueDays?: boolean;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggle,
  onDelete,
  showDueDays = true,
}) => {
  const handleDelete = () => {
    if (onDelete) {
      Alert.alert(
        "Xóa mục",
        "Bạn có chắc muốn xóa mục này?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa",
            style: "destructive",
            onPress: () => onDelete(item.id),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            item.isCompleted && styles.checkboxCompleted,
          ]}
        >
          {item.isCompleted && (
            <Ionicons name="checkmark" size={18} color={COLORS.white} />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            item.isCompleted && styles.titleCompleted,
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {showDueDays && item.dueDaysBefore > 0 && (
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.dueText}>{item.dueDaysBefore} ngày trước sự kiện</Text>
          </View>
        )}
      </View>

      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  checkboxCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: "500",
    lineHeight: 20,
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  dueText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default ChecklistItem;
