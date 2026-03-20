import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@themes/colors";
import { filterSuggestions, Suggestion } from "../../data/suggestions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickSurveyModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (suggestions: Suggestion[], answers: Record<string, any>) => void;
}

interface RecipientInfo {
  gender: string | null;
  relationship: string | null;
}

type Step =
  | "recipient"
  | "followup_gender"
  | "followup_relationship"
  | "personality"
  | "hobbies"
  | "budget";

// ─── Constants ────────────────────────────────────────────────────────────────

const RECIPIENT_TAGS: Array<{
  label: string;
  gender: string | null;
  relationship: string;
}> = [
  { label: "Bạn gái",    gender: "Nữ",  relationship: "Người yêu/Vợ/Chồng" },
  { label: "Bạn trai",   gender: "Nam", relationship: "Người yêu/Vợ/Chồng" },
  { label: "Vợ",         gender: "Nữ",  relationship: "Người yêu/Vợ/Chồng" },
  { label: "Chồng",      gender: "Nam", relationship: "Người yêu/Vợ/Chồng" },
  { label: "Bố/Ba",      gender: "Nam", relationship: "Cha/Mẹ" },
  { label: "Mẹ/Má",      gender: "Nữ",  relationship: "Cha/Mẹ" },
  { label: "Anh",        gender: "Nam", relationship: "Anh/Chị/Em ruột" },
  { label: "Chị",        gender: "Nữ",  relationship: "Anh/Chị/Em ruột" },
  { label: "Em trai",    gender: "Nam", relationship: "Anh/Chị/Em ruột" },
  { label: "Em gái",     gender: "Nữ",  relationship: "Anh/Chị/Em ruột" },
  { label: "Con trai",   gender: "Nam", relationship: "Cha/Mẹ" },
  { label: "Con gái",    gender: "Nữ",  relationship: "Cha/Mẹ" },
  { label: "Ông",        gender: "Nam", relationship: "Cha/Mẹ" },
  { label: "Bà",         gender: "Nữ",  relationship: "Cha/Mẹ" },
  { label: "Bạn thân",   gender: null,  relationship: "Bạn thân" },
  { label: "Đồng nghiệp",gender: null,  relationship: "Đồng nghiệp/Sếp" },
  { label: "Sếp",        gender: null,  relationship: "Đồng nghiệp/Sếp" },
];

const PARSE_PATTERNS: Array<{
  patterns: string[];
  gender: string | null;
  relationship: string;
}> = [
  { patterns: ["bạn gái", "girlfriend", "gf"], gender: "Nữ", relationship: "Người yêu/Vợ/Chồng" },
  { patterns: ["bạn trai", "boyfriend", "bf"], gender: "Nam", relationship: "Người yêu/Vợ/Chồng" },
  { patterns: ["vợ", "wife"], gender: "Nữ", relationship: "Người yêu/Vợ/Chồng" },
  { patterns: ["chồng", "husband"], gender: "Nam", relationship: "Người yêu/Vợ/Chồng" },
  { patterns: ["em trai"], gender: "Nam", relationship: "Anh/Chị/Em ruột" },
  { patterns: ["em gái"], gender: "Nữ", relationship: "Anh/Chị/Em ruột" },
  { patterns: ["con trai"], gender: "Nam", relationship: "Cha/Mẹ" },
  { patterns: ["con gái"], gender: "Nữ", relationship: "Cha/Mẹ" },
  { patterns: ["bạn thân", "bestie", "best friend"], gender: null, relationship: "Bạn thân" },
  { patterns: ["đồng nghiệp", "colleague", "coworker"], gender: null, relationship: "Đồng nghiệp/Sếp" },
  { patterns: ["cô giáo"], gender: "Nữ", relationship: "Đồng nghiệp/Sếp" },
  { patterns: ["bố", "ba", "cha", "dad", "father", "papa"], gender: "Nam", relationship: "Cha/Mẹ" },
  { patterns: ["mẹ", "má", "mom", "mother", "mama"], gender: "Nữ", relationship: "Cha/Mẹ" },
  { patterns: ["sếp", "boss"], gender: null, relationship: "Đồng nghiệp/Sếp" },
  { patterns: ["ông", "grandpa", "grandfather"], gender: "Nam", relationship: "Cha/Mẹ" },
  { patterns: ["bà", "grandma", "grandmother"], gender: "Nữ", relationship: "Cha/Mẹ" },
  { patterns: ["thầy"], gender: "Nam", relationship: "Đồng nghiệp/Sếp" },
  { patterns: ["anh"], gender: "Nam", relationship: "Anh/Chị/Em ruột" },
  { patterns: ["chị"], gender: "Nữ", relationship: "Anh/Chị/Em ruột" },
  { patterns: ["em"], gender: null, relationship: "Anh/Chị/Em ruột" },
  { patterns: ["cô"], gender: "Nữ", relationship: "Đồng nghiệp/Sếp" },
];

