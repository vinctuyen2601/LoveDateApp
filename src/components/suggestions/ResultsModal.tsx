import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@themes/colors";
import { Suggestion } from "../../data/suggestions";
import { AffiliateProduct } from "../../types";
import { EmptyState } from "@components/atoms/EmptyState";
import ProductCard from "./ProductCard";
import { apiService } from "../../services/api.service";

interface ResultsModalProps {
  visible: boolean;
  suggestions: Suggestion[];
  products: AffiliateProduct[];
  surveyAnswers: Record<string, any>;
  onClose: () => void;
  onRetake: () => void;
}

// ── Display type (covers both static Suggestion + AI response shape) ──────────

type DisplaySuggestion = {
  id: string;
  title: string;
  type: 'gift' | 'experience' | 'activity' | 'romantic_plan';
  description: string;
  whyGreat: string;
  tips?: string[];
  budget?: string[];
};

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_INFO = {
  romantic_plan: {
    icon: "heart" as const,
    title: "Kế hoạch lãng mạn",
    color: COLORS.categoryAnniversary,
    emoji: "💕",
  },
  activity: {
    icon: "football" as const,
    title: "Hoạt động cùng nhau",
    color: COLORS.success,
    emoji: "🏃",
  },
  experience: {
    icon: "star" as const,
    title: "Trải nghiệm đặc biệt",
    color: COLORS.warning,
    emoji: "⭐",
  },
  gift: {
    icon: "gift" as const,
    title: "Quà tặng ý nghĩa",
    color: COLORS.categoryBirthday,
    emoji: "🎁",
  },
};

const SUGGESTION_TYPES = ["romantic_plan", "activity", "experience", "gift"] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildAISummary(answers: Record<string, any>): string {
  const parts: string[] = [];
  const { gender, relationship, occasion } = answers;
  if (occasion) parts.push(`quà ${(occasion as string).toLowerCase()}`);
  if (gender === "Nam" && relationship) parts.push(`cho anh ấy (${relationship})`);
  else if (gender === "Nữ" && relationship) parts.push(`cho cô ấy (${relationship})`);
  else if (relationship) parts.push(`cho ${relationship}`);
  return parts.join(" ");
}

function buildAIPrompt(answers: Record<string, any>): string {
  const parts: string[] = [];
  const { gender, relationship, occasion, hobbies = [], budget, personality = [] } = answers;

  if (occasion) parts.push(`Tặng quà ${(occasion as string).toLowerCase()}`);
  if (gender && relationship) {
    const who =
      gender === "Nam"
        ? "cho bạn trai/chồng"
        : gender === "Nữ"
        ? "cho bạn gái/vợ"
        : `cho ${relationship}`;
    parts.push(who);
  }
  if ((hobbies as string[]).length > 0)
    parts.push(`thích ${(hobbies as string[]).slice(0, 3).join(", ")}`);
  if ((personality as string[]).length > 0)
    parts.push(`tính cách ${(personality as string[]).slice(0, 2).join(", ")}`);
  if (budget) parts.push(`ngân sách ${budget}`);

  return parts.join(", ") || "Gợi ý quà tặng phù hợp";
}

// ── AI thinking dots ───────────────────────────────────────────────────────────

const AIThinkingDots: React.FC = () => {
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 380, useNativeDriver: true }),
        ])
      ).start();
    };
    pulse(d1, 0);
    pulse(d2, 160);
    pulse(d3, 320);
  }, []);

  return (
    <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
      {[d1, d2, d3].map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: COLORS.primary,
            opacity: dot,
          }}
        />
      ))}
    </View>
  );
};

// ── Skeleton placeholder ───────────────────────────────────────────────────────

