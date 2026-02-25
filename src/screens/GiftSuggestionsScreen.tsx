import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { COLORS } from '@themes/colors';
import { Event, AIGiftSuggestion, GiftHistoryItem as GiftHistoryItemType } from "../types";
import { generateGiftSuggestionsWithFallback } from "../services/giftSuggestion.service";
import {
  getGiftHistory,
  createGiftItem,
  deleteGiftItem,
  markGiftAsPurchased,
} from "../services/giftHistory.service";
import GiftSuggestionCard from "@components/molecules/GiftSuggestionCard";
import GiftHistoryItem from "@components/molecules/GiftHistoryItem";
import { useToast } from "../contexts/ToastContext";

type GiftSuggestionsScreenRouteProp = RouteProp<
  { GiftSuggestions: { eventId: string; event: Event } },
  "GiftSuggestions"
>;

const GiftSuggestionsScreen: React.FC = () => {
  const route = useRoute<GiftSuggestionsScreenRouteProp>();
  const navigation = useNavigation();
  const db = useSQLiteContext();
  const { showSuccess, showError } = useToast();

  const { eventId, event } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AIGiftSuggestion[]>([]);
  const [isAI, setIsAI] = useState(false);
  const [giftHistory, setGiftHistory] = useState<GiftHistoryItemType[]>([]);

  // Budget settings
  const [minBudget, setMinBudget] = useState("500000");
  const [maxBudget, setMaxBudget] = useState("3000000");
  const [preferences, setPreferences] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"suggestions" | "history">("suggestions");

  useEffect(() => {
    loadGiftHistory();
  }, []);

  const loadGiftHistory = async () => {
    try {
      const history = await getGiftHistory(db, eventId);
      setGiftHistory(history);
    } catch (error) {
      console.error("Error loading gift history:", error);
    }
  };

  const handleGenerateSuggestions = async () => {
    try {
      setIsLoading(true);

      const budget = {
        min: parseInt(minBudget) || 500000,
        max: parseInt(maxBudget) || 3000000,
      };

      const result = await generateGiftSuggestionsWithFallback(db, {
        event,
        budget,
        preferences: preferences.trim() || undefined,
      });

      setSuggestions(result.suggestions);
      setIsAI(result.isAI);
      setShowFilters(false);

      if (!result.isAI) {
        showError("Không thể kết nối AI. Hiển thị gợi ý mặc định.");
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      showError("Không thể tạo gợi ý quà tặng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGift = async (giftName: string) => {
    try {
      await createGiftItem(db, eventId, giftName);
      await loadGiftHistory();
      showSuccess(`Đã lưu "${giftName}" vào danh sách`);
      setActiveTab("history");
    } catch (error) {
      console.error("Error saving gift:", error);
      showError("Không thể lưu quà tặng");
    }
  };

  const handleTogglePurchase = async (id: string) => {
    try {
      await markGiftAsPurchased(db, id);
      await loadGiftHistory();
      showSuccess("Đã cập nhật trạng thái");
    } catch (error) {
      console.error("Error toggling purchase:", error);
      showError("Không thể cập nhật");
    }
  };

  const handleDeleteGift = async (id: string) => {
    try {
      await deleteGiftItem(db, id);
      await loadGiftHistory();
      showSuccess("Đã xóa quà tặng");
    } catch (error) {
      console.error("Error deleting gift:", error);
      showError("Không thể xóa quà tặng");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Gợi ý quà tặng</Text>
          <Text style={styles.headerSubtitle}>{event.title}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "suggestions" && styles.tabActive]}
          onPress={() => setActiveTab("suggestions")}
        >
          <Ionicons
            name="bulb-outline"
            size={20}
            color={activeTab === "suggestions" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "suggestions" && styles.tabTextActive,
            ]}
          >
            Gợi ý
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.tabActive]}
          onPress={() => setActiveTab("history")}
        >
          <Ionicons
            name="gift-outline"
            size={20}
            color={activeTab === "history" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}
          >
            Danh sách ({giftHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "suggestions" ? (
          <>
            {/* Filter Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.filterToggle}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Ionicons name="options-outline" size={20} color={COLORS.primary} />
                <Text style={styles.filterToggleText}>
                  {showFilters ? "Ẩn bộ lọc" : "Tùy chỉnh gợi ý"}
                </Text>
                <Ionicons
                  name={showFilters ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              {showFilters && (
                <View style={styles.filtersContainer}>
                  <Text style={styles.filterLabel}>Ngân sách (VNĐ)</Text>
                  <View style={styles.budgetRow}>
                    <TextInput
                      style={styles.budgetInput}
                      placeholder="Từ"
                      keyboardType="numeric"
                      value={minBudget}
                      onChangeText={setMinBudget}
                    />
                    <Text style={styles.budgetSeparator}>-</Text>
                    <TextInput
                      style={styles.budgetInput}
                      placeholder="Đến"
                      keyboardType="numeric"
                      value={maxBudget}
                      onChangeText={setMaxBudget}
                    />
                  </View>

                  <Text style={styles.filterLabel}>Sở thích / Ghi chú</Text>
                  <TextInput
                    style={styles.preferencesInput}
                    placeholder="VD: Thích đọc sách, yêu thích màu xanh..."
                    multiline
                    numberOfLines={3}
                    value={preferences}
                    onChangeText={setPreferences}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateSuggestions}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color={COLORS.white} />
                    <Text style={styles.generateButtonText}>
                      Tạo gợi ý quà tặng
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* AI Badge */}
            {suggestions.length > 0 && (
              <View style={styles.aiBadgeContainer}>
                <View style={[styles.aiBadge, !isAI && styles.aiBadgeFallback]}>
                  <Ionicons
                    name={isAI ? "sparkles" : "information-circle"}
                    size={16}
                    color={isAI ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={styles.aiBadgeText}>
                    {isAI ? "Gợi ý bởi AI" : "Gợi ý mặc định"}
                  </Text>
                </View>
              </View>
            )}

            {/* Suggestions List */}
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <GiftSuggestionCard
                  key={index}
                  suggestion={suggestion}
                  onSave={handleSaveGift}
                  showSaveButton
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="gift-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyStateTitle}>
                  Chưa có gợi ý nào
                </Text>
                <Text style={styles.emptyStateText}>
                  Nhấn "Tạo gợi ý quà tặng" để nhận gợi ý từ AI
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Gift History List */}
            {giftHistory.length > 0 ? (
              <View style={styles.section}>
                {giftHistory.map((item) => (
                  <GiftHistoryItem
                    key={item.id}
                    item={item}
                    onTogglePurchase={handleTogglePurchase}
                    onDelete={handleDeleteGift}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="list-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyStateTitle}>
                  Danh sách trống
                </Text>
                <Text style={styles.emptyStateText}>
                  Lưu các gợi ý yêu thích để theo dõi
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  filterToggleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 8,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  budgetInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  budgetSeparator: {
    marginHorizontal: 8,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  preferencesInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  aiBadgeContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  aiBadgeFallback: {
    backgroundColor: `${COLORS.textSecondary}15`,
  },
  aiBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});

export default GiftSuggestionsScreen;
