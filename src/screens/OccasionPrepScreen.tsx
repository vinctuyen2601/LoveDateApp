import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "@themes/colors";
import { Event } from "../types";
import { useEvents } from "@contexts/EventsContext";
import { useToast } from "../contexts/ToastContext";
import { fetchArticlesPaginated } from "../services/articleService";
import { Article } from "../types";

// Map event tag → occasionId dùng cho OccasionProductsScreen
const TAG_TO_OCCASION: Record<string, string> = {
  birthday: "birthday",
  anniversary: "anniversary",
  holiday: "valentine", // fallback chung
};

const TAG_TO_OCCASION_NAME: Record<string, string> = {
  birthday: "Sinh nhật",
  anniversary: "Kỷ niệm",
  holiday: "Ngày lễ",
};

const TAG_TO_OCCASION_COLOR: Record<string, string> = {
  birthday: "#FF6B6B",
  anniversary: "#9C27B0",
  holiday: "#FF69B4",
};

const getOccasionInfo = (tags: string[]) => {
  const tag = tags.find((t) => TAG_TO_OCCASION[t]) || "birthday";
  return {
    occasionId: TAG_TO_OCCASION[tag] || "birthday",
    occasionName: TAG_TO_OCCASION_NAME[tag] || "Dịp đặc biệt",
    occasionColor: TAG_TO_OCCASION_COLOR[tag] || COLORS.primary,
    tag,
  };
};

const STEPS = ["Quà tặng", "Lịch trình", "Bài viết"];