const parseRecipientText = (text: string): RecipientInfo => {
  const lower = text.toLowerCase().trim();
  for (const entry of PARSE_PATTERNS) {
    for (const p of entry.patterns) {
      if (lower.includes(p)) {
        return { gender: entry.gender, relationship: entry.relationship };
      }
    }
  }
  return { gender: null, relationship: null };
};

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const PERSONALITY_OPTIONS: Array<{ label: string; icon: IoniconName }> = [
  { label: "Lãng mạn, mơ mộng",       icon: "heart-outline" },
  { label: "Thực tế, cụ thể",          icon: "construct-outline" },
  { label: "Năng động, thể thao",      icon: "flash-outline" },
  { label: "Nghệ thuật, sáng tạo",     icon: "color-palette-outline" },
  { label: "Thích công nghệ, hiện đại",icon: "laptop-outline" },
  { label: "Hướng nội, trầm tĩnh",    icon: "moon-outline" },
];

const HOBBIES_OPTIONS: Array<{ label: string; icon: IoniconName }> = [
  { label: "Đọc sách/Truyện/Manga",           icon: "book-outline" },
  { label: "Xem phim/Series/Anime",            icon: "film-outline" },
  { label: "Nghe nhạc/Đi concert",             icon: "musical-notes-outline" },
  { label: "Chơi game (Mobile/PC/Console)",    icon: "game-controller-outline" },
  { label: "Thể thao (Gym/Yoga/Chạy bộ/Bơi)", icon: "barbell-outline" },
  { label: "Du lịch/Khám phá",                icon: "airplane-outline" },
  { label: "Nấu ăn/Làm bánh",                 icon: "restaurant-outline" },
  { label: "Chụp ảnh/Quay video",             icon: "camera-outline" },
  { label: "Mua sắm/Làm đẹp",                 icon: "bag-handle-outline" },
  { label: "Vẽ/Handmade/DIY",                 icon: "brush-outline" },
];

const BUDGET_OPTIONS: Array<{ label: string; short: string; icon: IoniconName }> = [
  { label: "Dưới 200k (Quà ý nghĩa, handmade)", short: "Dưới 200k",       icon: "gift-outline" },
  { label: "200k - 500k",                        short: "200k – 500k",     icon: "heart-outline" },
  { label: "500k - 1 triệu",                     short: "500k – 1 triệu",  icon: "star-outline" },
  { label: "1 - 2 triệu",                        short: "1 – 2 triệu",     icon: "star" },
  { label: "2 - 5 triệu",                        short: "2 – 5 triệu",     icon: "sparkles" },
  { label: "Trên 5 triệu (Quà cao cấp)",         short: "Trên 5 triệu",    icon: "trophy-outline" },
  { label: "Không giới hạn",                     short: "Không giới hạn",  icon: "infinite-outline" },
];

const GENDER_OPTIONS: Array<{ label: string; icon: IoniconName }> = [
  { label: "Nam",  icon: "male-outline" },
  { label: "Nữ",   icon: "female-outline" },
  { label: "Khác", icon: "person-outline" },
];

const RELATIONSHIP_QUICK_OPTIONS: Array<{
  label: string; value: string; icon: IoniconName;
}> = [
  { label: "Người yêu / Vợ / Chồng", value: "Người yêu/Vợ/Chồng", icon: "heart-outline" },
  { label: "Bạn thân",               value: "Bạn thân",            icon: "people-outline" },
  { label: "Gia đình",               value: "Cha/Mẹ",              icon: "home-outline" },
  { label: "Đồng nghiệp / Sếp",     value: "Đồng nghiệp/Sếp",    icon: "briefcase-outline" },
];