const SkeletonProductCard: React.FC = () => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.skeletonCard, { opacity: anim }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { width: "70%" }]} />
        <View style={[styles.skeletonLine, { width: "45%", marginTop: 7 }]} />
        <View style={[styles.skeletonLine, { width: "100%", height: 32, borderRadius: 8, marginTop: 10 }]} />
      </View>
    </Animated.View>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const ResultsModal: React.FC<ResultsModalProps> = ({
  visible,
  suggestions,
  products,
  surveyAnswers,
  onClose,
  onRetake,
}) => {
  const insets = useSafeAreaInsets();

  // ── Affiliate products (AI-picked, with fallback to popular) ──────────────
  const [aiProducts, setAIProducts]   = useState<AffiliateProduct[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiReasoning, setAIReasoning] = useState("");

  // ── Personalized suggestions (AI-scored & rewritten from BE) ──────────────
  const [displaySuggestions, setDisplaySuggestions] = useState<DisplaySuggestion[]>([]);
  const [isLoadingPersonalization, setIsLoadingPersonalization] = useState(false);
  const [isAIPersonalized, setIsAIPersonalized]       = useState(false);
  const [personalizationReason, setPersonalizationReason] = useState("");

  const popularProducts = useMemo(
    () => products.filter((p) => p.isPopular).slice(0, 4),
    [products]
  );

  const aiSummary = useMemo(() => buildAISummary(surveyAnswers), [surveyAnswers]);

  useEffect(() => {
    if (visible) {
      // Reset & seed with static suggestions immediately
      setIsAIPersonalized(false);
      setPersonalizationReason("");
      setDisplaySuggestions(suggestions.map((s) => ({
        id: s.id, title: s.title, type: s.type,
        description: s.description, whyGreat: s.whyGreat,
        tips: s.tips, budget: s.budget,
      })));
      if (Object.keys(surveyAnswers).length > 0) {
        fetchAIProducts();
        fetchPersonalizedSuggestions();
      }
    }
  }, [visible]);

  // Fetch AI-personalized suggestion cards from BE (scoring + Groq personalization)
  const fetchPersonalizedSuggestions = async () => {
    try {
      setIsLoadingPersonalization(true);
      const data = await apiService.post("/surveys/ai-suggestions", { answers: surveyAnswers });
      const items = data.suggestions as DisplaySuggestion[] | undefined;
      if (items && items.length > 0) {
        setDisplaySuggestions(items);
        setPersonalizationReason((data.reasoning as string) || "");
        setIsAIPersonalized(true);
      }
    } catch {
      // Keep static displaySuggestions silently
    } finally {
      setIsLoadingPersonalization(false);
    }
  };

  // Fetch AI affiliate products (existing logic)
  const fetchAIProducts = async () => {
    try {
      setIsLoadingAI(true);
      setAIProducts([]);
      setAIReasoning("");
      const prompt = buildAIPrompt(surveyAnswers);
      const data = await apiService.post("/products/ai-suggest", { prompt });
      setAIProducts((data.products as AffiliateProduct[]) || []);
      setAIReasoning((data.reasoning as string) || "");
    } catch {
      // Silently fallback to popular products
    } finally {
      setIsLoadingAI(false);
    }
  };

  const displayProducts = aiProducts.length > 0 ? aiProducts : popularProducts;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* ── Gradient header ───────────────────────────────────────────────── */}
        <LinearGradient
          colors={["#FF6B6B", "#FF8E53"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Gợi ý dành cho bạn</Text>
            <Text style={styles.headerSub}>
              {isAIPersonalized ? "✨" : "⚡"} {displaySuggestions.length} gợi ý{isAIPersonalized ? " đã cá nhân hóa" : " phù hợp nhất"}
            </Text>
          </View>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={11} color="#FF6B6B" />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {displaySuggestions.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="Không tìm thấy gợi ý phù hợp"
              subtitle="Thử điều chỉnh câu trả lời hoặc làm khảo sát lại"
              actionLabel="Làm lại khảo sát"
              onAction={onRetake}
            />
          ) : (
            <>
              {/* ── AI summary chat bubble ──────────────────────────────────── */}
              {aiSummary ? (
                <View style={styles.aiCard}>
                  <View style={styles.aiCardHeader}>
                    <LinearGradient colors={["#FF6B6B", "#FF8E53"]} style={styles.aiAvatar}>
                      <Text style={{ fontSize: 17 }}>✨</Text>
                    </LinearGradient>
                    <View>
                      <Text style={styles.aiName}>Trợ lý quà tặng AI</Text>
                      <Text style={styles.aiOnline}>● Đang hoạt động</Text>
                    </View>
                  </View>
                  <View style={styles.aiBubble}>
                    <Text style={styles.aiBubbleText}>
                      Mình đã phân tích câu trả lời của bạn và tìm thấy{" "}
                      <Text style={{ fontWeight: "700" }}>{displaySuggestions.length} gợi ý</Text>{" "}
                      phù hợp cho{" "}
                      <Text style={{ fontWeight: "700" }}>{aiSummary}</Text> nhé! 🎉
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* ── AI-powered products section ─────────────────────────────── */}
              {(isLoadingAI || displayProducts.length > 0) && (
                <View style={styles.aiProductsSection}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: `${COLORS.categoryBirthday}15` }]}>
                      <Ionicons name="sparkles" size={17} color={COLORS.categoryBirthday} />
                    </View>
                    <Text style={styles.sectionTitle}>🛍️ Sản phẩm AI gợi ý</Text>
                    {isLoadingAI && <AIThinkingDots />}
                  </View>

                  {isLoadingAI ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <SkeletonProductCard />
                      <SkeletonProductCard />
                    </ScrollView>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {displayProducts.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </ScrollView>
                  )}

                  {aiReasoning ? (
                    <View style={styles.reasoningBanner}>
                      <Text style={styles.reasoningText}>🤖 {aiReasoning}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* ── Personalization status banner ────────────────────────── */}
              {(isLoadingPersonalization || (isAIPersonalized && personalizationReason)) && (
                <View style={styles.personalizationBanner}>
                  {isLoadingPersonalization ? (
                    <>
                      <AIThinkingDots />
                      <Text style={styles.personalizationText}>AI đang cá nhân hóa gợi ý...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={13} color={COLORS.primary} />
                      <Text style={styles.personalizationText}>{personalizationReason}</Text>
                    </>
                  )}
                </View>
              )}

              {/* ── Suggestion sections by type ───────────────────────────── */}
              {SUGGESTION_TYPES.map((type) => {
                const typeSuggestions = displaySuggestions.filter((s) => s.type === type);
                if (typeSuggestions.length === 0) return null;
                const info = TYPE_INFO[type];

                return (
                  <View key={type} style={styles.typeSection}>
                    <View style={styles.sectionHeader}>
                      <View style={[styles.sectionIconWrap, { backgroundColor: `${info.color}15` }]}>
                        <Ionicons name={info.icon} size={17} color={info.color} />
                      </View>
                      <Text style={styles.sectionTitle}>
                        {info.emoji} {info.title}
                      </Text>
                      <View style={[styles.countBadge, { backgroundColor: `${info.color}15` }]}>
                        <Text style={[styles.countBadgeText, { color: info.color }]}>
                          {typeSuggestions.length}
                        </Text>
                      </View>
                    </View>

                    {typeSuggestions.map((suggestion) => (
                      <View
                        key={suggestion.id}
                        style={[styles.suggestionCard, { borderLeftColor: info.color }]}
                      >
                        <View style={styles.cardRow}>
                          <Text style={styles.cardTitle}>{suggestion.title}</Text>
                          {suggestion.budget && suggestion.budget.length > 0 && (
                            <View style={styles.budgetBadge}>
                              <Text style={styles.budgetBadgeText}>{suggestion.budget[0]}</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.cardDesc} numberOfLines={3}>
                          {suggestion.description}
                        </Text>

                        <View style={styles.whyBox}>
                          <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
                          <Text style={styles.whyText} numberOfLines={2}>
                            {suggestion.whyGreat}
                          </Text>
                        </View>

                        {suggestion.tips && suggestion.tips.length > 0 && (
                          <View style={styles.tipsBox}>
                            <Text style={styles.tipsTitle}>💡 Mẹo hay:</Text>
                            {suggestion.tips.slice(0, 2).map((tip, i) => (
                              <Text key={i} style={styles.tipText}>• {tip}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                );
              })}

              {/* ── Bottom action ─────────────────────────────────────────── */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.retakeBtn} onPress={onRetake}>
                  <Ionicons name="refresh" size={18} color={COLORS.primary} />
                  <Text style={styles.retakeBtnText}>Làm lại khảo sát</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  closeBtn: { padding: 6 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: COLORS.white, marginBottom: 2 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "500" },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  aiBadgeText: { fontSize: 11, fontWeight: "800", color: "#FF6B6B" },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // AI summary card
  aiCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.10)",
  },
  aiCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  aiAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  aiName:   { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  aiOnline: { fontSize: 11, color: COLORS.success, fontWeight: "500", marginTop: 1 },
  aiBubble: {
    backgroundColor: "rgba(255,107,107,0.07)",
    borderRadius: 14,
    borderTopLeftRadius: 4,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "rgba(255,107,107,0.30)",
  },
  aiBubbleText: { fontSize: 14, lineHeight: 21, color: COLORS.textPrimary },

  // AI products section
  aiProductsSection: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  skeletonCard: {
    width: 170,
    backgroundColor: COLORS.borderLight,
    borderRadius: 14,
    marginRight: 12,
    overflow: "hidden",
  },
  skeletonImage: { width: "100%", height: 120, backgroundColor: COLORS.border },
  skeletonBody:  { padding: 12 },
  skeletonLine:  { height: 12, backgroundColor: COLORS.border, borderRadius: 6 },
  reasoningBanner: {
    marginTop: 12,
    backgroundColor: "rgba(255,107,107,0.07)",
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  reasoningText: {
    fontSize: 12, color: COLORS.textPrimary,
    fontStyle: "italic", lineHeight: 18,
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    gap: 8, marginBottom: 12,
  },
  sectionIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { fontSize: 12, fontWeight: "700" },

  // Type sections
  typeSection: { marginBottom: 20 },

  // Suggestion cards
  suggestionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, lineHeight: 21 },
  budgetBadge: {
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  budgetBadgeText: { fontSize: 11, color: COLORS.success, fontWeight: "600" },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 10 },
  whyBox: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: `${COLORS.success}08`,
    borderRadius: 8, padding: 10, gap: 6, marginBottom: 8,
  },
  whyText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, lineHeight: 18 },
  tipsBox: { backgroundColor: COLORS.background, borderRadius: 8, padding: 10 },
  tipsTitle: { fontSize: 12, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 4 },
  tipText:  { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 2 },

  // Personalization banner
  personalizationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  personalizationText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontStyle: "italic",
    lineHeight: 17,
  },

  // Actions
  actions: { marginTop: 4, marginBottom: 28 },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: 8,
  },
  retakeBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: "600" },
});

export default React.memo(ResultsModal);
