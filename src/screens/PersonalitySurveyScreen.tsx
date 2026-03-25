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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "@themes/colors";
import { Article } from '../data/articles';
import { suggestArticlesForSurvey } from '../services/articleService';
import { apiService } from '../services/api.service';
import { useAiRateLimit } from '../hooks/useAiRateLimit';
import AiRateLimitModal from '../components/molecules/AiRateLimitModal';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  personality: 'Tính cách', communication: 'Giao tiếp',
  dates: 'Hẹn hò', gifts: 'Quà tặng', zodiac: 'Cung hoàng đạo', all: 'Tổng hợp',
};

const QUESTIONS = [
  {
    id: "avoidance",
    question: "Khi người yêu muốn gần gũi cảm xúc hơn, bạn thường cảm thấy thế nào?",
    hint: "Phản ứng tự nhiên nhất khi họ muốn thêm sự gần gũi",
    icon: "heart" as const,
    options: [
      { id: "a", text: "Tôi thấy thoải mái và hạnh phúc — gần gũi là điều tôi mong muốn" },
      { id: "b", text: "Tôi cần không gian riêng — gần quá khiến tôi cảm thấy ngột ngạt" },
      { id: "c", text: "Tôi muốn gần hơn nhưng lo họ không muốn như vậy" },
      { id: "d", text: "Tùy lúc — đôi khi thích gần, đôi khi cần không gian" },
    ],
  },
  {
    id: "anxiety",
    question: "Khi người yêu ít nhắn tin hoặc im lặng 1-2 ngày, bạn thường làm gì?",
    hint: "Phản ứng thực tế của bạn — không phải điều bạn nghĩ nên làm",
    icon: "phone-portrait-outline" as const,
    options: [
      { id: "a", text: "Tôi hiểu họ bận và chờ đợi bình thản, không lo nhiều" },
      { id: "b", text: "Tôi lo lắng, kiểm tra điện thoại và muốn nhắn tin hỏi liên tục" },
      { id: "c", text: "Tôi nhắn hỏi thăm một lần cho yên tâm rồi thôi" },
      { id: "d", text: "Tôi lo nhưng cố không nhắn — sợ bị xem là nhõng nhẽo" },
    ],
  },
  {
    id: "neuroticism",
    question: "Khi mối quan hệ có vấn đề nhỏ, cảm xúc của bạn thường như thế nào?",
    hint: "Mô tả trung thực nhất — không có câu trả lời đúng hay sai",
    icon: "pulse-outline" as const,
    options: [
      { id: "a", text: "Tôi bình tĩnh xử lý và không bị ảnh hưởng lâu" },
      { id: "b", text: "Tôi khá căng thẳng và cần thời gian để hồi phục hoàn toàn" },
      { id: "c", text: "Cảm xúc tôi bùng phát nhưng qua nhanh, rồi bình thường lại" },
      { id: "d", text: "Tôi lo âu và suy nghĩ mãi, rất khó buông bỏ" },
    ],
  },
  {
    id: "conflict",
    question: "Khi có xung đột với người yêu, bạn thường xử lý như thế nào?",
    hint: "Cách phản ứng tự nhiên của bạn",
    icon: "chatbubbles-outline" as const,
    options: [
      { id: "a", text: "Nói thẳng ngay — không thích để mâu thuẫn kéo dài" },
      { id: "b", text: "Thảo luận cởi mở để cả hai cùng tìm giải pháp tốt nhất" },
      { id: "c", text: "Ai cũng nhường một chút — thỏa hiệp là ổn" },
      { id: "d", text: "Né tránh tạm thời — chờ cho qua rồi nói chuyện sau" },
      { id: "e", text: "Nhường nhịn — hạnh phúc của họ quan trọng hơn tôi đúng" },
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
    id: "orientation",
    question: "Trong tình yêu, điều quan trọng nhất với bạn là gì?",
    hint: "Nền tảng không thể thiếu trong một mối quan hệ lý tưởng",
    icon: "shield-checkmark-outline" as const,
    options: [
      { id: "a", text: "Sự gắn kết sâu — tin tưởng, chia sẻ và thấu hiểu nhau hoàn toàn" },
      { id: "b", text: "Cùng nhau phát triển và hỗ trợ ước mơ của nhau" },
      { id: "c", text: "Đam mê, sức hút lãng mạn và những khoảnh khắc đặc biệt" },
      { id: "d", text: "Sự ổn định, có thể dựa vào nhau mỗi ngày" },
      { id: "e", text: "Niềm vui, sự hài hước và những kỷ niệm vui vẻ" },
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
];

// ─── Result calculation ───────────────────────────────────────────────────────

const LOVE_LANGUAGE_MAP: Record<string, { label: string; icon: string; desc: string }> = {
  a: { label: "Lời nói yêu thương", icon: "chatbubble-ellipses", desc: "Bạn cảm thấy được yêu nhất qua những lời nói chân thành, lời khen và lời khẳng định tình cảm." },
  b: { label: "Nhận quà tặng", icon: "gift", desc: "Đối với bạn, món quà dù nhỏ là biểu tượng của sự quan tâm — cho thấy người kia nghĩ đến mình." },
  c: { label: "Thời gian chất lượng", icon: "time", desc: "Sự hiện diện trọn vẹn và những khoảnh khắc chỉ có hai bạn là điều nuôi dưỡng tình yêu của bạn." },
  d: { label: "Hành động chăm sóc", icon: "hand-left", desc: "Những việc nhỏ như nấu ăn, giúp đỡ hay chú ý lo lắng — đó là ngôn ngữ tình yêu thực sự với bạn." },
  e: { label: "Đụng chạm thể chất", icon: "heart-circle", desc: "Sự gần gũi thể chất — ôm ấp, nắm tay, những cử chỉ ân cần — là cách bạn cảm nhận tình yêu sâu sắc nhất." },
};

// ECR 2-axis: Q1 avoidance score + Q2 anxiety score → quadrant
const AV_SCORE: Record<string, number> = { a: 10, b: 90, c: 20, d: 35 };
const AX_SCORE: Record<string, number> = { a: 10, b: 90, c: 40, d: 70 };
function deriveQuadrant(avoidance: string, anxiety: string): string {
  const av = AV_SCORE[avoidance] ?? 35;
  const ax = AX_SCORE[anxiety]   ?? 35;
  if (av < 45 && ax < 45) return 'a'; // Gắn bó an toàn
  if (av >= 45 && ax < 45) return 'b'; // Né tránh — lạnh lùng
  if (av < 45 && ax >= 45) return 'c'; // Lo lắng — bám víu
  return 'd';                           // Né tránh — lo âu (phức tạp)
}

const PERSONALITY_MAP: Record<string, { label: string; color: string; ionIcon: string }> = {
  a: { label: "Gắn bó an toàn",     color: "#059669", ionIcon: "heart-circle-outline" },
  b: { label: "Né tránh gắn bó",    color: "#7C3AED", ionIcon: "walk-outline" },
  c: { label: "Lo lắng gắn bó",     color: "#D97706", ionIcon: "alert-circle-outline" },
  d: { label: "Né tránh — lo âu",   color: "#DC2626", ionIcon: "refresh-circle-outline" },
};

const DATE_SUGGESTIONS: Record<string, string[]> = {
  a: ["Nấu ăn tại nhà + dinner by candlelight", "Movie night tự setup ở nhà", "Buổi tối ngắm sao (Stargazing date)"],
  b: ["Bữa tối tại nhà hàng yêu thích", "Cafe hopping + chụp ảnh phố", "Đêm nhạc acoustic / Live music"],
  c: ["Trekking / leo núi cùng nhau", "Roadtrip ngắn ngày", "Workshop làm gốm / vẽ tranh"],
  d: ["Đọc sách cùng nhau tại book cafe", "Picnic hoàng hôn", "Học kỹ năng mới cùng nhau"],
};

const STRENGTHS_MAP: Record<string, string[]> = {
  a: ["Giao tiếp cảm xúc cởi mở và chân thành", "Tạo không gian an toàn cho người yêu chia sẻ", "Cân bằng lành mạnh giữa gắn kết và không gian riêng"],
  b: ["Tự chủ cảm xúc, không phụ thuộc vào đối phương", "Mang lại không gian lành mạnh cho mối quan hệ", "Có chiều sâu nội tâm và quan điểm độc lập"],
  c: ["Trung thành và gắn bó sâu sắc với người mình yêu", "Luôn hiện diện đầy đủ khi người yêu cần", "Cảm xúc phong phú, chân thành và dễ đồng cảm"],
  d: ["Nhạy cảm và đồng cảm sâu sắc — hiểu được cảm xúc phức tạp của người khác", "Tự nhận thức cao về bản thân và sẵn sàng trưởng thành trong tình yêu", "Khi cảm thấy an toàn, có khả năng yêu thương sâu sắc và trung thành"],
};

function calculateResult(answers: Record<string, string>) {
  const quadrant = deriveQuadrant(answers.avoidance ?? "a", answers.anxiety ?? "a");
  const ll = LOVE_LANGUAGE_MAP[answers.receiving ?? "c"] ?? LOVE_LANGUAGE_MAP.c;
  const giving = LOVE_LANGUAGE_MAP[answers.giving ?? "c"] ?? LOVE_LANGUAGE_MAP.c;
  const personality = PERSONALITY_MAP[quadrant] ?? PERSONALITY_MAP.a;
  const dateSuggs = DATE_SUGGESTIONS[answers.date ?? "d"] ?? DATE_SUGGESTIONS.d;
  const strengths = STRENGTHS_MAP[quadrant] ?? STRENGTHS_MAP.a;

  return { ll, giving, personality, dateSuggs, strengths };
}

// ─── AI Result Type ───────────────────────────────────────────────────────────

interface AIPersonalityResult {
  personalityType: string;
  emoji: string;
  summary: string;
  loveLanguageReceiving: { label: string; description: string };
  loveLanguageGiving: { label: string; description: string };
  strengths: string[];
  growthAreas: string[];
  idealPartner: string;
  dateSuggestions: string[];
  adviceForPartner: string;
  isAI: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PersonalitySurveyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const styles = useStyles();
  const colors = useColors();
  const [phase, setPhase] = useState<"intro" | "survey" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [aiResult, setAiResult] = useState<AIPersonalityResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { handleAiError, rateLimitModal } = useAiRateLimit();

  useEffect(() => {
    if (phase !== 'result') return;

    // Build readable answers: { "Phong cách yêu?": "Tôi cần không gian riêng..." }
    setAiLoading(true);
    setAiResult(null);
    const readableAnswers: Record<string, string> = {};
    for (const q of QUESTIONS) {
      const optId = answers[q.id];
      if (!optId) continue;
      const opt = q.options.find(o => o.id === optId);
      if (opt) readableAnswers[q.question] = opt.text;
    }
    // rawAnswers giữ nguyên format { style: "a", receiving: "b", ... }
    // để BE dùng cho matrix scoring và fallback chính xác
    apiService.post<AIPersonalityResult>('/surveys/personality-analysis', {
      answers: readableAnswers,
      rawAnswers: answers,
    })
      .then(setAiResult)
      .catch((err) => handleAiError(err))
      .finally(() => setAiLoading(false));

    // Suggest articles
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
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>

            <View style={styles.introBadge}>
              <Ionicons name="sparkles" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.introBadgeText}>Khảo sát tính cách</Text>
            </View>

            <View style={styles.introIconWrap}>
              <Ionicons name="person-circle-outline" size={80} color="rgba(255,255,255,0.9)" />
            </View>

            <Text style={styles.introTitle}>Khám phá phong cách{"\n"}yêu thương của bạn</Text>
            <Text style={styles.introSub}>
              9 câu hỏi khoa học để hiểu sâu hơn về phong cách gắn bó, ngôn ngữ tình yêu và cách bạn kết nối với người thương.
            </Text>

            <View style={styles.introStats}>
              {[
                { icon: "help-circle-outline", text: "9 câu hỏi" },
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
    const ai = aiResult;

    // Derive display data: prefer AI, fallback to local
    const displayIonIcon = result.personality.ionIcon;
    const displayLabel = ai?.personalityType || result.personality.label;
    const displaySummary = ai?.summary;
    const displayLLReceiving = ai
      ? { label: ai.loveLanguageReceiving.label, desc: ai.loveLanguageReceiving.description }
      : { label: result.ll.label, desc: result.ll.desc };
    const displayLLGiving = ai
      ? { label: ai.loveLanguageGiving.label, desc: ai.loveLanguageGiving.description }
      : { label: result.giving.label, desc: "Cách bạn tự nhiên thể hiện tình cảm thường khác với cách bạn muốn nhận — đây là điều giúp cả hai hiểu nhau hơn." };
    const displayStrengths = ai?.strengths || result.strengths;
    const displayDateSuggs = ai?.dateSuggestions || result.dateSuggs;
    const displayGrowthAreas = ai?.growthAreas;
    const displayIdealPartner = ai?.idealPartner;
    const displayAdvice = ai?.adviceForPartner;
    const isAI = ai?.isAI === true;

    return (
      <View style={styles.flex}>
        <StatusBar barStyle="light-content" />
        <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <LinearGradient colors={["#7C3AED", "#C026D3"]} style={styles.resultHeader}>
            <SafeAreaView>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.resultBadgeWrap}>
                <Ionicons name={displayIonIcon as any} size={40} color={colors.white} />
                <View style={styles.resultPersonalityBadge}>
                  <Text style={styles.resultPersonalityLabel}>{displayLabel}</Text>
                </View>
                {isAI && (
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={12} color="#7C3AED" />
                    <Text style={styles.aiBadgeText}>AI phân tích</Text>
                  </View>
                )}
              </View>
              <Text style={styles.resultTitle}>Hồ sơ tính cách{"\n"}của bạn</Text>
            </SafeAreaView>
          </LinearGradient>

          <View style={styles.resultBody}>
            {/* AI Loading */}
            {aiLoading && (
              <View style={styles.aiLoadingCard}>
                <ActivityIndicator size="small" color="#7C3AED" />
                <Text style={styles.aiLoadingText}>AI đang phân tích tính cách của bạn...</Text>
              </View>
            )}

            {/* AI Summary */}
            {displaySummary && (
              <View style={[styles.resultCard, styles.summaryCard]}>
                <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                  <Ionicons name="sparkles" size={15} color={colors.primary} />
                  <Text style={styles.resultSectionTitle}>Tổng quan</Text>
                </View>
                <Text style={styles.resultCardDesc}>{displaySummary}</Text>
              </View>
            )}

            {/* Love language receiving */}
            <View style={styles.resultCard}>
              <View style={styles.resultCardHeader}>
                <View style={[styles.resultCardIcon, { backgroundColor: colors.warning + '15' }]}>
                  <Ionicons name={ai ? "heart" : result.ll.icon as any} size={22} color="#D97706" />
                </View>
                <View style={styles.resultCardInfo}>
                  <Text style={styles.resultCardLabel}>Ngôn ngữ tình yêu (nhận)</Text>
                  <Text style={styles.resultCardTitle}>{displayLLReceiving.label}</Text>
                </View>
              </View>
              <Text style={styles.resultCardDesc}>{displayLLReceiving.desc}</Text>
            </View>

            {/* Love language giving */}
            {displayLLGiving.label !== displayLLReceiving.label && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <View style={[styles.resultCardIcon, { backgroundColor: colors.primary + '12' }]}>
                    <Ionicons name={ai ? "gift" : result.giving.icon as any} size={22} color="#DB2777" />
                  </View>
                  <View style={styles.resultCardInfo}>
                    <Text style={styles.resultCardLabel}>Ngôn ngữ tình yêu (cho đi)</Text>
                    <Text style={styles.resultCardTitle}>{displayLLGiving.label}</Text>
                  </View>
                </View>
                <Text style={styles.resultCardDesc}>{displayLLGiving.desc}</Text>
              </View>
            )}

            {/* Strengths */}
            <View style={styles.resultCard}>
              <Text style={styles.resultSectionTitle}>Điểm mạnh trong tình yêu</Text>
              {displayStrengths.map((s, i) => (
                <View style={styles.strengthRow} key={i}>
                  <View style={styles.strengthDot} />
                  <Text style={styles.strengthText}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Growth areas (AI only) */}
            {displayGrowthAreas && displayGrowthAreas.length > 0 && (
              <View style={styles.resultCard}>
                <Text style={styles.resultSectionTitle}>Điều cần phát triển</Text>
                {displayGrowthAreas.map((s, i) => (
                  <View style={styles.strengthRow} key={i}>
                    <View style={[styles.strengthDot, { backgroundColor: "#D97706" }]} />
                    <Text style={styles.strengthText}>{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Ideal partner (AI only) */}
            {displayIdealPartner && (
              <View style={styles.resultCard}>
                <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                  <Ionicons name="heart" size={15} color={colors.primary} />
                  <Text style={styles.resultSectionTitle}>Người phù hợp với bạn</Text>
                </View>
                <Text style={styles.resultCardDesc}>{displayIdealPartner}</Text>
              </View>
            )}

            {/* Date suggestions */}
            <View style={styles.resultCard}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                <Text style={styles.resultSectionTitle}>Gợi ý hẹn hò cho bạn</Text>
              </View>
              {displayDateSuggs.map((s, i) => (
                <View style={styles.dateRow} key={i}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={styles.dateText}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Advice for partner (AI only) */}
            {displayAdvice && (
              <View style={[styles.resultCard, styles.adviceCard]}>
                <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                  <Ionicons name="mail-outline" size={15} color={colors.primary} />
                  <Text style={styles.resultSectionTitle}>Lời nhắn cho người yêu bạn</Text>
                </View>
                <Text style={styles.resultCardDesc}>{displayAdvice}</Text>
              </View>
            )}

            {/* Actions */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate("Suggestions", { openSurvey: true })}
              activeOpacity={0.85}
            >
              <Ionicons name="gift-outline" size={18} color={colors.white} />
              <Text style={styles.primaryBtnText}>Tìm quà phù hợp với tính cách này</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleRetake}>
              <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.secondaryBtnText}>Làm lại khảo sát</Text>
            </TouchableOpacity>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <View style={styles.articlesSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="book-outline" size={20} color="#8B5CF6" />
                  <Text style={styles.articlesSectionTitle}>Có thể bạn quan tâm</Text>
                </View>
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
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>

        <AiRateLimitModal {...rateLimitModal} />
      </View>
    );
  }

  // ── Survey ──
  const q = QUESTIONS[currentQ];
  const selectedOption = answers[q.id];

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.surveyHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.surveyBackBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.surveyProgress}>Câu {currentQ + 1}/{total}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.surveyBackBtn}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
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
            <Ionicons name={q.icon} size={28} color={colors.primary} />
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
              color={selectedOption ? colors.white : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles((colors) => ({
  flex: { flex: 1 },

  // Intro
  introWrap: { paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  backBtn: { position: "absolute", top: 16, right: 16, padding: 8, zIndex: 10 },
  introBadge: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6, marginBottom: 32,
  },
  introBadgeText: { color: colors.white, fontFamily: 'Manrope_600SemiBold', fontSize: 13 },
  introIconWrap: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  introTitle: {
    fontSize: 28, fontFamily: 'Manrope_800ExtraBold', color: colors.white,
    textAlign: "center", lineHeight: 36, marginBottom: 14,
  },
  introSub: {
    fontSize: 15, color: "rgba(255,255,255,0.82)",
    textAlign: "center", lineHeight: 22, marginBottom: 32,
  },
  introStats: { flexDirection: "row", gap: 20, marginBottom: 40 },
  introStat: { alignItems: "center", gap: 6 },
  introStatText: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontFamily: 'Manrope_500Medium'},
  introCta: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.surface, paddingHorizontal: 32, paddingVertical: 16,
    borderRadius: 30, width: "100%", justifyContent: "center",
  },
  introCtaText: { fontSize: 17, fontFamily: 'Manrope_700Bold', color: "#7C3AED" },

  // Survey
  surveyHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  surveyBackBtn: { padding: 6 },
  surveyProgress: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: colors.textSecondary },
  progressTrack: {
    height: 4, backgroundColor: colors.border,
    marginHorizontal: 16, borderRadius: 2, marginBottom: 8,
  },
  progressFill: {
    height: "100%", borderRadius: 2,
    backgroundColor: "#7C3AED",
  },
  surveyContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  questionIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  questionText: {
    fontSize: 20, fontFamily: 'Manrope_700Bold', color: colors.textPrimary,
    lineHeight: 28, marginBottom: 8,
  },
  questionHint: {
    fontSize: 13, color: colors.textSecondary, marginBottom: 24,
  },
  optionsWrap: { gap: 10 },
  optionBtn: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: colors.border,
  },
  optionBtnSelected: {
    borderColor: "#7C3AED", backgroundColor: "#7C3AED10",
  },
  optionRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: colors.border, alignItems: "center", justifyContent: "center",
    marginTop: 1, flexShrink: 0,
  },
  optionRadioSelected: { borderColor: "#7C3AED" },
  optionRadioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: "#7C3AED",
  },
  optionText: {
    flex: 1, fontSize: 14, color: colors.textPrimary, lineHeight: 20,
  },
  optionTextSelected: { color: "#7C3AED", fontFamily: 'Manrope_600SemiBold'},
  surveyFooter: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#7C3AED", borderRadius: 14, paddingVertical: 16,
  },
  nextBtnDisabled: { backgroundColor: colors.border },
  nextBtnText: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: colors.white },

  // Result
  resultHeader: { paddingHorizontal: 24, paddingBottom: 32 },
  resultBadgeWrap: { alignItems: "center", marginTop: 16, marginBottom: 12 },
  resultEmoji: { fontSize: 48, marginBottom: 8 },
  resultPersonalityBadge: {
    backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  resultPersonalityLabel: { color: colors.white, fontFamily: 'Manrope_700Bold', fontSize: 15 },
  resultTitle: {
    fontSize: 24, fontFamily: 'Manrope_800ExtraBold', color: colors.white,
    textAlign: "center", lineHeight: 32, marginTop: 12,
  },
  resultBody: { padding: 16, gap: 12 },
  resultCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  resultCardHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 10 },
  resultCardIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  resultCardInfo: { flex: 1 },
  resultCardLabel: { fontSize: 11, color: colors.textSecondary, fontFamily: 'Manrope_500Medium', marginBottom: 2 },
  resultCardTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: colors.textPrimary },
  resultCardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  resultSectionTitle: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: colors.textPrimary, marginBottom: 12 },
  strengthRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  strengthDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7C3AED", marginTop: 6 },
  strengthText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  dateRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  dateText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, marginTop: 4,
  },
  primaryBtnText: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: colors.white },
  secondaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 12,
  },
  secondaryBtnText: { fontSize: 14, color: colors.textSecondary },

  // Related articles
  articlesSection: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  articlesSectionTitle: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: colors.textPrimary, marginBottom: 4 },
  articleCard: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10,
  },
  articleCardBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  articleIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.info + '12', alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  articleEmoji: { fontSize: 22 },
  articleInfo: { flex: 1 },
  articleTitle: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: colors.textPrimary, lineHeight: 20, marginBottom: 3 },
  articleMeta: { fontSize: 12, color: colors.textSecondary },

  // AI result
  aiBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.info + '12', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 8,
  },
  aiBadgeText: { fontSize: 11, fontFamily: 'Manrope_600SemiBold', color: "#7C3AED" },
  aiLoadingCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.info + '12', borderRadius: 14, padding: 14,
  },
  aiLoadingText: { fontSize: 13, color: "#7C3AED", fontFamily: 'Manrope_500Medium'},
  summaryCard: { borderColor: "#7C3AED30", backgroundColor: '#7C3AED18' },
  adviceCard: { borderColor: "#EC489930", backgroundColor: colors.primary + '12' },
}));export default PersonalitySurveyScreen;
