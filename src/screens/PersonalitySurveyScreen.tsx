import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "@themes/colors";
import { Article } from '../data/articles';
import { suggestArticlesForSurvey } from '../services/articleService';

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  personality: 'Tính cách', communication: 'Giao tiếp',
  dates: 'Hẹn hò', gifts: 'Quà tặng', zodiac: 'Cung hoàng đạo', all: 'Tổng hợp',
};

const QUESTIONS = [
  {
    id: "style",
    question: "Phong cách của bạn trong tình yêu là gì?",
    hint: "Chọn câu mô tả đúng nhất về bạn",
    icon: "heart" as const,
    options: [
      { id: "a", text: "Tôi thường là người chủ động cho đi nhiều hơn" },
      { id: "b", text: "Tôi cần không gian riêng để nạp lại năng lượng" },
      { id: "c", text: "Tôi muốn được gắn bó và ở gần nhau thật nhiều" },
      { id: "d", text: "Tôi cân bằng — vừa gắn kết vừa có không gian riêng" },
    ],
  },
  {
    id: "receiving",
    question: "Bạn cảm thấy được yêu thương nhất khi nào?",
    hint: "Chọn điều khiến bạn rung động nhất",
    icon: "gift-outline" as const,
    options: [
      { id: "a", text: "Được nghe những lời yêu thương, khen ngợi chân thành" },
      { id: "b", text: "Nhận được món quà dù nhỏ — thể hiện họ nghĩ đến mình" },
      { id: "c", text: "Được dành trọn thời gian chất lượng bên nhau" },
      { id: "d", text: "Được chăm sóc, giúp đỡ những việc nhỏ trong cuộc sống" },
      { id: "e", text: "Được ôm ấp, nắm tay, những cử chỉ gần gũi" },
    ],
  },
  {
    id: "giving",
    question: "Bạn thể hiện tình cảm với người yêu bằng cách nào?",
    hint: "Cách bạn tự nhiên nhất khi yêu",
    icon: "rose-outline" as const,
    options: [
      { id: "a", text: "Nói lời yêu thương, khen ngợi, nhắn tin dễ thương" },
      { id: "b", text: "Tặng quà bất ngờ, chuẩn bị những thứ họ thích" },
      { id: "c", text: "Sắp xếp thời gian, lên kế hoạch hẹn hò đặc biệt" },
      { id: "d", text: "Làm những việc nhỏ như nấu ăn, nhắc nhở, lo lắng" },
      { id: "e", text: "Ôm ấp, nắm tay, những cử chỉ thân mật tự nhiên" },
    ],
  },
  {
    id: "conflict",
    question: "Khi có mâu thuẫn, bạn thường xử lý như thế nào?",
    hint: "Phản ứng tự nhiên của bạn",
    icon: "chatbubbles-outline" as const,
    options: [
      { id: "a", text: "Nói thẳng ngay để giải quyết, không để lâu" },
      { id: "b", text: "Cần thời gian để bình tĩnh rồi mới nói chuyện" },
      { id: "c", text: "Thường nhường nhịn để tránh ảnh hưởng đến đôi bên" },
      { id: "d", text: "Nhẹ nhàng trao đổi, cố hiểu cảm xúc của nhau" },
    ],
  },
  {
    id: "date",
    question: "Ngày hẹn hò lý tưởng của bạn là gì?",
    hint: "Chọn trải nghiệm bạn thích nhất",
    icon: "calendar-outline" as const,
    options: [
      { id: "a", text: "Ở nhà nấu ăn, xem phim ôm nhau — yên bình và gần gũi" },
      { id: "b", text: "Ra ngoài ăn tối, khám phá cafe, thử đồ ăn mới" },
      { id: "c", text: "Đi dã ngoại, phiêu lưu, leo núi hay roadtrip" },
      { id: "d", text: "Làm gì cũng được, miễn là được ở bên nhau" },
    ],
  },
  {
    id: "value",
    question: "Điều bạn coi trọng nhất trong tình yêu là gì?",
    hint: "Nền tảng của một mối quan hệ lành mạnh với bạn",
    icon: "shield-checkmark-outline" as const,
    options: [
      { id: "a", text: "Sự tin tưởng và trung thực tuyệt đối" },
      { id: "b", text: "Cùng nhau phát triển và hỗ trợ ước mơ" },
      { id: "c", text: "Niềm vui, sự hài hước và những khoảnh khắc vui vẻ" },
      { id: "d", text: "Sự ổn định, an toàn và có thể dựa vào nhau" },
      { id: "e", text: "Đam mê, lãng mạn và sức hút không phai" },
    ],
  },
  {
    id: "stress",
    question: "Khi căng thẳng, bạn muốn người yêu làm gì?",
    hint: "Điều giúp bạn cảm thấy được chữa lành",
    icon: "leaf-outline" as const,
    options: [
      { id: "a", text: "Cho tôi không gian một mình để nạp lại năng lượng" },
      { id: "b", text: "Lắng nghe và chia sẻ cùng tôi" },
      { id: "c", text: "Rủ tôi làm gì đó vui để quên đi chuyện buồn" },
      { id: "d", text: "Chỉ cần ngồi bên cạnh, yên lặng ôm nhau" },
    ],
  },
  {
    id: "planning",
    question: "Về phong cách lập kế hoạch hẹn hò, bạn là...?",
    hint: "Cách bạn thích chuẩn bị cho những buổi hẹn",
    icon: "map-outline" as const,
    options: [
      { id: "a", text: "Người lên kế hoạch chi tiết — tôi thích chuẩn bị kỹ" },
      { id: "b", text: "Người ngẫu hứng — bất ngờ mới thú vị" },
      { id: "c", text: "Có ý tưởng chung nhưng không cần cứng nhắc" },
      { id: "d", text: "Người linh hoạt — người kia quyết định là được" },
    ],
  },
];