const ARTICLE_CATEGORIES: Record<string, { name: string; color: string }> = {
  gifts:         { name: "Quà tặng",    color: "#FF6B6B" },
  dates:         { name: "Hẹn hò",      color: "#E91E63" },
  experiences:   { name: "Trải nghiệm", color: "#9C27B0" },
  communication: { name: "Giao tiếp",   color: "#2196F3" },
  zodiac:        { name: "Hoàng đạo",   color: "#FF9800" },
  personality:   { name: "Tính cách",   color: "#4CAF50" },
  all:           { name: "Tổng hợp",    color: "#607D8B" },
};

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const ArticleCard: React.FC<{ article: Article; onPress: () => void }> = ({ article, onPress }) => {
  const cat = ARTICLE_CATEGORIES[article.category] ?? { name: article.category, color: article.color || COLORS.primary };
  return (
    <TouchableOpacity style={styles.articleCard} onPress={onPress} activeOpacity={0.8}>
      {article.imageUrl ? (
        <Image source={{ uri: article.imageUrl as string }} style={styles.articleThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.articleThumb, { backgroundColor: (article.color || COLORS.primary) + "20", alignItems: "center", justifyContent: "center" }]}>
          <Ionicons name={(article.icon as any) || "document-text"} size={24} color={article.color || COLORS.primary} />
        </View>
      )}
      <View style={styles.articleInfo}>
        <View style={styles.articleTopRow}>
          <View style={[styles.articleCatBadge, { backgroundColor: cat.color }]}>
            <Text style={styles.articleCatText}>{cat.name}</Text>
          </View>
          {article.readTime ? (
            <View style={styles.articleReadTimeRow}>
              <Ionicons name="time-outline" size={11} color={COLORS.textSecondary} />
              <Text style={styles.articleReadTime}>{article.readTime} phút</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
        <View style={styles.articleStats}>
          <View style={styles.articleStat}>
            <Ionicons name="eye-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.articleStatText}>{formatCount(article.views ?? 0)}</Text>
          </View>
          <View style={styles.articleStat}>
            <Ionicons name="heart-outline" size={12} color="#E91E63" />
            <Text style={styles.articleStatText}>{formatCount(article.likes ?? 0)}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
    </TouchableOpacity>
  );
};

const OccasionPrepScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { event, postEvent = false }: { event: Event; postEvent?: boolean } =
    route.params;
  const { upsertEventNote, getEventById } = useEvents();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(postEvent ? 3 : 0);
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Post-event state
  const [rating, setRating] = useState(0);
  const [giftNote, setGiftNote] = useState("");
  const [activityNote, setActivityNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { occasionId, occasionName, occasionColor } = getOccasionInfo(
    event.tags
  );
  const currentYear = new Date().getFullYear();

  // Quà đã lưu năm nay
  const savedGift =
    getEventById(event.id)?.notes?.find((n) => n.year === currentYear)?.gift ??
    null;

    console.log(111111, savedGift);
    

  // Lịch trình đã lưu năm nay
  const savedActivityNote = getEventById(event.id)?.notes?.find((n) => n.year === currentYear);
  const savedActivity = savedActivityNote?.activity ?? null;
  const savedActivityDescription = savedActivityNote?.activityDescription ?? null;
  const savedActivityBudget = savedActivityNote?.activityBudget ?? null;
  const savedActivityEmoji = savedActivityNote?.activityEmoji ?? null;
  const savedActivityWhyFit = savedActivityNote?.activityWhyFit ?? null;
  const savedActivityTimeline = savedActivityNote?.activityTimeline ?? null;

  // Derived — reactive từ context, không cần useFocusEffect
  const giftDone = !!savedGift;
  const activityDone = !!savedActivity;
  const stepDone = [giftDone, activityDone, false];

  // Gift card animation — scale 0.85→1 + opacity 0→1 in parallel
  const giftCardScale = useRef(new Animated.Value(0.85)).current;
  const giftCardOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (giftDone) {
      Animated.parallel([
        Animated.spring(giftCardScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
        }),
        Animated.timing(giftCardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      giftCardScale.setValue(0.85);
      giftCardOpacity.setValue(0);
    }
  }, [giftDone]);

  // Activity card animation
  const activityCardScale = useRef(new Animated.Value(0.85)).current;
  const activityCardOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (activityDone) {
      Animated.parallel([
        Animated.spring(activityCardScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
        }),
        Animated.timing(activityCardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      activityCardScale.setValue(0.85);
      activityCardOpacity.setValue(0);
    }
  }, [activityDone]);

  // Số ngày còn lại đến sự kiện
  const daysUntilEvent = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(event.eventDate);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  })();

  // Load articles theo tag
  useEffect(() => {
    setArticlesLoading(true);
    fetchArticlesPaginated({ page: 1, limit: 3, category: occasionId })
      .then((res) => {
        setArticles(res.data);
        if (res.data.length === 0) {
          return fetchArticlesPaginated({ page: 1, limit: 3, sortBy: 'views' });
        }
      })
      .then((featured) => {
        if (featured) setFeaturedArticles(featured.data);
      })
      .catch(() => {})
      .finally(() => setArticlesLoading(false));
  }, [occasionId]);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleSavePostEvent = async () => {
    if (rating === 0) {
      showError("Vui lòng chọn số sao đánh giá");
      return;
    }
    try {
      setIsSaving(true);
      await upsertEventNote(event.id, {
        year: currentYear,
        rating,
        gift: giftNote.trim()
          ? { name: giftNote.trim(), source: "manual" }
          : undefined,
        activity: activityNote.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
      });
      showSuccess("Đã lưu kỷ niệm!");
      navigation.goBack();
    } catch (e) {
      showError("Không thể lưu, thử lại nhé");
    } finally {
      setIsSaving(false);
    }
  };

  const goToGiftSuggestions = () => {
    navigation.navigate("AllProducts", {
      initialAiMode: true,
      initialPrompt: `Quà ${occasionName.toLowerCase()} - ${event.title}`,
      eventId: event.id,
    });
  };

  const goToActivitySuggestions = () => {
    navigation.navigate("ActivitySuggestions", {
      eventId: event.id,
      event,
    });
  };

  const isPostEvent = postEvent || step === 3;

  return (
    <View style={styles.container}>
      {/* Header — gradient cho pre-event, plain cho post-event */}
      {isPostEvent ? (
        <View style={[styles.headerPlain, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityLabel="Quay lại"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ghi lại kỷ niệm</Text>
          <View style={{ width: 40 }} />
        </View>
      ) : (
        <LinearGradient
          colors={[occasionColor, occasionColor + "CC"]}
          style={[styles.contextHeader, { paddingTop: insets.top + 8 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtnLight}
            accessibilityLabel="Quay lại"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={26} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <View style={styles.contextHeaderInfo}>
            <Text style={styles.contextHeaderTitle} numberOfLines={1}>
              {event.title}
            </Text>
            <View style={styles.contextHeaderMeta}>
              <View style={styles.contextTagBadge}>
                <Text style={styles.contextTagText}>{occasionName}</Text>
              </View>
              <Text style={styles.contextDays}>
                {daysUntilEvent > 0
                  ? `còn ${daysUntilEvent} ngày`
                  : daysUntilEvent === 0
                  ? "hôm nay!"
                  : "đã qua"}
              </Text>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Step indicator — chỉ hiện ở pre-event */}
      {!isPostEvent && (
        <View style={styles.stepIndicator}>
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    i === step && { backgroundColor: occasionColor },
                    stepDone[i] && { backgroundColor: COLORS.success },
                    i < step &&
                      !stepDone[i] && { backgroundColor: COLORS.border },
                  ]}
                >
                  {stepDone[i] ? (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  ) : (
                    <Text style={styles.stepDotText}>{i + 1}</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    i === step && { color: occasionColor, fontWeight: "600" },
                  ]}
                >
                  {label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    stepDone[i] && { backgroundColor: COLORS.success },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── PRE-EVENT STEP 0: Quà tặng ── */}
        {!isPostEvent && step === 0 && (
          <View>
            <Text style={styles.stepTitle}>Bạn đã có quà chưa?</Text>
            <Text style={styles.stepSub}>
              Tìm quà phù hợp cho dịp {occasionName}
            </Text>

            {!giftDone && (
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: occasionColor }]}
                onPress={goToGiftSuggestions}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[occasionColor, occasionColor + "CC"]}
                  style={styles.actionBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="gift" size={22} color="#fff" />
                  <Text style={styles.actionBtnText}>Xem gợi ý quà tặng</Text>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {savedGift && (
              <Animated.View
                accessible={true}
                accessibilityLabel={`Quà đã chọn: ${savedGift.name}`}
                style={[
                  styles.savedCard,
                  { opacity: giftCardOpacity, transform: [{ scale: giftCardScale }] },
                ]}
              >
                <View style={styles.savedCardHeader}>
                  {/* Ảnh sản phẩm hoặc fallback gradient */}
                  {savedGift.imageUrl ? (
                    <Image
                      source={{ uri: savedGift.imageUrl }}
                      style={styles.savedCardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={[occasionColor, occasionColor + "CC"]}
                      style={styles.savedCardImage}
                    >
                      <Ionicons name="gift" size={28} color="#fff" />
                    </LinearGradient>
                  )}
                  <View style={styles.savedCardInfo}>
                    <View style={styles.savedCardTopRow}>
                      <View style={styles.savedCardDoneBadge}>
                        <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                        <Text style={styles.savedCardDoneLabel}>Quà đã chọn</Text>
                      </View>
                      <TouchableOpacity
                        onPress={goToGiftSuggestions}
                        style={styles.savedCardChangeBtn}
                        activeOpacity={0.7}
                        accessibilityLabel="Đổi quà tặng khác"
                      >
                        <Ionicons name="refresh-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.savedCardChangeBtnText}>Đổi quà</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.savedCardName} numberOfLines={2}>
                      {savedGift.name}
                    </Text>
                    {/* Rating */}
                    {savedGift.rating ? (
                      <View style={styles.savedCardRatingRow}>
                        {[1,2,3,4,5].map(s => (
                          <Ionicons
                            key={s}
                            name={s <= Math.round(savedGift.rating!) ? "star" : "star-outline"}
                            size={11}
                            color="#FFB800"
                          />
                        ))}
                        {savedGift.reviewCount ? (
                          <Text style={styles.savedCardReviewCount}>
                            ({Number(savedGift.reviewCount).toLocaleString("vi-VN")})
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                    <View style={styles.savedCardMeta}>
                      {savedGift.price ? (
                        <View style={[styles.savedCardBadge, { borderColor: occasionColor + "40", backgroundColor: occasionColor + "0D" }]}>
                          <Ionicons name="wallet-outline" size={11} color={occasionColor} />
                          <Text style={[styles.savedCardBadgeText, { color: occasionColor }]}>
                            {Number(savedGift.price).toLocaleString("vi-VN")}₫
                          </Text>
                        </View>
                      ) : null}
                      {savedGift.source === 'occasion_products' && (
                        <View style={styles.savedCardBadge}>
                          <Ionicons name="sparkles-outline" size={11} color={COLORS.textSecondary} />
                          <Text style={styles.savedCardBadgeText}>Gợi ý AI</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {/* Reason từ AI — ưu tiên hơn description */}
                {(savedGift.reason || savedGift.description) ? (
                  <View style={[styles.savedCardReasonBox, { backgroundColor: occasionColor + "0A", borderColor: occasionColor + "25" }]}>
                    <Ionicons name="sparkles" size={12} color={occasionColor} />
                    <Text style={[styles.savedCardReasonText, { color: occasionColor }]} numberOfLines={5}>
                      {savedGift.reason || savedGift.description}
                    </Text>
                  </View>
                ) : null}
              </Animated.View>
            )}


            <TouchableOpacity
              style={[
                styles.nextBtn,
                {
                  backgroundColor: occasionColor,
                  alignSelf: "stretch",
                  justifyContent: "center",
                  marginTop: 24,
                },
              ]}
              onPress={() => setStep(1)}
            >
              <Text style={styles.nextBtnText}>Tiếp theo</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipLink}
              onPress={() => setStep(1)}
            >
              <Text style={styles.skipLinkText}>Bỏ qua bước này</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── PRE-EVENT STEP 1: Lịch trình ── */}
        {!isPostEvent && step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Đã có kế hoạch chưa?</Text>
            <Text style={styles.stepSub}>
              AI gợi ý lịch trình phù hợp cho bạn
            </Text>

            {!activityDone && (
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: occasionColor }]}
                onPress={goToActivitySuggestions}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[occasionColor, occasionColor + "CC"]}
                  style={styles.actionBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="map" size={22} color="#fff" />
                  <Text style={styles.actionBtnText}>AI gợi ý lịch trình</Text>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {savedActivity && (
              <Animated.View
                style={[
                  styles.savedCard,
                  { opacity: activityCardOpacity, transform: [{ scale: activityCardScale }] },
                ]}
              >
                <View style={styles.savedCardHeader}>
                  <View style={[styles.savedCardImage, { backgroundColor: occasionColor + "18", alignItems: "center", justifyContent: "center" }]}>
                    {savedActivityEmoji ? (
                      <Text style={{ fontSize: 32 }}>{savedActivityEmoji}</Text>
                    ) : (
                      <Ionicons name="map" size={28} color={occasionColor} />
                    )}
                  </View>
                  <View style={styles.savedCardInfo}>
                    <View style={styles.savedCardTopRow}>
                      <View style={styles.savedCardDoneBadge}>
                        <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                        <Text style={styles.savedCardDoneLabel}>Đã lên kế hoạch</Text>
                      </View>
                      <TouchableOpacity
                        onPress={goToActivitySuggestions}
                        style={styles.savedCardChangeBtn}
                        activeOpacity={0.7}
                        accessibilityLabel="Đổi lịch trình khác"
                      >
                        <Ionicons name="refresh-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.savedCardChangeBtnText}>Đổi</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.savedCardName} numberOfLines={2}>
                      {savedActivity}
                    </Text>
                    <View style={styles.savedCardMeta}>
                      {savedActivityBudget ? (
                        <View style={[styles.savedCardBadge, { borderColor: occasionColor + "40", backgroundColor: occasionColor + "0D" }]}>
                          <Ionicons name="wallet-outline" size={11} color={occasionColor} />
                          <Text style={[styles.savedCardBadgeText, { color: occasionColor }]}>
                            {savedActivityBudget}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.savedCardBadge}>
                        <Ionicons name="sparkles-outline" size={11} color={COLORS.textSecondary} />
                        <Text style={styles.savedCardBadgeText}>AI gợi ý</Text>
                      </View>
                    </View>
                  </View>
                </View>
                {/* WhyFit box */}
                {savedActivityWhyFit ? (
                  <View style={[styles.savedCardReasonBox, { backgroundColor: occasionColor + "0A", borderColor: occasionColor + "25" }]}>
                    <Ionicons name="sparkles" size={12} color={occasionColor} />
                    <Text style={[styles.savedCardReasonText, { color: occasionColor }]} numberOfLines={3}>
                      {savedActivityWhyFit}
                    </Text>
                  </View>
                ) : null}
                {/* Timeline steps */}
                {savedActivityTimeline && savedActivityTimeline.length > 0 ? (
                  <View style={styles.activityTimeline}>
                    {savedActivityTimeline.slice(0, 4).map((step, i) => (
                      <View key={i} style={styles.activityTimelineStep}>
                        <View style={[styles.activityTimelineDot, { backgroundColor: occasionColor }]} />
                        <Text style={styles.activityTimelineTime}>{step.time}</Text>
                        <Text style={styles.activityTimelineAction} numberOfLines={1}>{step.action}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Animated.View>
            )}


            <TouchableOpacity
              style={[
                styles.nextBtn,
                {
                  backgroundColor: occasionColor,
                  alignSelf: "stretch",
                  justifyContent: "center",
                  marginTop: 24,
                },
              ]}
              onPress={() => setStep(2)}
            >
              <Text style={styles.nextBtnText}>Tiếp theo</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipLink}
              onPress={() => setStep(2)}
            >
              <Text style={styles.skipLinkText}>Bỏ qua bước này</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── PRE-EVENT STEP 2: Bài viết ── */}
        {!isPostEvent && step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Tham khảo kinh nghiệm</Text>
            <Text style={styles.stepSub}>
              Bài viết liên quan dịp {occasionName}
            </Text>

            {articlesLoading ? (
              <Text style={styles.emptyText}>Đang tải bài viết...</Text>
            ) : articles.length > 0 ? (
              articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onPress={() => navigation.navigate("ArticleDetail", { article })}
                />
              ))
            ) : (
              <>
                <View style={styles.noArticlesBanner}>
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.noArticlesText}>
                    Chưa có bài viết phù hợp với dịp này, tham khảo các bài viết khác nhé
                  </Text>
                </View>
                {featuredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onPress={() => navigation.navigate("ArticleDetail", { article })}
                  />
                ))}
              </>
            )}

            <TouchableOpacity
              style={[
                styles.nextBtn,
                {
                  backgroundColor: occasionColor,
                  alignSelf: "center",
                  marginTop: 24,
                  paddingHorizontal: 32,
                },
              ]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.nextBtnText}>Hoàn thành</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── POST-EVENT: Rating + Note ── */}
        {isPostEvent && (
          <View>
            <Text style={styles.stepTitle}>Hôm qua thế nào?</Text>
            <Text style={styles.stepSub}>
              Ghi lại để nhớ mãi khoảnh khắc này
            </Text>

            {/* Star rating */}
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={40}
                    color={star <= rating ? "#FFD700" : COLORS.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingLabel}>
                {
                  [
                    "",
                    "Chưa vừa ý",
                    "Tạm được",
                    "Ổn",
                    "Vui lắm!",
                    "Tuyệt vời!",
                  ][rating]
                }
              </Text>
            )}

            {/* Gift note */}
            <Text style={styles.fieldLabel}>Bạn đã tặng gì?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ví dụ: Hoa hồng, set mỹ phẩm..."
              placeholderTextColor={COLORS.textSecondary + "80"}
              value={giftNote}
              onChangeText={setGiftNote}
              maxLength={100}
            />

            {/* Activity note */}
            <Text style={styles.fieldLabel}>Đã làm gì?</Text>
            <TextInput
              style={[styles.textInput, { height: 80 }]}
              placeholder="Ví dụ: Đi ăn tối nhà hàng, xem phim..."
              placeholderTextColor={COLORS.textSecondary + "80"}
              value={activityNote}
              onChangeText={setActivityNote}
              multiline
              maxLength={200}
            />

            {/* Photos */}
            <Text style={styles.fieldLabel}>Ảnh kỷ niệm (tuỳ chọn)</Text>
            <TouchableOpacity
              style={styles.photoBtn}
              onPress={handlePickPhoto}
              activeOpacity={0.8}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color={COLORS.textSecondary}
              />
              <Text style={styles.photoBtnText}>
                {photos.length > 0
                  ? `Đã chọn ${photos.length} ảnh`
                  : "Thêm ảnh"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSavePostEvent}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[COLORS.primary, "#C850C0"]}
                style={styles.saveBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="heart" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>
                  {isSaving ? "Đang lưu..." : "Lưu kỷ niệm"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  // Plain header (post-event)
  headerPlain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  // Gradient context header (pre-event)
  contextHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtnLight: { width: 40, alignItems: "flex-start" },
  contextHeaderInfo: { flex: 1 },
  contextHeaderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  contextHeaderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contextTagBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  contextTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  contextDays: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  // Saved result card (gift + activity)
  savedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    overflow: "hidden",
  },
  savedCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  savedCardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  savedCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  savedCardInfo: { flex: 1 },
  savedCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  savedCardDoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.success + "18",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  savedCardDoneLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.success,
  },
  savedCardName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  savedCardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  savedCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  savedCardBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  savedCardRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 4,
  },
  savedCardReviewCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  savedCardReasonBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
  },
  savedCardReasonText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: "italic",
  },
  savedCardDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    paddingTop: 2,
  },
  activityTimeline: {
    marginTop: 10,
    gap: 6,
  },
  activityTimelineStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityTimelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  activityTimelineTime: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    width: 42,
  },
  activityTimelineAction: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  savedCardLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  savedCardLinkText: {
    fontSize: 13,
    fontWeight: "600",
  },
  savedCardChangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  savedCardChangeBtnText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  // Skip text link
  skipLink: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  skipLinkText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textDecorationLine: "underline",
  },
  // Step indicator
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  stepLabel: { fontSize: 11, color: COLORS.textSecondary },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  stepSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  // Action button
  actionBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  actionBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 12,
  },
  actionBtnText: { flex: 1, fontSize: 16, fontWeight: "600", color: "#fff" },
  doneHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  doneHintText: { fontSize: 13, color: COLORS.success, fontWeight: "500" },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  nextBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  // Articles
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    marginVertical: 20,
  },
  noArticlesBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noArticlesText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  articleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  articleThumb: {
    width: 76,
    height: 76,
    borderRadius: 12,
    flexShrink: 0,
    overflow: "hidden",
  },
  articleInfo: { flex: 1, gap: 5 },
  articleTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  articleCatBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  articleCatText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  articleReadTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  articleReadTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  articleStats: {
    flexDirection: "row",
    gap: 10,
  },
  articleStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  articleStatText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  // Post-event
  ratingRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 16,
  },
  ratingLabel: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  photoBtnText: { fontSize: 14, color: COLORS.textSecondary },
  saveBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 28,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
  },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

export default OccasionPrepScreen;
