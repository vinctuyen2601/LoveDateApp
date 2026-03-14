import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  Image,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { shareAsync } from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";
import MBTIShareCard from "../components/share/MBTIShareCard";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "@themes/colors";
import { Article } from "../data/articles";
import { suggestArticlesForSurvey } from "../services/articleService";
import { MBTI_TYPES } from "../data/mbtiTypes";

const MBTI_COLORS: [string, string] = ["#0EA5E9", "#6366F1"];

const MBTI_CATEGORY_LABELS: Record<string, string> = {
  personality: "Tính cách",
  communication: "Giao tiếp",
  dates: "Hẹn hò",
  gifts: "Quà tặng",
  zodiac: "Cung hoàng đạo",
  all: "Tổng hợp",
};

const { width, height } = Dimensions.get("window");

// MBTI dimensions
type MBTIDimension = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

interface MBTIQuestion {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  dimensionA: MBTIDimension; // E, S, T, J
  dimensionB: MBTIDimension; // I, N, F, P
  category: "EI" | "SN" | "TF" | "JP";
}

interface MBTIResult {
  type: string; // INTJ, ENFP, etc.
  description: string;
  strengths: string[];
  weaknesses: string[];
  loveStyle: string;
  giftIdeas: string[];
  compatibility: {
    best: string[];
    good: string[];
    challenging: string[];
  };
}

const MBTISurveyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, MBTIDimension>>({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<MBTIResult | null>(null);
  const [surveyFor, setSurveyFor] = useState<"self" | "partner" | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const cardRef = useRef<View>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!showResult || !result) return;
    suggestArticlesForSurvey("mbti", {
      mbtiType: result.type,
      description: result.description,
      loveStyle: result.loveStyle,
      compatibility: result.compatibility,
    })
      .then(setRelatedArticles)
      .catch(() => {});
  }, [showResult]);

  const animateTransition = (cb: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      cb();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }, 120);
  };

  const handleShareCard = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: "png", quality: 1 });
      await shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Chia sẻ kết quả MBTI",
      });
    } catch {
      // user cancelled hoặc lỗi
    } finally {
      setIsSharing(false);
    }
  };

  // 40 câu hỏi MBTI chuẩn - 10 câu mỗi chiều
  const mbtiQuestions: MBTIQuestion[] = [
    // E-I (Extroversion vs Introversion) - 10 questions
    {
      id: 1,
      question: "Sau một ngày dài, bạn cảm thấy như thế nào?",
      optionA: "Tràn đầy năng lượng sau khi gặp gỡ nhiều người",
      optionB: "Cần thời gian một mình để nạp lại năng lượng",
      dimensionA: "E",
      dimensionB: "I",
      category: "EI",
    },
    {
      id: 2,
      question: "Khi tham gia một bữa tiệc, bạn thường:",
      optionA: "Chủ động trò chuyện với nhiều người",
      optionB: "Chỉ nói chuyện với vài người quen",
      dimensionA: "E",
      dimensionB: "I",
      category: "EI",
    },
    {
      id: 3,
      question: "Bạn thích làm việc:",
      optionA: "Trong nhóm, có nhiều người xung quanh",
      optionB: "Một mình, tập trung vào công việc",
      dimensionA: "E",
      dimensionB: "I",
      category: "EI",
    },
    {
      id: 4,
      question: "Khi gặp vấn đề, bạn:",
      optionA: "Chia sẻ với nhiều người để lấy ý kiến",
      optionB: "Suy nghĩ kỹ trong đầu trước khi nói ra",
      dimensionA: "E",
      dimensionB: "I",
      category: "EI",
    },
    {
      id: 5,
      question: "Bạn cảm thấy thoải mái hơn khi:",
      optionA: "Nói trước, nghĩ sau",
      optionB: "Nghĩ kỹ trước khi nói",
      dimensionA: "E",
      dimensionB: "I",
      category: "EI",
    },
    {
      id: 6,
      question: "Vào cuối tuần, bạn muốn:",
      optionA: "Ra ngoài gặp gỡ bạn bè, tham gia hoạt động",
      optionB: "Ở nhà nghỉ ngơi, làm việc riêng tư",
      dimensionA: "E",
      dimensionB: "I",
      category: "EI",
    },
    {
      id: 7,
      question: "Bạn có xu hướng:",
      optionA: "Có nhiều bạn bè, quen biết rộng",
      optionB: "Có ít bạn thân, quan hệ sâu sắc",
      dimensionA: "E",
      dimensionB: "I",
      category: "EI",
    },
    {
      id: 8,
      question: "Khi học bài mới, bạn thích:",
      optionA: "Thảo luận nhóm, trao đổi với người khác",
      optionB: "Tự học, đọc sách một mình",
      dimensionA: "E",
      dimensionB: "I",
      category: "EI",
    },
    {
      id: 9,
      question: "Trong giao tiếp, bạn:",
      optionA: "Dễ dàng bắt chuyện với người lạ",
      optionB: "Cần thời gian để làm quen",
      dimensionA: "E",
      dimensionB: "I",
      category: "EI",
    },
    {
      id: 10,
      question: "Bạn được coi là người:",
      optionA: "Hoạt bát, nhiệt tình, dễ gần",
      optionB: "Trầm tĩnh, kín đáo, sâu sắc",
      dimensionA: "E",
      dimensionB: "I",
      category: "EI",
    },

    // S-N (Sensing vs Intuition) - 10 questions
    {
      id: 11,
      question: "Khi tiếp nhận thông tin, bạn chú ý:",
      optionA: "Chi tiết cụ thể, sự thật rõ ràng",
      optionB: "Ý nghĩa sâu xa, khả năng tiềm ẩn",
      dimensionA: "S",
      dimensionB: "N",
      category: "SN",
    },
    {
      id: 12,
      question: "Bạn tin tưởng vào:",
      optionA: "Kinh nghiệm thực tế đã trải qua",
      optionB: "Trực giác và cảm nhận bên trong",
      dimensionA: "S",
      dimensionB: "N",
      category: "SN",
    },
    {
      id: 13,
      question: "Khi làm việc, bạn thích:",
      optionA: "Làm theo hướng dẫn cụ thể, từng bước",
      optionB: "Tự do sáng tạo, thử nghiệm cách mới",
      dimensionA: "S",
      dimensionB: "N",
      category: "SN",
    },
    {
      id: 14,
      question: "Bạn tập trung vào:",
      optionA: "Hiện tại, những gì đang xảy ra",
      optionB: "Tương lai, khả năng sẽ xảy ra",
      dimensionA: "S",
      dimensionB: "N",
      category: "SN",
    },
    {
      id: 15,
      question: "Trong trò chuyện, bạn thường:",
      optionA: "Nói về sự kiện cụ thể, chi tiết",
      optionB: "Nói về ý tưởng, khái niệm trừu tượng",
      dimensionA: "S",
      dimensionB: "N",
      category: "SN",
    },
    {
      id: 16,
      question: "Bạn thích đọc:",
      optionA: "Sách hướng dẫn thực hành, sách chuyên môn",
      optionB: "Sách triết lý, khoa học viễn tưởng",
      dimensionA: "S",
      dimensionB: "N",
      category: "SN",
    },
    {
      id: 17,
      question: "Khi mô tả một người, bạn nói về:",
      optionA: "Ngoại hình, trang phục, hành động cụ thể",
      optionB: "Tính cách, ấn tượng tổng thể, cảm giác",
      dimensionA: "S",
      dimensionB: "N",
      category: "SN",
    },
    {
      id: 18,
      question: "Bạn thường:",
      optionA: "Quan sát kỹ những gì xung quanh",
      optionB: "Suy nghĩ về ý nghĩa đằng sau",
      dimensionA: "S",
      dimensionB: "N",
      category: "SN",
    },
    {
      id: 19,
      question: "Trong học tập, bạn thích:",
      optionA: "Ví dụ thực tế, ứng dụng cụ thể",
      optionB: "Lý thuyết chung, nguyên lý tổng quát",
      dimensionA: "S",
      dimensionB: "N",
      category: "SN",
    },
    {
      id: 20,
      question: "Bạn được mô tả là người:",
      optionA: "Thực tế, tỉ mỉ, chú ý chi tiết",
      optionB: "Tưởng tượng phong phú, đầu óc sáng tạo",
      dimensionA: "S",
      dimensionB: "N",
      category: "SN",
    },

    // T-F (Thinking vs Feeling) - 10 questions
    {
      id: 21,
      question: "Khi ra quyết định, bạn dựa vào:",
      optionA: "Logic, phân tích khách quan",
      optionB: "Cảm xúc, giá trị cá nhân",
      dimensionA: "T",
      dimensionB: "F",
      category: "TF",
    },
    {
      id: 22,
      question: "Trong tranh luận, bạn coi trọng:",
      optionA: "Sự thật, đúng hay sai",
      optionB: "Cảm nhận của mọi người",
      dimensionA: "T",
      dimensionB: "F",
      category: "TF",
    },
    {
      id: 23,
      question: "Khi ai đó kể chuyện buồn, bạn:",
      optionA: "Đưa ra lời khuyên, giải pháp cụ thể",
      optionB: "Lắng nghe, chia sẻ cảm xúc",
      dimensionA: "T",
      dimensionB: "F",
      category: "TF",
    },
    {
      id: 24,
      question: "Bạn thích được khen:",
      optionA: "Thông minh, có năng lực",
      optionB: "Tốt bụng, chu đáo",
      dimensionA: "T",
      dimensionB: "F",
      category: "TF",
    },
    {
      id: 25,
      question: "Trong công việc nhóm, bạn:",
      optionA: "Tập trung vào hiệu quả, kết quả",
      optionB: "Quan tâm đến sự hòa hợp, tinh thần",
      dimensionA: "T",
      dimensionB: "F",
      category: "TF",
    },
    {
      id: 26,
      question: "Khi đánh giá người khác, bạn xem xét:",
      optionA: "Năng lực, thành tích",
      optionB: "Tính cách, thái độ",
      dimensionA: "T",
      dimensionB: "F",
      category: "TF",
    },
    {
      id: 27,
      question: "Bạn thường:",
      optionA: "Nói thẳng, trực tiếp",
      optionB: "Nói khéo, tế nhị để tránh làm tổn thương",
      dimensionA: "T",
      dimensionB: "F",
      category: "TF",
    },
    {
      id: 28,
      question: "Trong xung đột, bạn ưu tiên:",
      optionA: "Tìm ra ai đúng ai sai",
      optionB: "Giữ mối quan hệ hòa thuận",
      dimensionA: "T",
      dimensionB: "F",
      category: "TF",
    },
    {
      id: 29,
      question: "Bạn cảm thấy thoải mái với:",
      optionA: "Phê bình xây dựng, đánh giá khách quan",
      optionB: "Lời khen ngợi, động viên",
      dimensionA: "T",
      dimensionB: "F",
      category: "TF",
    },
    {
      id: 30,
      question: "Người khác thấy bạn là người:",
      optionA: "Công bằng, nguyên tắc, lý trí",
      optionB: "Ấm áp, đồng cảm, quan tâm",
      dimensionA: "T",
      dimensionB: "F",
      category: "TF",
    },

    // J-P (Judging vs Perceiving) - 10 questions
    {
      id: 31,
      question: "Trong cuộc sống, bạn thích:",
      optionA: "Lên kế hoạch, sắp xếp rõ ràng",
      optionB: "Linh hoạt, tùy cơ ứng biến",
      dimensionA: "J",
      dimensionB: "P",
      category: "JP",
    },
    {
      id: 32,
      question: "Khi làm việc, bạn:",
      optionA: "Làm trước hạn, không để việc tồn đọng",
      optionB: "Làm gần deadline, tốt nhất dưới áp lực",
      dimensionA: "J",
      dimensionB: "P",
      category: "JP",
    },
    {
      id: 33,
      question: "Phòng của bạn thường:",
      optionA: "Gọn gàng, mọi thứ đúng vị trí",
      optionB: "Hơi lộn xộn nhưng biết đồ ở đâu",
      dimensionA: "J",
      dimensionB: "P",
      category: "JP",
    },
    {
      id: 34,
      question: "Khi đi du lịch, bạn:",
      optionA: "Lên kế hoạch chi tiết từ trước",
      optionB: "Đi rồi tính, khám phá tự do",
      dimensionA: "J",
      dimensionB: "P",
      category: "JP",
    },
    {
      id: 35,
      question: "Bạn cảm thấy thoải mái khi:",
      optionA: "Mọi thứ đã quyết định, chắc chắn",
      optionB: "Còn nhiều lựa chọn mở",
      dimensionA: "J",
      dimensionB: "P",
      category: "JP",
    },
    {
      id: 36,
      question: "Trong làm việc nhóm, bạn thích:",
      optionA: "Phân công rõ ràng, đúng tiến độ",
      optionB: "Linh hoạt, điều chỉnh theo tình hình",
      dimensionA: "J",
      dimensionB: "P",
      category: "JP",
    },
    {
      id: 37,
      question: "Bạn thường:",
      optionA: "Làm danh sách việc cần làm",
      optionB: "Làm việc nào nhớ ra việc đó",
      dimensionA: "J",
      dimensionB: "P",
      category: "JP",
    },
    {
      id: 38,
      question: "Khi có kế hoạch bị thay đổi, bạn:",
      optionA: "Khó chịu, cảm thấy mất kiểm soát",
      optionB: "Không sao, thích sự bất ngờ",
      dimensionA: "J",
      dimensionB: "P",
      category: "JP",
    },
    {
      id: 39,
      question: "Bạn thích làm việc:",
      optionA: "Theo lịch trình cố định",
      optionB: "Theo cảm hứng, không gò bó",
      dimensionA: "J",
      dimensionB: "P",
      category: "JP",
    },
    {
      id: 40,
      question: "Người khác mô tả bạn là:",
      optionA: "Có tổ chức, kỷ luật, đáng tin cậy",
      optionB: "Thoải mái, tự nhiên, linh hoạt",
      dimensionA: "J",
      dimensionB: "P",
      category: "JP",
    },
  ];

  const calculateMBTI = (): string => {
    const scores: Record<MBTIDimension, number> = {
      E: 0,
      I: 0,
      S: 0,
      N: 0,
      T: 0,
      F: 0,
      J: 0,
      P: 0,
    };

    Object.values(answers).forEach((answer) => {
      scores[answer]++;
    });

    const type = [
      scores.E >= scores.I ? "E" : "I",
      scores.S >= scores.N ? "S" : "N",
      scores.T >= scores.F ? "T" : "F",
      scores.J >= scores.P ? "J" : "P",
    ].join("");

    return type;
  };

  const getMBTIResult = (type: string): MBTIResult => {
    const typeInfo = MBTI_TYPES[type] || MBTI_TYPES["INFP"];
    return {
      type: typeInfo.type,
      description: `${typeInfo.name} - ${typeInfo.shortDesc}`,
      strengths: typeInfo.strengths,
      weaknesses: typeInfo.weaknesses,
      loveStyle: typeInfo.loveStyle,
      giftIdeas: typeInfo.giftIdeas,
      compatibility: typeInfo.compatibility,
    };
  };

  const handleAnswer = (dimension: MBTIDimension) => {
    const newAnswers = { ...answers, [currentStep]: dimension };
    setAnswers(newAnswers);

    if (currentStep < mbtiQuestions.length - 1) {
      animateTransition(() => setCurrentStep(currentStep + 1));
    } else {
      // Survey completed
      const mbtiType = calculateMBTI();
      const mbtiResult = getMBTIResult(mbtiType);
      setResult(mbtiResult);
      setShowResult(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    setResult(null);
  };

  const progress = ((currentStep + 1) / mbtiQuestions.length) * 100;
  const currentQuestion = mbtiQuestions[currentStep];

  if (!surveyFor) {
    return (
      <View style={styles.flex}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={MBTI_COLORS} style={styles.flex}>
          <SafeAreaView style={[styles.flex, styles.introWrap]}>
            <TouchableOpacity
              style={styles.introCloseBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.introBadge}>
              <Text style={styles.introBadgeText}>🧠 Trắc nghiệm MBTI</Text>
            </View>

            <View style={styles.introIconWrap}>
              <Ionicons
                name="analytics-outline"
                size={72}
                color="rgba(255,255,255,0.9)"
              />
            </View>

            <Text style={styles.introTitle}>
              Khám phá tính cách{"\n"}MBTI của bạn
            </Text>
            <Text style={styles.introSub}>
              40 câu hỏi khoa học giúp bạn hiểu rõ bản thân hoặc người thương
              qua 16 nhóm tính cách chuẩn quốc tế.
            </Text>

            <View style={styles.introStats}>
              {[
                { icon: "help-circle-outline", text: "40 câu hỏi" },
                { icon: "time-outline", text: "10 phút" },
                { icon: "people-outline", text: "16 nhóm tính cách" },
              ].map((s) => (
                <View style={styles.introStat} key={s.text}>
                  <Ionicons
                    name={s.icon as any}
                    size={18}
                    color="rgba(255,255,255,0.85)"
                  />
                  <Text style={styles.introStatText}>{s.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.introGuideBtn}
              onPress={() => navigation.navigate("MBTIGuide")}
              activeOpacity={0.8}
            >
              <Ionicons name="book-outline" size={16} color="#fff" />
              <Text style={styles.introGuideBtnText}>
                Tìm hiểu 16 nhóm tính cách
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>

            <Text style={styles.introChooseLabel}>
              Bạn muốn khảo sát cho ai?
            </Text>

            <View style={styles.introCards}>
              <TouchableOpacity
                style={styles.introCard}
                onPress={() => setSurveyFor("self")}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.introCardIcon,
                    { backgroundColor: "rgba(255,255,255,0.15)" },
                  ]}
                >
                  <Ionicons name="person" size={32} color="#fff" />
                </View>
                <Text style={styles.introCardTitle}>Cho bản thân</Text>
                <Text style={styles.introCardDesc}>
                  Tìm hiểu tính cách của bạn
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.introCard}
                onPress={() => setSurveyFor("partner")}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.introCardIcon,
                    { backgroundColor: "rgba(255,255,255,0.15)" },
                  ]}
                >
                  <Ionicons name="heart" size={32} color="#fff" />
                </View>
                <Text style={styles.introCardTitle}>Cho người thương</Text>
                <Text style={styles.introCardDesc}>
                  Hiểu rõ hơn về người ấy
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (showResult && result) {
    return (
      <View style={styles.flex}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultContainer}
        >
          {/* Gradient header */}
          <LinearGradient
            colors={MBTI_COLORS}
            style={styles.resultGradientHeader}
          >
            <SafeAreaView>
              <TouchableOpacity
                style={styles.resultCloseBtn}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.resultHeaderInner}>
                <Ionicons name="trophy" size={48} color="#FFD700" />
                <View style={styles.resultTypeBadge}>
                  <Text style={styles.resultType}>{result.type}</Text>
                </View>
                <Text style={styles.resultDescription}>
                  {result.description}
                </Text>
              </View>
            </SafeAreaView>
          </LinearGradient>

          <View style={styles.resultBody}>
            <View style={styles.resultSection}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:16}}>
                <Ionicons name="barbell-outline" size={18} color={COLORS.textPrimary} />
                <Text style={[styles.sectionTitle,{marginBottom:0}]}>Điểm mạnh</Text>
              </View>
              {result.strengths.map((strength, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.success}
                  />
                  <Text style={styles.listText}>{strength}</Text>
                </View>
              ))}
            </View>

            <View style={styles.resultSection}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:16}}>
                <Ionicons name="flag-outline" size={18} color={COLORS.textPrimary} />
                <Text style={[styles.sectionTitle,{marginBottom:0}]}>Điểm cần phát triển</Text>
              </View>
              {result.weaknesses.map((weakness, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color={COLORS.warning}
                  />
                  <Text style={styles.listText}>{weakness}</Text>
                </View>
              ))}
            </View>

            <View style={styles.resultSection}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:16}}>
                <Ionicons name="heart" size={18} color={COLORS.primary} />
                <Text style={[styles.sectionTitle,{marginBottom:0}]}>Phong cách yêu</Text>
              </View>
              <Text style={styles.loveStyleText}>{result.loveStyle}</Text>
            </View>

            <View style={styles.resultSection}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:16}}>
                <Ionicons name="gift-outline" size={18} color={COLORS.textPrimary} />
                <Text style={[styles.sectionTitle,{marginBottom:0}]}>Gợi ý quà tặng</Text>
              </View>
              {result.giftIdeas.map((gift, index) => (
                <View key={index} style={styles.giftItem}>
                  <Ionicons name="gift" size={18} color={COLORS.primary} />
                  <Text style={styles.giftText}>{gift}</Text>
                </View>
              ))}
            </View>

            <View style={styles.resultSection}>
              <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:16}}>
                <Ionicons name="people-outline" size={18} color={COLORS.textPrimary} />
                <Text style={[styles.sectionTitle,{marginBottom:0}]}>Độ tương thích</Text>
              </View>

              <View style={styles.compatibilityCard}>
                <Text style={styles.compatibilityTitle}>Tuyệt vời</Text>
                {result.compatibility.best.map((t) => {
                  const info = MBTI_TYPES[t];
                  return (
                    <View key={t} style={styles.compatItem}>
                      <Text style={styles.compatEmoji}>
                        {info?.emoji || "❓"}
                      </Text>
                      <Text style={styles.compatName}>
                        {t} — {info?.name || ""}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.compatibilityCard}>
                <Text style={styles.compatibilityTitle}>Tốt 👍</Text>
                {result.compatibility.good.map((t) => {
                  const info = MBTI_TYPES[t];
                  return (
                    <View key={t} style={styles.compatItem}>
                      <Text style={styles.compatEmoji}>
                        {info?.emoji || "❓"}
                      </Text>
                      <Text style={styles.compatName}>
                        {t} — {info?.name || ""}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.compatibilityCard}>
                <Text style={styles.compatibilityTitle}>Cần nỗ lực 💪</Text>
                {result.compatibility.challenging.map((t) => {
                  const info = MBTI_TYPES[t];
                  return (
                    <View key={t} style={styles.compatItem}>
                      <Text style={styles.compatEmoji}>
                        {info?.emoji || "❓"}
                      </Text>
                      <Text style={styles.compatName}>
                        {t} — {info?.name || ""}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Nút Share */}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => setShowShareModal(true)}
            >
              <Ionicons
                name="share-social-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.shareButtonText}>Chia sẻ kết quả</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restartButton}
              onPress={handleRestart}
            >
              <Ionicons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.restartButtonText}>Làm lại bài test</Text>
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
                    style={[
                      styles.articleCard,
                      i > 0 && styles.articleCardBorder,
                    ]}
                    onPress={() =>
                      (navigation as any).navigate("ArticleDetail", { article })
                    }
                    activeOpacity={0.72}
                  >
                    {article.imageUrl ? (
                      <Image
                        source={
                          typeof article.imageUrl === "string"
                            ? { uri: article.imageUrl }
                            : article.imageUrl
                        }
                        style={styles.articleImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.articleIconBox,
                          { backgroundColor: article.color + "22" },
                        ]}
                      >
                        <Ionicons
                          name={article.icon as any}
                          size={22}
                          color={article.color}
                        />
                      </View>
                    )}
                    <View style={styles.articleInfo}>
                      <Text style={styles.articleTitle} numberOfLines={2}>
                        {article.title}
                      </Text>
                      <Text style={styles.articleMeta}>
                        {MBTI_CATEGORY_LABELS[article.category] ??
                          article.category}{" "}
                        · {article.readTime ?? 5} phút đọc
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </View>
          {/* end resultBody */}
        </ScrollView>

        {/* Share Modal */}
        <Modal
          visible={showShareModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowShareModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />

              <Text style={styles.modalTitle}>Chia sẻ kết quả MBTI</Text>
              <Text style={styles.modalSubtitle}>
                Bạn bè sẽ thấy loại tính cách của bạn
              </Text>

              {/* Card preview */}
              <View style={styles.cardWrapper}>
                <View ref={cardRef} collapsable={false}>
                  <MBTIShareCard result={result!} />
                </View>
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowShareModal(false)}
                >
                  <Text style={styles.modalCloseBtnText}>Đóng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.shareActionBtn,
                    isSharing && styles.shareActionBtnDisabled,
                  ]}
                  onPress={handleShareCard}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Ionicons
                      name="share-social"
                      size={20}
                      color={COLORS.white}
                    />
                  )}
                  <Text style={styles.shareActionText}>
                    {isSharing ? "Đang xử lý..." : "Chia sẻ ngay"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          Câu {currentStep + 1}/{mbtiQuestions.length}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={styles.questionContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.categoryBadge,{flexDirection:'row',alignItems:'center',gap:5}]}>
          {currentQuestion.category === "EI" && <><Ionicons name="chatbubble-outline" size={13} color={COLORS.primary} /><Text style={{fontSize:13,color:COLORS.primary,fontWeight:'600'}}>Năng lượng</Text></>}
          {currentQuestion.category === "SN" && <><Ionicons name="bulb-outline" size={13} color={COLORS.primary} /><Text style={{fontSize:13,color:COLORS.primary,fontWeight:'600'}}>Thu nhận thông tin</Text></>}
          {currentQuestion.category === "TF" && <><Ionicons name="heart-outline" size={13} color={COLORS.primary} /><Text style={{fontSize:13,color:COLORS.primary,fontWeight:'600'}}>Ra quyết định</Text></>}
          {currentQuestion.category === "JP" && <><Ionicons name="calendar-outline" size={13} color={COLORS.primary} /><Text style={{fontSize:13,color:COLORS.primary,fontWeight:'600'}}>Lối sống</Text></>}
        </View>

        <Text style={styles.question}>{currentQuestion.question}</Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              answers[currentStep] === currentQuestion.dimensionA &&
                styles.optionButtonSelected,
            ]}
            onPress={() => handleAnswer(currentQuestion.dimensionA)}
            activeOpacity={0.8}
          >
            <View style={styles.optionContent}>
              <View
                style={[
                  styles.optionRadio,
                  answers[currentStep] === currentQuestion.dimensionA &&
                    styles.optionRadioSelected,
                ]}
              >
                {answers[currentStep] === currentQuestion.dimensionA && (
                  <View style={styles.optionRadioInner} />
                )}
              </View>
              <Text
                style={[
                  styles.optionText,
                  answers[currentStep] === currentQuestion.dimensionA &&
                    styles.optionTextSelected,
                ]}
              >
                {currentQuestion.optionA}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              answers[currentStep] === currentQuestion.dimensionB &&
                styles.optionButtonSelected,
            ]}
            onPress={() => handleAnswer(currentQuestion.dimensionB)}
            activeOpacity={0.8}
          >
            <View style={styles.optionContent}>
              <View
                style={[
                  styles.optionRadio,
                  answers[currentStep] === currentQuestion.dimensionB &&
                    styles.optionRadioSelected,
                ]}
              >
                {answers[currentStep] === currentQuestion.dimensionB && (
                  <View style={styles.optionRadioInner} />
                )}
              </View>
              <Text
                style={[
                  styles.optionText,
                  answers[currentStep] === currentQuestion.dimensionB &&
                    styles.optionTextSelected,
                ]}
              >
                {currentQuestion.optionB}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Intro (gradient) ──
  introWrap: {
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  introCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  introBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 24,
  },
  introBadgeText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  introIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 12,
  },
  introSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  introStats: { flexDirection: "row", gap: 20, marginBottom: 28 },
  introStat: { alignItems: "center", gap: 6 },
  introStatText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  introGuideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 24,
  },
  introGuideBtnText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  introChooseLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
    marginBottom: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  introCards: { flexDirection: "row", gap: 14, width: "100%" },
  introCard: {
    flex: 1,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  introCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  introCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  introCardDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },

  // ── Survey header / progress ──
  closeButton: { alignSelf: "flex-end", padding: 8 },
  introContainer: { flex: 1, padding: 20 },
  introContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.info}15`,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.info, lineHeight: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  headerText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  progressBarContainer: {
    height: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressBar: { height: "100%", backgroundColor: "#6366F1", borderRadius: 2 },
  questionContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    color: "#6366F1",
    backgroundColor: "#6366F115",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  question: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 30,
    marginBottom: 24,
  },
  optionsContainer: { gap: 12 },
  optionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionButtonSelected: {
    borderColor: "#6366F1",
    backgroundColor: "#6366F10D",
  },
  optionContent: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  optionRadioSelected: { borderColor: "#6366F1" },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6366F1",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  optionTextSelected: { color: "#6366F1", fontWeight: "600" },

  // ── Result ──
  resultContainer: { paddingBottom: 24 },
  resultGradientHeader: { paddingHorizontal: 24, paddingBottom: 32 },
  resultHeaderInner: { alignItems: "center", marginTop: 8, marginBottom: 4 },
  resultEmoji: { fontSize: 52, marginBottom: 10 },
  resultTypeBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginBottom: 12,
  },
  resultType: { fontSize: 22, fontWeight: "800", color: "#fff" },
  resultDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
    lineHeight: 22,
  },
  resultCloseBtn: { position: "absolute", top: 0, right: 0, padding: 8 },
  resultBody: { padding: 16, gap: 12 },
  resultHeader: { alignItems: "center", marginBottom: 32, marginTop: 20 },
  resultSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  loveStyleText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  giftItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: 8,
  },
  giftText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  compatibilityCard: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  compatibilityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  compatItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  compatEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  compatName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  restartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },

  // Share button (trên restartButton)
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // Share Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center" as const,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  cardWrapper: {
    alignSelf: "center" as const,
    borderRadius: 24,
    overflow: "hidden" as const,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row" as const,
    gap: 12,
    width: "100%" as const,
  },
  modalCloseBtn: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.background,
  },
  modalCloseBtnText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  shareActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  shareActionBtnDisabled: {
    opacity: 0.7,
  },
  shareActionText: {
    flex: 0.5,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },

  // Related articles
  articlesSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  articlesSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  articleCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 10,
  },
  articleCardBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  articleImage: {
    width: 72,
    height: 52,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    flexShrink: 0,
  },
  articleIconBox: {
    width: 72,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  articleEmoji: { fontSize: 22 },
  articleInfo: { flex: 1 },
  articleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 3,
  },
  articleMeta: { fontSize: 12, color: COLORS.textSecondary },
});

export default MBTISurveyScreen;