// Per-step hero — icon + label only, gradient is always the brand colour
const STEP_HERO: Record<Step, { icon: IoniconName; label: string }> = {
  recipient:             { icon: "gift-outline",        label: "Người nhận" },
  followup_gender:       { icon: "person-outline",      label: "Giới tính" },
  followup_relationship: { icon: "heart-circle-outline",label: "Quan hệ" },
  personality:           { icon: "sparkles",            label: "Tính cách" },
  hobbies:               { icon: "compass-outline",     label: "Sở thích" },
  budget:                { icon: "wallet-outline",      label: "Ngân sách" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getNextStep = (current: Step, info: RecipientInfo): Step => {
  if (current === "recipient") {
    if (!info.gender) return "followup_gender";
    if (!info.relationship) return "followup_relationship";
    return "personality";
  }
  if (current === "followup_gender") {
    if (!info.relationship) return "followup_relationship";
    return "personality";
  }
  if (current === "followup_relationship") return "personality";
  if (current === "personality") return "hobbies";
  if (current === "hobbies") return "budget";
  return "budget";
};

const computeTotalSteps = (info: RecipientInfo): number =>
  4 + (!info.gender ? 1 : 0) + (!info.relationship ? 1 : 0);

// ─── Component ────────────────────────────────────────────────────────────────

const QuickSurveyModal: React.FC<QuickSurveyModalProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [step, setStep] = useState<Step>("recipient");
  const [recipientText, setRecipientText] = useState("");
  const [info, setInfo] = useState<RecipientInfo>({ gender: null, relationship: null });
  const [totalSteps, setTotalSteps] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [personality, setPersonality] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setStep("recipient");
      setRecipientText("");
      setInfo({ gender: null, relationship: null });
      setTotalSteps(4);
      setCurrentIndex(0);
      setPersonality([]);
      setHobbies([]);
      fadeAnim.setValue(1);
    }
  }, [visible]);

  const animateNext = (cb: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start();
    setTimeout(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }, 120);
  };

  const advance = useCallback(
    (currentStep: Step, updatedInfo: RecipientInfo) => {
      const next = getNextStep(currentStep, updatedInfo);
      animateNext(() => {
        setStep(next);
        setCurrentIndex((i) => i + 1);
      });
    },
    []
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleTagPress = useCallback((tag: (typeof RECIPIENT_TAGS)[0]) => {
    setRecipientText(tag.label);
    const newInfo: RecipientInfo = { gender: tag.gender, relationship: tag.relationship };
    setInfo(newInfo);
    setTotalSteps(computeTotalSteps(newInfo));
    animateNext(() => { setStep("personality"); setCurrentIndex(1); });
  }, []);

  const handleRecipientNext = useCallback(() => {
    const parsed = parseRecipientText(recipientText);
    setInfo(parsed);
    setTotalSteps(computeTotalSteps(parsed));
    advance("recipient", parsed);
  }, [recipientText, advance]);

  const handleGenderSelect = useCallback((gender: string) => {
    const updated: RecipientInfo = { ...info, gender };
    setInfo(updated);
    advance("followup_gender", updated);
  }, [info, advance]);

  const handleRelationshipSelect = useCallback((value: string) => {
    const updated: RecipientInfo = { ...info, relationship: value };
    setInfo(updated);
    advance("followup_relationship", updated);
  }, [info, advance]);

  const handlePersonalityToggle = useCallback((label: string) => {
    setPersonality((prev) =>
      prev.includes(label) ? prev.filter((p) => p !== label) : [...prev, label]
    );
  }, []);

  const handlePersonalityNext = useCallback(() => advance("personality", info), [info, advance]);

  const handleHobbyToggle = useCallback((label: string) => {
    setHobbies((prev) =>
      prev.includes(label) ? prev.filter((h) => h !== label) : [...prev, label]
    );
  }, []);

  const handleHobbiesNext = useCallback(() => advance("hobbies", info), [info, advance]);

  const handleBudgetSelect = useCallback((label: string) => {
    const finalAnswers: Record<string, any> = {
      gender: info.gender ?? "Khác",
      relationship: info.relationship ?? "Bạn thân",
      personality,
      hobbies,
      budget: label,
    };
    onComplete(filterSuggestions(finalAnswers, 10), finalAnswers);
  }, [info, personality, hobbies, onComplete]);

  const handleBack = useCallback(() => {
    if (currentIndex === 0) { onClose(); return; }
    const sequence: Step[] = ["recipient"];
    if (!info.gender) sequence.push("followup_gender");
    if (!info.relationship) sequence.push("followup_relationship");
    sequence.push("personality", "hobbies", "budget");
    const prevStep = sequence[currentIndex - 1] ?? "recipient";
    animateNext(() => { setStep(prevStep); setCurrentIndex((i) => i - 1); });
  }, [currentIndex, info, onClose]);

  // ── Render helpers ───────────────────────────────────────────────────────────

  const hero = STEP_HERO[step];

  const renderDots = () => (
    <View style={styles.dotsRow}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < currentIndex && styles.dotDone,
            i === currentIndex && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );

  // ── Step renderers ───────────────────────────────────────────────────────────

  const renderRecipient = () => (
    <>
      <TextInput
        style={styles.textInput}
        placeholder="VD: bạn gái, mẹ, bạn thân..."
        placeholderTextColor={COLORS.textSecondary}
        value={recipientText}
        onChangeText={setRecipientText}
        autoFocus
        returnKeyType="next"
        onSubmitEditing={() => { if (recipientText.trim()) handleRecipientNext(); }}
      />
      <Text style={styles.tagsLabel}>Chọn nhanh</Text>
      <View style={styles.tagsWrap}>
        {RECIPIENT_TAGS.map((tag) => {
          const selected = recipientText === tag.label;
          return (
            <TouchableOpacity
              key={tag.label}
              style={[styles.tag, selected && styles.tagSelected]}
              onPress={() => handleTagPress(tag)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tagText, selected && styles.tagTextSelected]}>
                {tag.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  const renderGender = () => (
    <View style={styles.cardGrid3}>
      {GENDER_OPTIONS.map((g) => (
        <TouchableOpacity
          key={g.label}
          style={styles.emojiCard}
          onPress={() => handleGenderSelect(g.label)}
          activeOpacity={0.8}
        >
          <Ionicons name={g.icon} size={30} color={COLORS.textPrimary} />
          <Text style={styles.emojiCardLabel}>{g.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRelationship = () => (
    <View style={styles.cardGrid2}>
      {RELATIONSHIP_QUICK_OPTIONS.map((rel) => (
        <TouchableOpacity
          key={rel.value}
          style={styles.emojiCard}
          onPress={() => handleRelationshipSelect(rel.value)}
          activeOpacity={0.8}
        >
          <Ionicons name={rel.icon} size={30} color={COLORS.textPrimary} />
          <Text style={[styles.emojiCardLabel, { textAlign: "center" }]}>{rel.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPersonality = () => (
    <View style={styles.chipGrid}>
      {PERSONALITY_OPTIONS.map((item) => {
        const selected = personality.includes(item.label);
        return (
          <TouchableOpacity
            key={item.label}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => handlePersonalityToggle(item.label)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={item.icon}
              size={16}
              color={selected ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {item.label}
            </Text>
            {selected && (
              <View style={styles.chipCheck}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderHobbies = () => (
    <View style={styles.chipGrid}>
      {HOBBIES_OPTIONS.map((item) => {
        const selected = hobbies.includes(item.label);
        return (
          <TouchableOpacity
            key={item.label}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => handleHobbyToggle(item.label)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={item.icon}
              size={16}
              color={selected ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {item.label}
            </Text>
            {selected && (
              <View style={styles.chipCheck}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderBudget = () => (
    <View style={styles.budgetGrid}>
      {BUDGET_OPTIONS.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.budgetCard}
          onPress={() => handleBudgetSelect(item.label)}
          activeOpacity={0.8}
        >
          <Ionicons name={item.icon} size={24} color={COLORS.primary} />
          <Text style={styles.budgetLabel}>{item.short}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const showFooter = step === "recipient" || step === "personality" || step === "hobbies";
  const footerNextDisabled = step === "recipient" && recipientText.trim().length === 0;

  const handleFooterNext = () => {
    if (step === "recipient") handleRecipientNext();
    else if (step === "personality") handlePersonalityNext();
    else if (step === "hobbies") handleHobbiesNext();
  };

  const skipHandler =
    step === "personality" ? handlePersonalityNext : handleHobbiesNext;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.sheet, { paddingTop: insets.top }]}>

        {/* ── Hero gradient header ─────────────────────────────── */}
        <LinearGradient colors={["#FF6B6B", "#FF8E53"]} style={styles.hero}>
          {/* Top bar */}
          <View style={styles.heroBar}>
            <TouchableOpacity onPress={handleBack} style={styles.heroBtn}>
              <Ionicons
                name={currentIndex === 0 ? "close" : "arrow-back"}
                size={22}
                color="rgba(255,255,255,0.9)"
              />
            </TouchableOpacity>
            {renderDots()}
            <TouchableOpacity onPress={onClose} style={styles.heroBtn}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          {/* Icon + question */}
          <Ionicons name={hero.icon} size={42} color="rgba(255,255,255,0.95)" style={styles.heroIcon} />
          <Text style={styles.heroQuestion}>
            {step === "recipient" && "Bạn muốn tặng quà cho ai?"}
            {step === "followup_gender" && "Họ là…?"}
            {step === "followup_relationship" && "Mối quan hệ với họ?"}
            {step === "personality" && "Tính cách của họ?"}
            {step === "hobbies" && "Họ hay mê mẩn điều gì?"}
            {step === "budget" && "Ngân sách của bạn?"}
          </Text>
          <Text style={styles.heroHint}>
            {step === "recipient" && "Gõ hoặc chọn gợi ý bên dưới"}
            {step === "followup_gender" && "Giúp gợi ý quà phù hợp hơn"}
            {step === "followup_relationship" && "Chọn loại gần nhất"}
            {step === "personality" && "Chọn tất cả những gì phù hợp"}
            {step === "hobbies" && "Chọn tất cả những gì phù hợp"}
            {step === "budget" && "Tap để xem gợi ý ngay"}
          </Text>
        </LinearGradient>

        {/* ── Content ──────────────────────────────────────────── */}
        <Animated.ScrollView
          style={[styles.scrollArea, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === "recipient" && renderRecipient()}
          {step === "followup_gender" && renderGender()}
          {step === "followup_relationship" && renderRelationship()}
          {step === "personality" && renderPersonality()}
          {step === "hobbies" && renderHobbies()}
          {step === "budget" && renderBudget()}
        </Animated.ScrollView>

        {/* ── Footer ───────────────────────────────────────────── */}
        {showFooter && (
          <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
            {(step === "personality" || step === "hobbies") && (
              <TouchableOpacity style={styles.skipBtn} onPress={skipHandler}>
                <Text style={styles.skipBtnText}>Bỏ qua</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, footerNextDisabled && styles.nextBtnDisabled]}
              onPress={handleFooterNext}
              disabled={footerNextDisabled}
              activeOpacity={0.85}
            >
              <Text style={[styles.nextBtnText, footerNextDisabled && styles.nextBtnTextDisabled]}>
                Tiếp theo
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={footerNextDisabled ? COLORS.textSecondary : "#fff"}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: COLORS.background },

  // ── Hero ──────────────────────────────────────────────────
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  heroBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: 8,
    paddingBottom: 16,
  },
  heroBtn: { padding: 6, width: 34 },
  dotsRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotDone: { backgroundColor: "rgba(255,255,255,0.6)" },
  dotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  heroIcon: { marginBottom: 12 },
  heroQuestion: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 6,
  },
  heroHint: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },

  // ── Scroll ────────────────────────────────────────────────
  scrollArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },

  // ── Recipient step ────────────────────────────────────────
  textInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  tagsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  tagSelected: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}12` },
  tagText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "500" },
  tagTextSelected: { color: COLORS.primary, fontWeight: "700" },

  // ── Emoji card grid (gender / relationship) ───────────────
  cardGrid3: { flexDirection: "row", gap: 12 },
  cardGrid2: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  emojiCard: {
    flex: 1,
    minWidth: "40%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  emojiCardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: 18,
  },

  // ── Chip grid (personality / hobbies) ─────────────────────
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}12`,
  },
  chipText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "500", flexShrink: 1 },
  chipTextSelected: { color: COLORS.primary, fontWeight: "700" },
  chipCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Budget grid ───────────────────────────────────────────
  budgetGrid: { gap: 10 },
  budgetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  budgetLabel: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary, flex: 1 },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  skipBtn: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtnText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "500" },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
  },
  nextBtnDisabled: { backgroundColor: COLORS.border },
  nextBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  nextBtnTextDisabled: { color: COLORS.textSecondary },
});

export default React.memo(QuickSurveyModal);
