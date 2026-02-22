import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { Suggestion } from "../../data/suggestions";
import { AffiliateProduct } from "../../types";
import { EmptyState } from "../EmptyState";
import ProductCard from "./ProductCard";

interface ResultsModalProps {
  visible: boolean;
  suggestions: Suggestion[];
  products: AffiliateProduct[];
  onClose: () => void;
  onRetake: () => void;
}

const TYPE_INFO = {
  romantic_plan: {
    icon: "heart" as const,
    title: "Kế hoạch lãng mạn",
    color: COLORS.categoryAnniversary,
  },
  activity: {
    icon: "football" as const,
    title: "Hoạt động cùng nhau",
    color: COLORS.success,
  },
  experience: {
    icon: "star" as const,
    title: "Trải nghiệm đặc biệt",
    color: COLORS.warning,
  },
  gift: {
    icon: "gift" as const,
    title: "Quà tặng ý nghĩa",
    color: COLORS.categoryBirthday,
  },
};

const SUGGESTION_TYPES = ["romantic_plan", "activity", "experience", "gift"] as const;

const ResultsModal: React.FC<ResultsModalProps> = ({
  visible,
  suggestions,
  products,
  onClose,
  onRetake,
}) => {
  const popularProducts = useMemo(
    () => products.filter((p) => p.isPopular).slice(0, 3),
    [products]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.resultsModal}>
        <View style={styles.resultsModalHeader}>
          <View>
            <Text style={styles.resultsModalTitle}>Gợi ý dành cho bạn</Text>
            <Text style={styles.resultsModalSubtitle}>
              {suggestions.length} kết quả phù hợp nhất
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {suggestions.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="Không tìm thấy gợi ý phù hợp"
              subtitle="Thử điều chỉnh câu trả lời hoặc làm khảo sát lại"
              actionLabel="Làm lại khảo sát"
              onAction={onRetake}
            />
          ) : (
            <>
              {SUGGESTION_TYPES.map((type) => {
                const typeSuggestions = suggestions.filter(
                  (s) => s.type === type
                );
                if (typeSuggestions.length === 0) return null;

                const info = TYPE_INFO[type];

                return (
                  <View key={type} style={styles.resultSection}>
                    <View style={styles.resultSectionHeader}>
                      <Ionicons
                        name={info.icon}
                        size={20}
                        color={info.color}
                      />
                      <Text style={styles.resultSectionTitle}>
                        {info.title} ({typeSuggestions.length})
                      </Text>
                    </View>

                    {typeSuggestions.map((suggestion) => (
                      <View key={suggestion.id} style={styles.resultCard}>
                        <View style={styles.resultCardHeader}>
                          <Text style={styles.resultCardTitle}>
                            {suggestion.title}
                          </Text>
                          {suggestion.budget &&
                            suggestion.budget.length > 0 && (
                              <Text style={styles.resultCardBudget}>
                                {suggestion.budget[0]}
                              </Text>
                            )}
                        </View>
                        <Text
                          style={styles.resultCardDescription}
                          numberOfLines={3}
                        >
                          {suggestion.description}
                        </Text>
                        <View style={styles.resultCardWhy}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={COLORS.success}
                          />
                          <Text
                            style={styles.resultCardWhyText}
                            numberOfLines={2}
                          >
                            {suggestion.whyGreat}
                          </Text>
                        </View>
                        {suggestion.tips && suggestion.tips.length > 0 && (
                          <View style={styles.resultCardTips}>
                            <Text style={styles.resultCardTipsTitle}>
                              Mẹo hay:
                            </Text>
                            {suggestion.tips.slice(0, 2).map((tip, i) => (
                              <Text key={i} style={styles.resultCardTip}>
                                • {tip}
                              </Text>
                            ))}
                          </View>
                        )}

                        {/* Affiliate product recommendations */}
                        {type === "gift" && popularProducts.length > 0 && (
                          <View style={styles.relatedProducts}>
                            <Text style={styles.relatedProductsTitle}>
                              Sản phẩm gợi ý
                            </Text>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                            >
                              {popularProducts.map((p) => (
                                <ProductCard key={p.id} product={p} />
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                );
              })}

              <View style={styles.resultsActions}>
                <TouchableOpacity
                  style={styles.retakeSurveyButton}
                  onPress={onRetake}
                >
                  <Ionicons name="refresh" size={20} color={COLORS.primary} />
                  <Text style={styles.retakeSurveyText}>
                    Làm lại khảo sát
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  resultsModal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  resultsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultsModalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  resultsModalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  resultsContent: {
    flex: 1,
    padding: 16,
  },
  resultSection: {
    marginBottom: 24,
  },
  resultSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  resultSectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  resultCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  resultCardBudget: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: "500",
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultCardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  resultCardWhy: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: `${COLORS.success}08`,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  resultCardWhyText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  resultCardTips: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  resultCardTipsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  resultCardTip: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 3,
  },
  relatedProducts: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  relatedProductsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 10,
  },
  resultsActions: {
    marginTop: 8,
    marginBottom: 32,
  },
  retakeSurveyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 8,
  },
  retakeSurveyText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default React.memo(ResultsModal);
