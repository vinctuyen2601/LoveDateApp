import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@themes/colors";
import { filterSuggestions, Suggestion } from "../../data/suggestions";

interface SurveyQuestion {
  id: string;
  question: string;
  questionHint?: string;
  type: "single" | "multiple" | "text";
  options?: string[];
  maxSelections?: number;
  placeholder?: string;
  condition?: (answers: Record<string, any>) => boolean;
}

interface SurveyModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (suggestions: Suggestion[], answers: Record<string, any>) => void;
}

const QUESTION_ICONS: Record<string, string> = {
  gender: "people-outline",
  relationship: "heart-outline",
  relationship_duration: "time-outline",
  personality: "person-outline",
  hobbies: "game-controller-outline",
  hobbies_other: "create-outline",
  needs: "star-outline",
  love_language: "chatbubble-ellipses-outline",
  style: "shirt-outline",
  budget: "wallet-outline",
  occasion: "calendar-outline",
  gift_purpose: "gift-outline",
};

const SurveyModal: React.FC<SurveyModalProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const insets = useSafeAreaInsets();
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [currentMultipleSelections, setCurrentMultipleSelections] = useState<
    string[]
  >([]);
  const [currentTextInput, setCurrentTextInput] = useState<string>("");

  useEffect(() => {
    if (visible) {
      setSurveyAnswers({});
      setSurveyStep(0);
      setCurrentMultipleSelections([]);
      setCurrentTextInput("");
      progressAnim.setValue(0);
      fadeAnim.setValue(1);
    }
  }, [visible]);

  const animateNext = (cb: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      cb();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 140);
  };

  const surveyQuestions = useMemo(
    (): SurveyQuestion[] => [
      {
        id: "gender",
        question: "Người bạn muốn tặng quà thuộc giới tính nào?",
        questionHint: "Giúp chúng tôi gợi ý quà phù hợp với sở thích chung",
        type: "single",
        options: ["Nam", "Nữ", "Khác"],
      },
      {
        id: "relationship",
        question: "Bạn muốn tìm quà cho ai?",
        questionHint:
          "Mối quan hệ khác nhau sẽ có cách thể hiện tình cảm khác nhau",
        type: "single",
        options: [
          "Người yêu/Vợ/Chồng",
          "Cha/Mẹ",
          "Anh/Chị/Em ruột",
          "Bạn thân",
          "Đồng nghiệp/Sếp",
          "Người mới quen",
        ],
      },
      {
        id: "relationship_duration",
        question: "Bạn và người ấy đã yêu nhau được bao lâu?",
        questionHint: "Giai đoạn khác nhau cần quà khác nhau",
        type: "single",
        options: [
          "Dưới 3 tháng (Mới yêu)",
          "3-6 tháng (Đang tìm hiểu)",
          "6 tháng - 1 năm",
          "1-3 năm",
          "Trên 3 năm",
          "Đã kết hôn",
        ],
        condition: (answers) => answers.relationship === "Người yêu/Vợ/Chồng",
      },
      {
        id: "personality",
        question: "Tính cách của người đó? (Chọn tối đa 3)",
        questionHint: "Hiểu tính cách giúp chọn quà hợp gu",
        type: "multiple",
        maxSelections: 3,
        options: [
          "Hướng ngoại, thích giao lưu",
          "Hướng nội, trầm tĩnh",
          "Lãng mạn, mơ mộng",
          "Thực tế, cụ thể",
          "Thích công nghệ, hiện đại",
          "Thích cổ điển, truyền thống",
          "Năng động, thể thao",
          "Nghệ thuật, sáng tạo",
          "Chu đáo, tỉ mỉ",
          "Tự do, phóng khoáng",
        ],
      },
      {
        id: "hobbies",
        question: "Người đó thường làm gì lúc rảnh? (Chọn nhiều đáp án)",
        questionHint: "Quà liên quan đến sở thích luôn được yêu thích",
        type: "multiple",
        maxSelections: 5,
        options: [
          "Đọc sách/Truyện/Manga",
          "Xem phim/Series/Anime",
          "Nghe nhạc/Đi concert",
          "Chơi game (Mobile/PC/Console)",
          "Thể thao (Gym/Yoga/Chạy bộ/Bơi)",
          "Du lịch/Khám phá",
          "Nấu ăn/Làm bánh",
          "Chụp ảnh/Quay video",
          "Mua sắm/Làm đẹp",
          "Vẽ/Handmade/DIY",
          "Chơi với thú cưng",
          "Gặp gỡ bạn bè",
        ],
      },
      {
        id: "hobbies_other",
        question: "Có sở thích đặc biệt nào khác không?",
        questionHint: "VD: Sưu tầm mô hình, chơi nhạc cụ, làm vườn...",
        type: "text",
        placeholder: "Nhập sở thích khác (nếu có)...",
      },
      {
        id: "needs",
        question:
          surveyAnswers.gender === "Nam"
            ? "Điều anh ấy đang cần/muốn nhất hiện tại?"
            : surveyAnswers.gender === "Nữ"
            ? "Điều cô ấy đang cần/muốn nhất hiện tại?"
            : "Điều họ đang cần/muốn nhất hiện tại?",
        questionHint: "Quà thiết thực luôn có giá trị cao",
        type: "multiple",
        maxSelections: 3,
        options:
          surveyAnswers.gender === "Nam"
            ? [
                "Nâng cấp đồ công nghệ",
                "Đồ thể thao/Gym",
                "Quần áo/Giày dép mới",
                "Đồ dùng công việc",
                "Thư giãn/Giảm stress",
                "Cải thiện ngoại hình",
                "Học hỏi kỹ năng mới",
                "Giải trí/Vui chơi",
              ]
            : surveyAnswers.gender === "Nữ"
            ? [
                "Đồ skincare/Makeup",
                "Quần áo/Túi xách/Giày",
                "Trang sức/Phụ kiện",
                "Thư giãn/Spa/Massage",
                "Đồ dùng nhà cửa",
                "Sách/Khóa học",
                "Du lịch/Trải nghiệm",
                "Đồ công nghệ/Gadget",
              ]
            : [
                "Đồ công nghệ",
                "Quần áo/Phụ kiện",
                "Thư giãn/Giải trí",
                "Học tập/Phát triển",
                "Sức khỏe/Làm đẹp",
                "Du lịch/Trải nghiệm",
              ],
      },
      {
        id: "love_language",
        question: "Người đó cảm nhận tình cảm qua cách nào nhiều nhất?",
        questionHint: "Hiểu 5 ngôn ngữ yêu thương để thể hiện đúng cách",
        type: "single",
        options: [
          "Lời nói ngọt ngào, khen ngợi",
          "Thời gian chất lượng bên nhau",
          "Nhận quà tặng, dù nhỏ",
          "Hành động phục vụ (làm việc giúp đỡ)",
          "Chạm chạm, ôm ấp, nắm tay",
          "Chưa rõ/Không chắc",
        ],
        condition: (answers) =>
          answers.relationship === "Người yêu/Vợ/Chồng" ||
          answers.relationship === "Bạn thân",
      },
      {
        id: "style",
        question:
          surveyAnswers.gender === "Nam"
            ? "Phong cách ăn mặc của anh ấy?"
            : surveyAnswers.gender === "Nữ"
            ? "Phong cách thời trang cô ấy thích?"
            : "Phong cách của họ?",
        questionHint: "Giúp chọn quà về thời trang, phụ kiện",
        type: "multiple",
        maxSelections: 2,
        options:
          surveyAnswers.gender === "Nam"
            ? [
                "Lịch sự, công sở",
                "Thể thao, năng động",
                "Streetwear, hip-hop",
                "Tối giản, basic",
                "Vintage, cổ điển",
                "Không quan tâm nhiều",
              ]
            : surveyAnswers.gender === "Nữ"
            ? [
                "Nữ tính, dịu dàng",
                "Cá tính, mạnh mẽ",
                "Hàn Quốc, ulzzang",
                "Vintage, retro",
                "Tối giản, minimal",
                "Thể thao, active",
                "Boho, tự do",
                "Công sở, thanh lịch",
              ]
            : [
                "Lịch sự, thanh lịch",
                "Thoải mái, đơn giản",
                "Thể thao, năng động",
                "Cá tính, độc đáo",
              ],
      },
      {
        id: "budget",
        question: "Ngân sách bạn dự định cho món quà này?",
        questionHint: "Giúp gợi ý quà phù hợp với khả năng tài chính",
        type: "single",
        options: [
          "Dưới 200k (Quà ý nghĩa, handmade)",
          "200k - 500k",
          "500k - 1 triệu",
          "1 - 2 triệu",
          "2 - 5 triệu",
          "Trên 5 triệu (Quà cao cấp)",
          "Không giới hạn",
        ],
      },
      {
        id: "occasion",
        question: "Quà tặng cho dịp gì?",
        questionHint: "Mỗi dịp có ý nghĩa riêng",
        type: "single",
        options: [
          "Sinh nhật",
          "Kỷ niệm yêu nhau",
          "Valentine/Lễ tình nhân",
          "8/3 - Quốc tế Phụ nữ",
          "20/10 - Phụ nữ Việt Nam",
          "Giáng sinh/Tết",
          "Xin lỗi/Hòa giải",
          "Động viên/Khích lệ",
          "Không có dịp, tặng bất ngờ",
        ],
      },
      {
        id: "gift_purpose",
        question: "Bạn muốn món quà này mang lại điều gì?",
        questionHint: "Hiểu rõ mục đích để gợi ý chính xác hơn",
        type: "multiple",
        maxSelections: 2,
        options: [
          "Thể hiện tình cảm sâu sắc",
          "Làm người đó bất ngờ, vui vẻ",
          "Thực tế, hữu ích hàng ngày",
          "Kỷ niệm lâu dài, ý nghĩa",
          "Nâng cao chất lượng cuộc sống",
          "Thể hiện sự hiểu biết về họ",
          "Độc đáo, khác biệt",
          "Sang trọng, đẳng cấp",
        ],
      },
    ],
    [surveyAnswers.gender, surveyAnswers.relationship]
  );

  const currentFilteredQuestions = surveyQuestions.filter((q) => {
    if (!q.condition) return true;
    return q.condition(surveyAnswers);
  });

  const currentQuestion = currentFilteredQuestions[surveyStep];

  useEffect(() => {
    if (visible && currentFilteredQuestions.length > 0) {
      Animated.timing(progressAnim, {
        toValue: (surveyStep + 1) / currentFilteredQuestions.length,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [surveyStep, currentFilteredQuestions.length, visible]);

  const generateSuggestions = useCallback(
    (finalAnswers: Record<string, any>) => {
      const topSuggestions = filterSuggestions(finalAnswers, 10);
      onComplete(topSuggestions, finalAnswers);
    },
    [onComplete]
  );

  const handleSurveyAnswer = useCallback(
    (answer: any) => {
      if (currentQuestion.type === "single") {
        const newAnswers = { ...surveyAnswers, [currentQuestion.id]: answer };
        setSurveyAnswers(newAnswers);
        if (surveyStep < currentFilteredQuestions.length - 1) {
          animateNext(() => {
            setSurveyStep(surveyStep + 1);
            setCurrentMultipleSelections([]);
            setCurrentTextInput("");
          });
        } else {
          generateSuggestions(newAnswers);
        }
      } else if (currentQuestion.type === "multiple") {
        const selections = currentMultipleSelections.includes(answer)
          ? currentMultipleSelections.filter((s) => s !== answer)
          : [...currentMultipleSelections, answer];
        if (
          currentQuestion.maxSelections &&
          selections.length > currentQuestion.maxSelections
        ) {
          return;
        }
        setCurrentMultipleSelections(selections);
      }
    },
    [
      currentQuestion,
      surveyStep,
      currentFilteredQuestions.length,
      currentMultipleSelections,
      surveyAnswers,
      generateSuggestions,
    ]
  );

  const handleContinue = useCallback(() => {
    let answerValue: any;
    if (currentQuestion.type === "multiple") {
      answerValue = currentMultipleSelections;
    } else if (currentQuestion.type === "text") {
      answerValue = currentTextInput.trim();
    }
    const newAnswers = { ...surveyAnswers, [currentQuestion.id]: answerValue };
    setSurveyAnswers(newAnswers);
    if (surveyStep < currentFilteredQuestions.length - 1) {
      animateNext(() => {
        setSurveyStep(surveyStep + 1);
        setCurrentMultipleSelections([]);
        setCurrentTextInput("");
      });
    } else {
      generateSuggestions(newAnswers);
    }
  }, [
    currentQuestion,
    currentMultipleSelections,
    currentTextInput,
    surveyStep,
    currentFilteredQuestions.length,
    surveyAnswers,
    generateSuggestions,
  ]);

  const handleSkip = useCallback(() => {
    if (currentQuestion.type === "text") {
      const newAnswers = { ...surveyAnswers, [currentQuestion.id]: "" };
      setSurveyAnswers(newAnswers);
      if (surveyStep < currentFilteredQuestions.length - 1) {
        animateNext(() => {
          setSurveyStep(surveyStep + 1);
          setCurrentMultipleSelections([]);
          setCurrentTextInput("");
        });
      } else {
        generateSuggestions(newAnswers);
      }
    }
  }, [
    currentQuestion,
    surveyStep,
    currentFilteredQuestions.length,
    surveyAnswers,
    generateSuggestions,
  ]);

  const isNextDisabled =
    (currentQuestion?.type === "multiple" &&
      currentMultipleSelections.length === 0) ||
    (currentQuestion?.type === "text" && currentTextInput.trim().length === 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.sheetHeader}>
          {surveyStep > 0 ? (
            <TouchableOpacity
              onPress={() => {
                const prevStep = surveyStep - 1;
                const prevQuestion = currentFilteredQuestions[prevStep];
                animateNext(() => {
                  setSurveyStep(prevStep);
                  // Restore previous answers so user sees what they selected before
                  if (prevQuestion?.type === "multiple") {
                    setCurrentMultipleSelections(
                      surveyAnswers[prevQuestion.id] ?? []
                    );
                  } else {
                    setCurrentMultipleSelections([]);
                  }
                  if (prevQuestion?.type === "text") {
                    setCurrentTextInput(surveyAnswers[prevQuestion.id] ?? "");
                  } else {
                    setCurrentTextInput("");
                  }
                });
              }}
              style={styles.headerBtn}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtnPlaceholder} />
          )}
          <Text style={styles.headerProgress}>
            Câu {surveyStep + 1}/{currentFilteredQuestions.length}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        {currentQuestion && (
          <>
            <Animated.ScrollView
              style={[styles.scrollArea, { opacity: fadeAnim }]}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Question icon */}
              <View style={styles.questionIconWrap}>
                <Ionicons
                  name={
                    (QUESTION_ICONS[currentQuestion.id] ??
                      "gift-outline") as any
                  }
                  size={26}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.questionText}>
                {currentQuestion.question}
              </Text>
              {currentQuestion.questionHint && (
                <Text style={styles.questionHint}>
                  {currentQuestion.questionHint}
                </Text>
              )}

              {/* Single Choice */}
              {currentQuestion.type === "single" && (
                <View style={styles.optionsWrap}>
                  {currentQuestion.options?.map((option, index) => {
                    const isSelected =
                      surveyAnswers[currentQuestion.id] === option;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionBtn,
                          isSelected && styles.optionBtnSelected,
                        ]}
                        onPress={() => handleSurveyAnswer(option)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.optionRadio,
                            isSelected && styles.optionRadioSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.optionRadioDot} />}
                        </View>
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Multiple Choice */}
              {currentQuestion.type === "multiple" && (
                <>
                  {currentQuestion.maxSelections && (
                    <Text style={styles.selectionHint}>
                      Chọn tối đa {currentQuestion.maxSelections} đáp án • Đã
                      chọn {currentMultipleSelections.length}/
                      {currentQuestion.maxSelections}
                    </Text>
                  )}
                  <View style={styles.optionsWrap}>
                    {currentQuestion.options?.map((option, index) => {
                      const isSelected =
                        currentMultipleSelections.includes(option);
                      const isDisabled =
                        !isSelected &&
                        !!currentQuestion.maxSelections &&
                        currentMultipleSelections.length >=
                          currentQuestion.maxSelections;
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.optionBtn,
                            isSelected && styles.optionBtnSelected,
                            isDisabled && styles.optionBtnDisabled,
                          ]}
                          onPress={() => handleSurveyAnswer(option)}
                          disabled={isDisabled}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.checkBox,
                              isSelected && styles.checkBoxSelected,
                            ]}
                          >
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={13}
                                color="#fff"
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected,
                              isDisabled && styles.optionTextDisabled,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Text Input */}
              {currentQuestion.type === "text" && (
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    currentQuestion.placeholder || "Nhập câu trả lời..."
                  }
                  placeholderTextColor={COLORS.textSecondary}
                  value={currentTextInput}
                  onChangeText={setCurrentTextInput}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            </Animated.ScrollView>

            {/* Footer — only for multiple/text types */}
            {currentQuestion.type !== "single" && (
              <View
                style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}
              >
                {currentQuestion.type === "text" && (
                  <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                    <Text style={styles.skipBtnText}>Bỏ qua</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.nextBtn,
                    isNextDisabled && styles.nextBtnDisabled,
                  ]}
                  onPress={handleContinue}
                  disabled={isNextDisabled}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.nextBtnText,
                      isNextDisabled && styles.nextBtnTextDisabled,
                    ]}
                  >
                    {surveyStep < currentFilteredQuestions.length - 1
                      ? "Tiếp theo"
                      : "Xem gợi ý"}
                  </Text>
                  <Ionicons
                    name={
                      surveyStep < currentFilteredQuestions.length - 1
                        ? "arrow-forward"
                        : "sparkles"
                    }
                    size={18}
                    color={isNextDisabled ? COLORS.textSecondary : "#fff"}
                  />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: { padding: 6 },
  headerBtnPlaceholder: { width: 34 },
  headerProgress: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  scrollArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  questionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  questionText: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 27,
    marginBottom: 8,
  },
  questionHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 20,
  },
  selectionHint: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: 12,
  },
  optionsWrap: { gap: 10 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 15,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}0D`,
  },
  optionBtnDisabled: { opacity: 0.45 },
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
  optionRadioSelected: { borderColor: COLORS.primary },
  optionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkBoxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  optionTextSelected: { color: COLORS.primary, fontWeight: "600" },
  optionTextDisabled: { color: COLORS.textLight },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 100,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
  skipBtnText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
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

export default React.memo(SurveyModal);