// ─── Result calculation ───────────────────────────────────────────────────────

const LOVE_LANGUAGE_MAP: Record<string, { label: string; icon: string; desc: string }> = {
  a: { label: "Lời nói yêu thương", icon: "chatbubble-ellipses", desc: "Bạn cảm thấy được yêu nhất qua những lời nói chân thành, lời khen và lời khẳng định tình cảm." },
  b: { label: "Nhận quà tặng", icon: "gift", desc: "Đối với bạn, món quà dù nhỏ là biểu tượng của sự quan tâm — cho thấy người kia nghĩ đến mình." },
  c: { label: "Thời gian chất lượng", icon: "time", desc: "Sự hiện diện trọn vẹn và những khoảnh khắc chỉ có hai bạn là điều nuôi dưỡng tình yêu của bạn." },
  d: { label: "Hành động chăm sóc", icon: "hand-left", desc: "Những việc nhỏ như nấu ăn, giúp đỡ hay chú ý lo lắng — đó là ngôn ngữ tình yêu thực sự với bạn." },
  e: { label: "Đụng chạm thể chất", icon: "heart-circle", desc: "Sự gần gũi thể chất — ôm ấp, nắm tay, những cử chỉ ân cần — là cách bạn cảm nhận tình yêu sâu sắc nhất." },
};

const PERSONALITY_MAP: Record<string, { label: string; color: string; emoji: string }> = {
  a: { label: "Người cho đi", color: "#E11D48", emoji: "🌸" },
  b: { label: "Người độc lập", color: "#7C3AED", emoji: "🌿" },
  c: { label: "Người gắn kết", color: "#D97706", emoji: "🔥" },
  d: { label: "Người cân bằng", color: "#059669", emoji: "⚖️" },
};

const DATE_SUGGESTIONS: Record<string, string[]> = {
  a: ["Nấu ăn tại nhà + dinner by candlelight", "Movie night tự setup ở nhà", "Buổi tối ngắm sao (Stargazing date)"],
  b: ["Bữa tối tại nhà hàng yêu thích", "Cafe hopping + chụp ảnh phố", "Đêm nhạc acoustic / Live music"],
  c: ["Trekking / leo núi cùng nhau", "Roadtrip ngắn ngày", "Workshop làm gốm / vẽ tranh"],
  d: ["Đọc sách cùng nhau tại book cafe", "Picnic hoàng hôn", "Học kỹ năng mới cùng nhau"],
};

