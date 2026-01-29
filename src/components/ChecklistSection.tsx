import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChecklistItem as ChecklistItemType } from "../types";
import { COLORS } from "../constants/colors";
import ChecklistItem from "./ChecklistItem";

interface ChecklistSectionProps {
  eventId: string;
  items: ChecklistItemType[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (title: string) => void;
  showProgress?: boolean;
  allowAdd?: boolean;
  allowDelete?: boolean;
}

const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  eventId,
  items,
  onToggle,
  onDelete,
  onAdd,
  showProgress = true,
  allowAdd = true,
  allowDelete = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");

  // Calculate progress
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.isCompleted).length;
  const progressPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleAddItem = () => {
    const trimmedTitle = newItemTitle.trim();
    if (!trimmedTitle) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung công việc");
      return;
    }

    onAdd(trimmedTitle);
    setNewItemTitle("");
    setIsAddingNew(false);
  };

  if (totalItems === 0 && !allowAdd) {
    return null; // Don't show empty checklist if adding is not allowed
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name="checkbox-outline"
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.headerTitle}>Checklist</Text>
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {completedItems}/{totalItems}
              </Text>
            </View>
          )}
        </View>

        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={24}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>

      {/* Progress Bar */}
      {showProgress && totalItems > 0 && isExpanded && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progressPercentage}%</Text>
        </View>
      )}

      {/* Checklist Items */}
      {isExpanded && (
        <View style={styles.itemsContainer}>
          {items.length === 0 && !isAddingNew && (
            <Text style={styles.emptyText}>
              Chưa có công việc nào. Nhấn "Thêm việc cần làm" để bắt đầu.
            </Text>
          )}

          {items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onToggle={onToggle}
              onDelete={allowDelete ? onDelete : undefined}
              showDueDays={true}
            />
          ))}

          {/* Add new item form */}
          {isAddingNew && (
            <View style={styles.addItemForm}>
              <TextInput
                style={styles.input}
                placeholder="Nhập công việc cần làm..."
                value={newItemTitle}
                onChangeText={setNewItemTitle}
                autoFocus
                multiline
                maxLength={200}
              />
              <View style={styles.addItemButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setNewItemTitle("");
                    setIsAddingNew(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleAddItem}
                >
                  <Text style={styles.saveButtonText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Add new item button */}
          {allowAdd && !isAddingNew && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAddingNew(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.addButtonText}>Thêm việc cần làm</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    minWidth: 40,
    textAlign: "right",
  },
  itemsContainer: {
    gap: 0,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    marginTop: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "500",
  },
  addItemForm: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    minHeight: 60,
    textAlignVertical: "top",
  },
  addItemButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
});

export default ChecklistSection;
