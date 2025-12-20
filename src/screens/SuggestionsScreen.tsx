import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import RenderHTML from "react-native-render-html";
import { COLORS } from "../constants/colors";
import { STRINGS } from "../constants/strings";
import {
  filterSuggestions,
  getSuggestionsByType,
  Suggestion,
} from "../data/suggestions";
import {
  Article,
  ARTICLE_CATEGORIES,
  filterArticlesByCategory,
} from "../data/articles";
import {
  getArticles,
  trackArticleView,
  refreshArticles,
} from "../services/articleService";
import NotificationBanner from "../components/NotificationBanner";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 375; // iPhone SE, small Android phones

interface SurveyQuestion {
  id: string;
  question: string;
  description?: string; // Giải thích tại sao hỏi câu này
  type: "single" | "multiple" | "text";
  options?: string[];
  maxSelections?: number; // For multiple choice
  placeholder?: string; // For text input
  condition?: (answers: Record<string, any>) => boolean; // Điều kiện hiển thị
}

const SuggestionsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});
  const [currentMultipleSelections, setCurrentMultipleSelections] = useState<
    string[]
  >([]);
  const [currentTextInput, setCurrentTextInput] = useState<string>("");
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultSuggestions, setResultSuggestions] = useState<Suggestion[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Categories
  const categories = [
    { id: "all", name: "Tất cả", icon: "apps" as const, color: COLORS.primary },
    {
      id: "gifts",
      name: "Quà tặng",
      icon: "gift" as const,
      color: COLORS.categoryBirthday,
    },
    {
      id: "dates",
      name: "Hẹn hò",
      icon: "heart" as const,
      color: COLORS.categoryAnniversary,
    },
    {
      id: "communication",
      name: "Giao tiếp",
      icon: "chatbubbles" as const,
      color: COLORS.info,
    },
    {
      id: "zodiac",
      name: "Cung hoàng đạo",
      icon: "sparkles" as const,
      color: COLORS.warning,
    },
    {
      id: "personality",
      name: "Tính cách",
      icon: "people" as const,
      color: COLORS.success,
    },
  ];

  // Load articles from service on mount
  useEffect(() => {
    loadArticles();
  }, []);

  // Auto-open survey if navigated with openSurvey param
  useEffect(() => {
    if (route.params?.openSurvey) {
      // Delay slightly to ensure screen is mounted
      setTimeout(() => {
        startSurvey();
      }, 300);
    }
  }, [route.params?.openSurvey]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const fetchedArticles = await getArticles();
      setArticles(fetchedArticles);
    } catch (error) {
      console.error("Error loading articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const freshArticles = await refreshArticles();
      setArticles(freshArticles);
    } catch (error) {
      console.error("Error refreshing articles:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleArticlePress = (article: Article) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
    trackArticleView(article.id);
  };

  // Survey questions - Phân tích tâm lý sâu với câu hỏi động
  const getSurveyQuestions = (): SurveyQuestion[] => [
    // Câu 1: Xác định giới tính (để điều chỉnh câu hỏi tiếp theo)
    {
      id: "gender",
      question: "Người bạn muốn tặng quà thuộc giới tính nào?",
      description: "Giúp chúng tôi gợi ý quà phù hợp với sở thích chung",
      type: "single",
      options: ["Nam", "Nữ", "Khác"],
    },

    // Câu 2: Mối quan hệ (quan trọng để hiểu mức độ thân thiết)
    {
      id: "relationship",
      question: "Mối quan hệ của bạn với người đó?",
      description:
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

    // Câu 3: Thời gian yêu (chỉ hiện nếu chọn "Người yêu/Vợ/Chồng")
    {
      id: "relationship_duration",
      question: "Bạn và người ấy đã yêu nhau được bao lâu?",
      description: "Giai đoạn khác nhau cần quà khác nhau",
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

    // Câu 4: Tính cách người nhận (Multiple choice)
    {
      id: "personality",
      question: "Tính cách của người đó? (Chọn tối đa 3)",
      description: "Hiểu tính cách giúp chọn quà hợp gu",
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

    // Câu 5: Sở thích cụ thể (Multiple + Text)
    {
      id: "hobbies",
      question: "Người đó thường làm gì lúc rảnh? (Chọn nhiều đáp án)",
      description: "Quà liên quan đến sở thích luôn được yêu thích",
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

    // Câu 6: Sở thích khác (Text input)
    {
      id: "hobbies_other",
      question: "Có sở thích đặc biệt nào khác không?",
      description: "VD: Sưu tầm mô hình, chơi nhạc cụ, làm vườn...",
      type: "text",
      placeholder: "Nhập sở thích khác (nếu có)...",
    },

    // Câu 7: Điều họ cần nhất (Dynamic theo giới tính + mối quan hệ)
    {
      id: "needs",
      question:
        surveyAnswers.gender === "Nam"
          ? "Điều anh ấy đang cần/muốn nhất hiện tại?"
          : surveyAnswers.gender === "Nữ"
          ? "Điều cô ấy đang cần/muốn nhất hiện tại?"
          : "Điều họ đang cần/muốn nhất hiện tại?",
      description: "Quà thiết thực luôn có giá trị cao",
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

    // Câu 8: Ngôn ngữ yêu thương (Quan trọng cho mối quan hệ yêu đương)
    {
      id: "love_language",
      question: "Người đó cảm nhận tình cảm qua cách nào nhiều nhất?",
      description: "Hiểu 5 ngôn ngữ yêu thương để thể hiện đúng cách",
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

    // Câu 9: Phong cách thời trang/Thẩm mỹ
    {
      id: "style",
      question:
        surveyAnswers.gender === "Nam"
          ? "Phong cách ăn mặc của anh ấy?"
          : surveyAnswers.gender === "Nữ"
          ? "Phong cách thời trang cô ấy thích?"
          : "Phong cách của họ?",
      description: "Giúp chọn quà về thời trang, phụ kiện",
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

    // Câu 10: Ngân sách
    {
      id: "budget",
      question: "Ngân sách bạn dự định cho món quà này?",
      description: "Giúp gợi ý quà phù hợp với khả năng tài chính",
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

    // Câu 11: Dịp đặc biệt
    {
      id: "occasion",
      question: "Quà tặng cho dịp gì?",
      description: "Mỗi dịp có ý nghĩa riêng",
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

    // Câu 12: Mục tiêu của quà (Phân tích tâm lý sâu)
    {
      id: "gift_purpose",
      question: "Bạn muốn món quà này mang lại điều gì?",
      description: "Hiểu rõ mục đích để gợi ý chính xác hơn",
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

  const filteredArticles = filterArticlesByCategory(
    articles,
    selectedCategory as any
  );

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Get filtered questions based on conditions
  const getFilteredQuestions = () => {
    return surveyQuestions.filter((q) => {
      if (!q.condition) return true;
      return q.condition(surveyAnswers);
    });
  };

  const currentFilteredQuestions = getFilteredQuestions();
  const currentQuestion = currentFilteredQuestions[surveyStep];

  const handleSurveyAnswer = (answer: any) => {
    // For single choice questions - auto advance
    if (currentQuestion.type === "single") {
      const newAnswers = { ...surveyAnswers, [currentQuestion.id]: answer };
      setSurveyAnswers(newAnswers);

      // Move to next question
      if (surveyStep < currentFilteredQuestions.length - 1) {
        setSurveyStep(surveyStep + 1);
        setCurrentMultipleSelections([]);
        setCurrentTextInput("");
      } else {
        // Survey completed
        generateSuggestions(newAnswers);
      }
    }
    // For multiple choice - toggle selection
    else if (currentQuestion.type === "multiple") {
      const selections = currentMultipleSelections.includes(answer)
        ? currentMultipleSelections.filter((s) => s !== answer)
        : [...currentMultipleSelections, answer];

      // Check max selections
      if (
        currentQuestion.maxSelections &&
        selections.length > currentQuestion.maxSelections
      ) {
        return; // Don't add more
      }

      setCurrentMultipleSelections(selections);
    }
  };

  const handleContinue = () => {
    let answerValue: any;

    if (currentQuestion.type === "multiple") {
      answerValue = currentMultipleSelections;
    } else if (currentQuestion.type === "text") {
      answerValue = currentTextInput.trim();
    }

    const newAnswers = { ...surveyAnswers, [currentQuestion.id]: answerValue };
    setSurveyAnswers(newAnswers);

    // Move to next question
    if (surveyStep < currentFilteredQuestions.length - 1) {
      setSurveyStep(surveyStep + 1);
      setCurrentMultipleSelections([]);
      setCurrentTextInput("");
    } else {
      // Survey completed
      generateSuggestions(newAnswers);
    }
  };

  const handleSkip = () => {
    // For text input questions, allow skip
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
  };

  const generateSuggestions = (finalAnswers: Record<string, any>) => {
    console.log("Survey completed with answers:", finalAnswers);

    // Get personalized suggestions
    const topSuggestions = filterSuggestions(finalAnswers, 10);
    setResultSuggestions(topSuggestions);

    // Close survey and show results
    setShowSurveyModal(false);
    setSurveyStep(0);
    setSurveyAnswers({});
    setCurrentMultipleSelections([]);
    setCurrentTextInput("");

    // Show results after a brief delay for smooth transition
    setTimeout(() => {
      setShowResultsModal(true);
    }, 300);
  };

  const startSurvey = () => {
    setSurveyAnswers({});
    setSurveyStep(0);
    setCurrentMultipleSelections([]);
    setCurrentTextInput("");
    setShowSurveyModal(true);
  };

  const showNotification = articles.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[styles.header, showNotification && styles.headerWithBanner]}
      >
        <View style={styles.headerContent}>
          <Ionicons name="bulb" size={28} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Gợi ý & Khám phá</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Khám phá cách yêu thương hoàn hảo
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Survey Cards */}
        <View style={styles.surveyCardsContainer}>
          <TouchableOpacity style={styles.surveyCard} onPress={startSurvey}>
            <View style={styles.surveyIconContainer}>
              <Ionicons name="clipboard" size={32} color={COLORS.white} />
            </View>
            <View style={styles.surveyContent}>
              <Text style={styles.surveyTitle}>Khảo sát cá nhân hóa</Text>
              <Text style={styles.surveyDescription}>
                Trả lời các câu hỏi để nhận gợi ý quà tặng và hoạt động phù hợp
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          {/* MBTI Survey Card */}
          <TouchableOpacity
            style={[styles.surveyCard, styles.mbtiCard]}
            onPress={() => navigation.navigate("MBTISurvey")}
          >
            <View
              style={[styles.surveyIconContainer, styles.mbtiIconContainer]}
            >
              <Ionicons name="people" size={32} color={COLORS.white} />
            </View>
            <View style={styles.surveyContent}>
              <Text style={styles.surveyTitle}>Khảo sát MBTI 🧠</Text>
              <Text style={styles.surveyDescription}>
                Khám phá tính cách qua 40 câu hỏi và nhận gợi ý quà phù hợp
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.success} />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                  { borderColor: category.color },
                  selectedCategory === category.id && {
                    backgroundColor: category.color,
                  },
                ]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Ionicons
                  name={category.icon}
                  size={20}
                  color={
                    selectedCategory === category.id
                      ? COLORS.white
                      : category.color
                  }
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color:
                        selectedCategory === category.id
                          ? COLORS.white
                          : category.color,
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 10, color: COLORS.textSecondary }}>
              Đang tải bài viết...
            </Text>
          </View>
        )}

        {/* Featured Articles */}
        {!loading && selectedCategory === "all" && (
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>Nổi bật</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.featuredScroll}
              contentContainerStyle={styles.featuredScrollContent}
            >
              {filteredArticles
                .filter((a) => a.isFeatured)
                .map((article) => (
                  <TouchableOpacity
                    key={article.id}
                    style={styles.featuredCard}
                    onPress={() => handleArticlePress(article)}
                  >
                    <Image
                      source={
                        article.imageUrl
                          ? typeof article.imageUrl === 'string'
                            ? { uri: article.imageUrl }
                            : article.imageUrl
                          : require("../../assets/images/default-thumbnail.jpg")
                      }
                      style={styles.featuredImage}
                      resizeMode="cover"
                    />
                    <View style={styles.featuredOverlay}>
                      <View style={styles.featuredBadge}>
                        <Ionicons name="star" size={12} color={COLORS.white} />
                        <Text style={styles.featuredBadgeText}>Nổi bật</Text>
                      </View>
                      <Text style={styles.featuredTitle} numberOfLines={2}>
                        {article.title}
                      </Text>
                      <View style={styles.featuredMeta}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={COLORS.white}
                        />
                        <Text style={styles.featuredMetaText}>
                          {article.readTime} phút đọc
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Articles Grid */}
        {!loading && (
          <View style={styles.articlesSection}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === "all"
                ? "Tất cả bài viết"
                : `Bài viết ${
                    categories.find((c) => c.id === selectedCategory)?.name
                  }`}{" "}
              ({filteredArticles.length})
            </Text>

            <View style={styles.articlesGrid}>
              {filteredArticles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.articleGridCard}
                  onPress={() => handleArticlePress(article)}
                >
                  <Image
                    source={
                      article.imageUrl
                        ? typeof article.imageUrl === 'string'
                          ? { uri: article.imageUrl }
                          : article.imageUrl
                        : require("../../assets/images/default-thumbnail.jpg")
                    }
                    style={styles.articleImage}
                    resizeMode="cover"
                  />
                  <View style={styles.articleCardContent}>
                    <View
                      style={[
                        styles.articleCategoryBadge,
                        { backgroundColor: article.color },
                      ]}
                    >
                      <Ionicons
                        name={article.icon}
                        size={12}
                        color={COLORS.white}
                      />
                      <Text style={styles.articleCategoryText}>
                        {
                          categories.find((c) => c.id === article.category)
                            ?.name
                        }
                      </Text>
                    </View>
                    <Text style={styles.articleGridTitle} numberOfLines={3}>
                      {article.title}
                    </Text>
                    <View style={styles.articleGridMeta}>
                      <View style={styles.articleMetaItem}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.articleMetaText}>
                          {article.readTime || 5} phút
                        </Text>
                      </View>
                      {article.views && (
                        <View style={styles.articleMetaItem}>
                          <Ionicons
                            name="eye-outline"
                            size={12}
                            color={COLORS.textSecondary}
                          />
                          <Text style={styles.articleMetaText}>
                            {article.views}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Empty State */}
            {filteredArticles.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="document-outline"
                  size={64}
                  color={COLORS.textLight}
                />
                <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
                <Text style={styles.emptySubtext}>
                  Chọn danh mục khác để xem nội dung
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Survey Modal */}
      <Modal
        visible={showSurveyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSurveyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.surveyModal}>
            <View style={styles.surveyModalHeader}>
              <Text style={styles.surveyModalTitle}>Khảo sát cá nhân hóa</Text>
              <TouchableOpacity onPress={() => setShowSurveyModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.surveyProgress}>
              <View style={styles.surveyProgressBar}>
                <View
                  style={[
                    styles.surveyProgressFill,
                    {
                      width: `${
                        ((surveyStep + 1) / currentFilteredQuestions.length) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.surveyProgressText}>
                Câu {surveyStep + 1}/{currentFilteredQuestions.length}
              </Text>
            </View>

            {currentQuestion && (
              <ScrollView
                style={styles.surveyQuestion}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.questionText}>
                  {currentQuestion.question}
                </Text>

                {currentQuestion.description && (
                  <Text style={styles.questionDescription}>
                    {currentQuestion.description}
                  </Text>
                )}

                {/* Single Choice - Auto advance */}
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

                {/* Multiple Choice - With checkboxes */}
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
                              isSelected
                                ? styles.checkboxOptionSelected
                                : undefined,
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
                                isSelected
                                  ? styles.checkboxSelected
                                  : undefined,
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
                                isSelected
                                  ? styles.checkboxTextSelected
                                  : undefined,
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

      {/* Article Modal */}
      <Modal
        visible={showArticleModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowArticleModal(false)}
      >
        <View style={styles.articleModal}>
          <View style={styles.articleModalHeader}>
            <TouchableOpacity
              onPress={() => setShowArticleModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.articleModalContent}>
            {selectedArticle && (
              <>
                <View
                  style={[
                    styles.articleModalIcon,
                    { backgroundColor: selectedArticle.color },
                  ]}
                >
                  <Ionicons
                    name={selectedArticle.icon}
                    size={48}
                    color={COLORS.white}
                  />
                </View>
                <Text style={styles.articleModalTitle}>
                  {selectedArticle.title}
                </Text>
                <RenderHTML
                  contentWidth={width}
                  source={{ html: selectedArticle.content }}
                  tagsStyles={htmlStyles}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal
        visible={showResultsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowResultsModal(false)}
      >
        <View style={styles.resultsModal}>
          <View style={styles.resultsModalHeader}>
            <View>
              <Text style={styles.resultsModalTitle}>Gợi ý dành cho bạn</Text>
              <Text style={styles.resultsModalSubtitle}>
                {resultSuggestions.length} kết quả phù hợp nhất
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowResultsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            {resultSuggestions.length === 0 ? (
              <View style={styles.emptyResults}>
                <Ionicons
                  name="search-outline"
                  size={64}
                  color={COLORS.textLight}
                />
                <Text style={styles.emptyResultsText}>
                  Không tìm thấy gợi ý phù hợp
                </Text>
                <Text style={styles.emptyResultsSubtext}>
                  Thử điều chỉnh câu trả lời hoặc làm khảo sát lại
                </Text>
              </View>
            ) : (
              <>
                {/* Group by type */}
                {["romantic_plan", "activity", "experience", "gift"].map(
                  (type) => {
                    const typeSuggestions = resultSuggestions.filter(
                      (s) => s.type === type
                    );
                    if (typeSuggestions.length === 0) return null;

                    const typeInfo = {
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

                    return (
                      <View key={type} style={styles.resultSection}>
                        <View style={styles.resultSectionHeader}>
                          <Ionicons
                            name={typeInfo[type as keyof typeof typeInfo].icon}
                            size={20}
                            color={
                              typeInfo[type as keyof typeof typeInfo].color
                            }
                          />
                          <Text style={styles.resultSectionTitle}>
                            {typeInfo[type as keyof typeof typeInfo].title} (
                            {typeSuggestions.length})
                          </Text>
                        </View>

                        {typeSuggestions.map((suggestion, index) => (
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
                                  💡 Mẹo hay:
                                </Text>
                                {suggestion.tips.slice(0, 2).map((tip, i) => (
                                  <Text key={i} style={styles.resultCardTip}>
                                    • {tip}
                                  </Text>
                                ))}
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    );
                  }
                )}

                {/* Action Buttons */}
                <View style={styles.resultsActions}>
                  <TouchableOpacity
                    style={styles.retakeSurveyButton}
                    onPress={() => {
                      setShowResultsModal(false);
                      setTimeout(() => startSurvey(), 300);
                    }}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerWithBanner: {
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 16 : 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 40,
  },
  content: {
    flex: 1,
  },
  surveyCardsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  surveyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  mbtiCard: {
    borderLeftColor: COLORS.success,
  },
  surveyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  mbtiIconContainer: {
    backgroundColor: COLORS.success,
  },
  surveyContent: {
    flex: 1,
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  surveyDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  categoriesSection: {
    marginBottom: 8,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
    backgroundColor: COLORS.white,
  },
  categoryChipActive: {
    borderWidth: 0,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  // Featured Articles Section
  featuredSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  featuredScroll: {
    paddingHorizontal: 16,
  },
  featuredScrollContent: {
    paddingRight: 16,
  },
  featuredCard: {
    width: 280,
    height: 180,
    borderRadius: 16,
    marginRight: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  featuredOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    padding: 16,
    justifyContent: "flex-end",
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.9)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.white,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 8,
    lineHeight: 22,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredMetaText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "500",
  },

  // Articles Grid Section
  articlesSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  articlesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 16,
  },
  articleGridCard: {
    width: isSmallScreen ? "100%" : "47%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  articleImage: {
    width: "100%",
    height: isSmallScreen ? 180 : 140,
    backgroundColor: COLORS.border,
  },
  articleCardContent: {
    padding: 12,
  },
  articleCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    gap: 4,
  },
  articleCategoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.white,
  },
  articleGridTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
    lineHeight: 20,
  },
  articleGridMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  articleMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  articleMetaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Old article card styles (kept for backward compatibility)
  articleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  articleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  articleContent: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  articleMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
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
  },
  surveyProgressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "right",
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
  articleModal: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  articleModalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 8,
  },
  articleModalContent: {
    flex: 1,
    padding: 20,
  },
  articleModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  articleModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },
  articleModalBody: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.textPrimary,
  },
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
  resultsContent: {
    flex: 1,
    padding: 16,
  },
  emptyResults: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyResultsText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptyResultsSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
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

// HTML styles for CKEditor content (supports images, videos, rich formatting)
const htmlStyles = {
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.textPrimary,
  },
  h1: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 12,
  },
  h2: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 10,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: COLORS.textPrimary,
    marginTop: 14,
    marginBottom: 8,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  p: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  strong: {
    fontWeight: "bold" as const,
    color: COLORS.textPrimary,
  },
  b: {
    fontWeight: "bold" as const,
    color: COLORS.textPrimary,
  },
  em: {
    fontStyle: "italic" as const,
  },
  i: {
    fontStyle: "italic" as const,
  },
  ul: {
    marginBottom: 12,
    paddingLeft: 20,
  },
  ol: {
    marginBottom: 12,
    paddingLeft: 20,
  },
  li: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  code: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: "monospace" as const,
  },
  pre: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  blockquote: {
    backgroundColor: COLORS.background,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 12,
    fontStyle: "italic" as const,
  },
  a: {
    color: COLORS.primary,
    textDecorationLine: "underline" as const,
  },
  hr: {
    backgroundColor: COLORS.border,
    height: 1,
    marginVertical: 16,
  },
  img: {
    marginVertical: 12,
    borderRadius: 8,
  },
  figure: {
    marginVertical: 12,
  },
  figcaption: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic" as const,
    textAlign: "center" as const,
    marginTop: 8,
  },
};

export default SuggestionsScreen;
