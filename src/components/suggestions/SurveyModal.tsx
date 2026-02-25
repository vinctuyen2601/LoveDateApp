import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  LayoutAnimation,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from '@themes/colors';
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
  onComplete: (suggestions: Suggestion[]) => void;
}

const SurveyModal: React.FC<SurveyModalProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [currentMultipleSelections, setCurrentMultipleSelections] = useState<
    string[]
  >([]);
  const [currentTextInput, setCurrentTextInput] = useState<string>("");

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSurveyAnswers({});
      setSurveyStep(0);
      setCurrentMultipleSelections([]);
      setCurrentTextInput("");
      progressAnim.setValue(0);
    }
  }, [visible]);

  const getSurveyQuestions = (): SurveyQuestion[] => [
    {
      id: "gender",
      question: "Người bạn muốn tặng quà thuộc giới tính nào?",
      questionHint: "Giúp chúng tôi gợi ý quà phù hợp với sở thích chung",
      type: "single",
      options: ["Nam", "Nữ", "Khác"],
    },
    {
      id: "relationship",
      question: "Mối quan hệ của bạn với người đó?",
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
  ];

  const surveyQuestions = getSurveyQuestions();

  const currentFilteredQuestions = surveyQuestions.filter((q) => {
    if (!q.condition) return true;
    return q.condition(surveyAnswers);
  });

  const currentQuestion = currentFilteredQuestions[surveyStep];
  const remainingQuestions = currentFilteredQuestions.length - surveyStep - 1;

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
      onComplete(topSuggestions);
    },
    [onComplete]
  );

  const handleSurveyAnswer = useCallback(
    (answer: any) => {
      if (currentQuestion.type === "single") {
        const newAnswers = { ...surveyAnswers, [currentQuestion.id]: answer };
        setSurveyAnswers(newAnswers);
        if (surveyStep < currentFilteredQuestions.length - 1) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSurveyStep(surveyStep + 1);
          setCurrentMultipleSelections([]);
          setCurrentTextInput("");
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
      setSurveyStep(surveyStep + 1);
      setCurrentMultipleSelections([]);
      setCurrentTextInput("");
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
        setSurveyStep(surveyStep + 1);
        setCurrentMultipleSelections([]);
        setCurrentTextInput("");
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.surveyModal}>
          <View style={styles.surveyModalHeader}>
            <Text style={styles.surveyModalTitle}>Khảo sát cá nhân hóa</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.surveyProgress}>
            <View style={styles.surveyProgressBar}>
              <Animated.View
                style={[
                  styles.surveyProgressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
            <View style={styles.surveyProgressInfo}>
              <Text style={styles.surveyProgressText}>
                Câu {surveyStep + 1}/{currentFilteredQuestions.length}
              </Text>
              {remainingQuestions > 0 && (
                <Text style={styles.surveyRemainingText}>
                  Còn {remainingQuestions} câu nữa
                </Text>
              )}
            </View>
          </View>

          {currentQuestion && (
            <ScrollView
              style={styles.surveyQuestion}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.questionText}>
                {currentQuestion.question}
              </Text>
              {currentQuestion.questionHint && (
                <Text style={styles.questionDescription}>
                  {currentQuestion.questionHint}
                </Text>
              )}

              {/* Single Choice */}
              {currentQuestion.type === "single" && (
                <View style={styles.optionsContainer}>
                  {currentQuestion.options?.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.optionButton}
                      onPress={() => handleSurveyAnswer(option)}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Multiple Choice */}
              {currentQuestion.type === "multiple" && (
                <>
                  <View style={styles.optionsContainer}>
                    {currentQuestion.options?.map((option, index) => {
                      const isSelected =
                        currentMultipleSelections.includes(option);
                      const isDisabled =
                        !isSelected &&
                        currentQuestion.maxSelections &&
                        currentMultipleSelections.length >=
                          currentQuestion.maxSelections;
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.checkboxOption,
                            isSelected && styles.checkboxOptionSelected,
                            isDisabled
                              ? styles.checkboxOptionDisabled
                              : undefined,
                          ]}
                          onPress={() => handleSurveyAnswer(option)}
                          disabled={!!isDisabled}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              isSelected && styles.checkboxSelected,
                            ]}
                          >
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color={COLORS.white}
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.checkboxText,
                              isSelected && styles.checkboxTextSelected,
                              isDisabled
                                ? styles.checkboxTextDisabled
                                : undefined,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {currentQuestion.maxSelections && (
                    <Text style={styles.selectionCounter}>
                      Đã chọn {currentMultipleSelections.length}/
                      {currentQuestion.maxSelections}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.continueButton,
                      currentMultipleSelections.length === 0 &&
                        styles.continueButtonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={currentMultipleSelections.length === 0}
                  >
                    <Text style={styles.continueButtonText}>Tiếp tục</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={COLORS.white}
                    />
                  </TouchableOpacity>
                </>
              )}

              {/* Text Input */}
              {currentQuestion.type === "text" && (
                <>
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
                  <View style={styles.textInputActions}>
                    <TouchableOpacity
                      style={styles.skipButton}
                      onPress={handleSkip}
                    >
                      <Text style={styles.skipButtonText}>Bỏ qua</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.continueButton,
                        currentTextInput.trim().length === 0 &&
                          styles.continueButtonDisabled,
                      ]}
                      onPress={handleContinue}
                      disabled={currentTextInput.trim().length === 0}
                    >
                      <Text style={styles.continueButtonText}>Tiếp tục</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={COLORS.white}
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          )}

          {surveyStep > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSurveyStep(surveyStep - 1)}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
              <Text style={styles.backButtonText}>Quay lại</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  surveyModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: "80%",
  },
  surveyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  surveyModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  surveyProgress: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  surveyProgressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  surveyProgressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  surveyProgressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  surveyProgressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  surveyRemainingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
  },
  surveyQuestion: {
    padding: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  questionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  checkboxOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkboxOptionSelected: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  checkboxOptionDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  checkboxTextSelected: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  checkboxTextDisabled: {
    color: COLORS.textLight,
  },
  selectionCounter: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 100,
    marginBottom: 16,
  },
  textInputActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  continueButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: 1,
    marginTop: 8,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.textLight,
    opacity: 0.5,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    color: COLORS.primary,
    marginLeft: 8,
    fontWeight: "600",
  },
});

export default React.memo(SurveyModal);