const STRENGTHS_MAP: Record<string, string[]> = {
  a: ["Hết lòng, quan tâm người yêu sâu sắc", "Luôn đặt cảm xúc đối phương lên đầu", "Giỏi nhận biết và đáp ứng nhu cầu tình cảm"],
  b: ["Tự chủ, không phụ thuộc về mặt cảm xúc", "Mang lại không gian lành mạnh cho nhau", "Biết ranh giới cá nhân trong tình yêu"],
  c: ["Trung thành và gắn bó sâu sắc", "Luôn sẵn sàng ưu tiên người yêu", "Cảm xúc phong phú, lãng mạn"],
  d: ["Dễ thích nghi, không cứng nhắc", "Biết điều chỉnh theo nhu cầu của nhau", "Mang lại sự ổn định trong mối quan hệ"],
};

function calculateResult(answers: Record<string, string>) {
  const ll = LOVE_LANGUAGE_MAP[answers.receiving ?? "c"] ?? LOVE_LANGUAGE_MAP.c;
  const giving = LOVE_LANGUAGE_MAP[answers.giving ?? "c"] ?? LOVE_LANGUAGE_MAP.c;
  const personality = PERSONALITY_MAP[answers.style ?? "d"] ?? PERSONALITY_MAP.d;
  const dateSuggs = DATE_SUGGESTIONS[answers.date ?? "d"] ?? DATE_SUGGESTIONS.d;
  const strengths = STRENGTHS_MAP[answers.style ?? "d"] ?? STRENGTHS_MAP.d;

  return { ll, giving, personality, dateSuggs, strengths };
}

// ─── Component ────────────────────────────────────────────────────────────────

const PersonalitySurveyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [phase, setPhase] = useState<"intro" | "survey" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase !== 'result') return;
    const res = calculateResult(answers);
    suggestArticlesForSurvey('personality', {
      loveLanguage: res.ll.label,
      personality: res.personality.label,
      strengths: res.strengths,
      dateSuggestions: res.dateSuggs,
    })
      .then(setRelatedArticles)
      .catch(() => {});
  }, [phase]);

  const total = QUESTIONS.length;
  const progress = (currentQ / total) * 100;

  const animateTransition = (cb: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(cb, 150);
  };

  const handleSelect = (optionId: string) => {
    const qId = QUESTIONS[currentQ].id;
    setAnswers(prev => ({ ...prev, [qId]: optionId }));
  };

  const handleNext = () => {
    if (!answers[QUESTIONS[currentQ].id]) return;
    if (currentQ < total - 1) {
      animateTransition(() => setCurrentQ(q => q + 1));
    } else {
      animateTransition(() => setPhase("result"));
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      animateTransition(() => setCurrentQ(q => q - 1));
    } else {
      setPhase("intro");
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQ(0);
    setPhase("intro");
  };

  // ── Intro ──
  if (phase === "intro") {
    return (
      <View style={styles.flex}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#7C3AED", "#C026D3"]} style={styles.flex}>
          <SafeAreaView style={[styles.flex, styles.introWrap]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.introBadge}>
              <Text style={styles.introBadgeText}>✨ Khảo sát tính cách</Text>
            </View>

            <View style={styles.introIconWrap}>
              <Ionicons name="person-circle-outline" size={80} color="rgba(255,255,255,0.9)" />
            </View>

            <Text style={styles.introTitle}>Khám phá phong cách{"\n"}yêu thương của bạn</Text>
            <Text style={styles.introSub}>
              8 câu hỏi để hiểu sâu hơn về ngôn ngữ tình yêu, phong cách quan hệ và cách bạn kết nối với người thương.
            </Text>

            <View style={styles.introStats}>
              {[
                { icon: "help-circle-outline", text: "8 câu hỏi" },
                { icon: "time-outline", text: "3 phút" },
                { icon: "sparkles-outline", text: "Kết quả riêng" },
              ].map(s => (
                <View style={styles.introStat} key={s.text}>
                  <Ionicons name={s.icon as any} size={18} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.introStatText}>{s.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.introCta} onPress={() => setPhase("survey")} activeOpacity={0.85}>
              <Text style={styles.introCtaText}>Bắt đầu khám phá</Text>
              <Ionicons name="arrow-forward" size={20} color="#7C3AED" />
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // ── Result ──
  if (phase === "result") {
    const result = calculateResult(answers);
    return (
      <View style={styles.flex}>
        <StatusBar barStyle="light-content" />
        <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <LinearGradient colors={["#7C3AED", "#C026D3"]} style={styles.resultHeader}>
            <SafeAreaView>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.resultBadgeWrap}>
                <Text style={styles.resultEmoji}>{result.personality.emoji}</Text>
                <View style={styles.resultPersonalityBadge}>
                  <Text style={styles.resultPersonalityLabel}>{result.personality.label}</Text>
                </View>
              </View>
              <Text style={styles.resultTitle}>Hồ sơ tính cách{"\n"}của bạn</Text>
            </SafeAreaView>
          </LinearGradient>

          <View style={styles.resultBody}>
            {/* Love language receiving */}
            <View style={styles.resultCard}>
              <View style={styles.resultCardHeader}>
                <View style={[styles.resultCardIcon, { backgroundColor: "#FEF3C7" }]}>
                  <Ionicons name={result.ll.icon as any} size={22} color="#D97706" />
                </View>
                <View style={styles.resultCardInfo}>
                  <Text style={styles.resultCardLabel}>Ngôn ngữ tình yêu (nhận)</Text>
                  <Text style={styles.resultCardTitle}>{result.ll.label}</Text>
                </View>
              </View>
              <Text style={styles.resultCardDesc}>{result.ll.desc}</Text>
            </View>

            {/* Love language giving */}
            {result.giving.label !== result.ll.label && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <View style={[styles.resultCardIcon, { backgroundColor: "#FCE7F3" }]}>
                    <Ionicons name={result.giving.icon as any} size={22} color="#DB2777" />
                  </View>
                  <View style={styles.resultCardInfo}>
                    <Text style={styles.resultCardLabel}>Ngôn ngữ tình yêu (cho đi)</Text>
                    <Text style={styles.resultCardTitle}>{result.giving.label}</Text>
                  </View>
                </View>
                <Text style={styles.resultCardDesc}>
                  Cách bạn tự nhiên thể hiện tình cảm thường khác với cách bạn muốn nhận — đây là điều giúp cả hai hiểu nhau hơn.
                </Text>
              </View>
            )}

            {/* Strengths */}
            <View style={styles.resultCard}>
              <Text style={styles.resultSectionTitle}>💪 Điểm mạnh trong tình yêu</Text>
              {result.strengths.map((s, i) => (
                <View style={styles.strengthRow} key={i}>
                  <View style={styles.strengthDot} />
                  <Text style={styles.strengthText}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Date suggestions */}
            <View style={styles.resultCard}>
              <Text style={styles.resultSectionTitle}>🗓 Gợi ý hẹn hò cho bạn</Text>
              {result.dateSuggs.map((s, i) => (
                <View style={styles.dateRow} key={i}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.dateText}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate("Suggestions", { openSurvey: true })}
              activeOpacity={0.85}
            >
              <Ionicons name="gift-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Tìm quà phù hợp với tính cách này</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleRetake}>
              <Ionicons name="refresh-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.secondaryBtnText}>Làm lại khảo sát</Text>
            </TouchableOpacity>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <View style={styles.articlesSection}>
                <Text style={styles.articlesSectionTitle}>📖 Có thể bạn quan tâm</Text>
                {relatedArticles.map((article, i) => (
                  <TouchableOpacity
                    key={article.id}
                    style={[styles.articleCard, i > 0 && styles.articleCardBorder]}
                    onPress={() => navigation.navigate('ArticleDetail' as any, { article })}
                    activeOpacity={0.72}
                  >
                    <View style={[styles.articleIconBox, { backgroundColor: article.color + '22' }]}>
                      <Ionicons name={article.icon as any} size={22} color={article.color} />
                    </View>
                    <View style={styles.articleInfo}>
                      <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
                      <Text style={styles.articleMeta}>
                        {CATEGORY_LABELS[article.category] ?? article.category} · {article.readTime ?? 5} phút đọc
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Survey ──
  const q = QUESTIONS[currentQ];
  const selectedOption = answers[q.id];

  return (
    <View style={[styles.flex, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.surveyHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.surveyBackBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.surveyProgress}>Câu {currentQ + 1}/{total}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.surveyBackBtn}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>

        <Animated.ScrollView
          style={[styles.flex, { opacity: fadeAnim }]}
          contentContainerStyle={styles.surveyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Question */}
          <View style={styles.questionIconWrap}>
            <Ionicons name={q.icon} size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.questionText}>{q.question}</Text>
          <Text style={styles.questionHint}>{q.hint}</Text>

          {/* Options */}
          <View style={styles.optionsWrap}>
            {q.options.map(opt => {
              const isSelected = selectedOption === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                  onPress={() => handleSelect(opt.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                    {isSelected && <View style={styles.optionRadioDot} />}
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {opt.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.ScrollView>

        {/* Next button */}
        <View style={styles.surveyFooter}>
          <TouchableOpacity
            style={[styles.nextBtn, !selectedOption && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!selectedOption}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {currentQ < total - 1 ? "Tiếp theo" : "Xem kết quả"}
            </Text>
            <Ionicons
              name={currentQ < total - 1 ? "arrow-forward" : "sparkles"}
              size={18}
              color={selectedOption ? "#fff" : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Intro
  introWrap: { paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  backBtn: { position: "absolute", top: 16, right: 16, padding: 8, zIndex: 10 },
  introBadge: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6, marginBottom: 32,
  },
  introBadgeText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  introIconWrap: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  introTitle: {
    fontSize: 28, fontWeight: "800", color: "#fff",
    textAlign: "center", lineHeight: 36, marginBottom: 14,
  },
  introSub: {
    fontSize: 15, color: "rgba(255,255,255,0.82)",
    textAlign: "center", lineHeight: 22, marginBottom: 32,
  },
  introStats: { flexDirection: "row", gap: 20, marginBottom: 40 },
  introStat: { alignItems: "center", gap: 6 },
  introStatText: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "500" },
  introCta: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 30, width: "100%", justifyContent: "center",
  },
  introCtaText: { fontSize: 17, fontWeight: "700", color: "#7C3AED" },

  // Survey
  surveyHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  surveyBackBtn: { padding: 6 },
  surveyProgress: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  progressTrack: {
    height: 4, backgroundColor: COLORS.border,
    marginHorizontal: 16, borderRadius: 2, marginBottom: 8,
  },
  progressFill: {
    height: "100%", borderRadius: 2,
    backgroundColor: "#7C3AED",
  },
  surveyContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  questionIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  questionText: {
    fontSize: 20, fontWeight: "700", color: COLORS.textPrimary,
    lineHeight: 28, marginBottom: 8,
  },
  questionHint: {
    fontSize: 13, color: COLORS.textSecondary, marginBottom: 24,
  },
  optionsWrap: { gap: 10 },
  optionBtn: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  optionBtnSelected: {
    borderColor: "#7C3AED", backgroundColor: "#7C3AED10",
  },
  optionRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: COLORS.border, alignItems: "center", justifyContent: "center",
    marginTop: 1, flexShrink: 0,
  },
  optionRadioSelected: { borderColor: "#7C3AED" },
  optionRadioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: "#7C3AED",
  },
  optionText: {
    flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20,
  },
  optionTextSelected: { color: "#7C3AED", fontWeight: "600" },
  surveyFooter: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#7C3AED", borderRadius: 14, paddingVertical: 16,
  },
  nextBtnDisabled: { backgroundColor: COLORS.border },
  nextBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  // Result
  resultHeader: { paddingHorizontal: 24, paddingBottom: 32 },
  resultBadgeWrap: { alignItems: "center", marginTop: 16, marginBottom: 12 },
  resultEmoji: { fontSize: 48, marginBottom: 8 },
  resultPersonalityBadge: {
    backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  resultPersonalityLabel: { color: "#fff", fontWeight: "700", fontSize: 15 },
  resultTitle: {
    fontSize: 24, fontWeight: "800", color: "#fff",
    textAlign: "center", lineHeight: 32, marginTop: 12,
  },
  resultBody: { padding: 16, gap: 12 },
  resultCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  resultCardHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 10 },
  resultCardIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  resultCardInfo: { flex: 1 },
  resultCardLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "500", marginBottom: 2 },
  resultCardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  resultCardDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  resultSectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 12 },
  strengthRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  strengthDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7C3AED", marginTop: 6 },
  strengthText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  dateRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  dateText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, marginTop: 4,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  secondaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12,
  },
  secondaryBtnText: { fontSize: 14, color: COLORS.textSecondary },

  // Related articles
  articlesSection: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  articlesSectionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4 },
  articleCard: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10,
  },
  articleCardBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  articleIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#F3E8FF", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  articleEmoji: { fontSize: 22 },
  articleInfo: { flex: 1 },
  articleTitle: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary, lineHeight: 20, marginBottom: 3 },
  articleMeta: { fontSize: 12, color: COLORS.textSecondary },
});

export default PersonalitySurveyScreen;
