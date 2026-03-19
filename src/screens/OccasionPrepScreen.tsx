import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
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
  const tag = tags.find(t => TAG_TO_OCCASION[t]) || "birthday";
  return {
    occasionId: TAG_TO_OCCASION[tag] || "birthday",
    occasionName: TAG_TO_OCCASION_NAME[tag] || "Dịp đặc biệt",
    occasionColor: TAG_TO_OCCASION_COLOR[tag] || COLORS.primary,
    tag,
  };
};

const STEPS = ["Quà tặng", "Lịch trình", "Bài viết"];

const OccasionPrepScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { event, postEvent = false }: { event: Event; postEvent?: boolean } = route.params;
  const { upsertEventNote } = useEvents();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(postEvent ? 3 : 0);
  const [stepDone, setStepDone] = useState<boolean[]>([false, false, false]);
  const [articles, setArticles] = useState<Article[]>([]);

  // Post-event state
  const [rating, setRating] = useState(0);
  const [giftNote, setGiftNote] = useState("");
  const [activityNote, setActivityNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { occasionId, occasionName, occasionColor } = getOccasionInfo(event.tags);
  const currentYear = new Date().getFullYear();

  // Load articles theo tag
  useEffect(() => {
    fetchArticlesPaginated({ page: 1, limit: 3, category: occasionId })
      .then(res => setArticles(res.data))
      .catch(() => {});
  }, [occasionId]);

  // Detect khi quay về từ OccasionProducts / ActivitySuggestions để auto-tick
  useFocusEffect(
    React.useCallback(() => {
      const updatedEvent = event;
      const note = updatedEvent.notes?.find(n => n.year === currentYear);
      setStepDone([
        !!note?.gift,
        !!note?.activity,
        false,
      ]);
    }, [event])
  );

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)]);
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
        gift: giftNote.trim() ? { name: giftNote.trim(), source: "manual" } : undefined,
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
    navigation.navigate("OccasionProducts", {
      occasionId,
      occasionName,
      occasionColor,
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isPostEvent ? "Ghi lại kỷ niệm" : `Chuẩn bị — ${event.title}`}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step indicator — chỉ hiện ở pre-event */}
      {!isPostEvent && (
        <View style={styles.stepIndicator}>
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.stepDot,
                  i === step && { backgroundColor: occasionColor },
                  stepDone[i] && { backgroundColor: COLORS.success },
                  i < step && !stepDone[i] && { backgroundColor: COLORS.border },
                ]}>
                  {stepDone[i]
                    ? <Ionicons name="checkmark" size={12} color="#fff" />
                    : <Text style={styles.stepDotText}>{i + 1}</Text>
                  }
                </View>
                <Text style={[styles.stepLabel, i === step && { color: occasionColor, fontWeight: "600" }]}>
                  {label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, stepDone[i] && { backgroundColor: COLORS.success }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── PRE-EVENT STEP 0: Quà tặng ── */}
        {!isPostEvent && step === 0 && (
          <View>
            <Text style={styles.stepTitle}>Bạn đã có quà chưa?</Text>
            <Text style={styles.stepSub}>Tìm quà phù hợp cho dịp {occasionName}</Text>

            <TouchableOpacity style={[styles.actionBtn, { borderColor: occasionColor }]} onPress={goToGiftSuggestions} activeOpacity={0.85}>
              <LinearGradient colors={[occasionColor, occasionColor + "CC"]} style={styles.actionBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="gift" size={22} color="#fff" />
                <Text style={styles.actionBtnText}>Xem gợi ý quà tặng</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {stepDone[0] && (
              <View style={styles.doneHint}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.doneHintText}>Đã lưu quà vào sự kiện</Text>
              </View>
            )}

            <View style={styles.stepNav}>
              <TouchableOpacity style={styles.skipBtn} onPress={() => setStep(1)}>
                <Text style={styles.skipBtnText}>Có rồi, bỏ qua →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextBtn, { backgroundColor: occasionColor }]} onPress={() => setStep(1)}>
                <Text style={styles.nextBtnText}>Tiếp theo</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── PRE-EVENT STEP 1: Lịch trình ── */}
        {!isPostEvent && step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Đã có kế hoạch chưa?</Text>
            <Text style={styles.stepSub}>AI gợi ý lịch trình phù hợp cho bạn</Text>

            <TouchableOpacity style={[styles.actionBtn, { borderColor: occasionColor }]} onPress={goToActivitySuggestions} activeOpacity={0.85}>
              <LinearGradient colors={[occasionColor, occasionColor + "CC"]} style={styles.actionBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="map" size={22} color="#fff" />
                <Text style={styles.actionBtnText}>AI gợi ý lịch trình</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {stepDone[1] && (
              <View style={styles.doneHint}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.doneHintText}>Đã lưu lịch trình vào sự kiện</Text>
              </View>
            )}

            <View style={styles.stepNav}>
              <TouchableOpacity style={styles.skipBtn} onPress={() => setStep(2)}>
                <Text style={styles.skipBtnText}>Có rồi, bỏ qua →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextBtn, { backgroundColor: occasionColor }]} onPress={() => setStep(2)}>
                <Text style={styles.nextBtnText}>Tiếp theo</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── PRE-EVENT STEP 2: Bài viết ── */}
        {!isPostEvent && step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Tham khảo kinh nghiệm</Text>
            <Text style={styles.stepSub}>Bài viết liên quan dịp {occasionName}</Text>

            {articles.length === 0 ? (
              <Text style={styles.emptyText}>Đang tải bài viết...</Text>
            ) : (
              articles.map(article => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.articleCard}
                  onPress={() => navigation.navigate("ArticleDetail", { article })}
                  activeOpacity={0.8}
                >
                  <View style={styles.articleInfo}>
                    <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: occasionColor, alignSelf: "center", marginTop: 24, paddingHorizontal: 32 }]}
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
            <Text style={styles.stepSub}>Ghi lại để nhớ mãi khoảnh khắc này</Text>

            {/* Star rating */}
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
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
                {["", "Chưa vừa ý", "Tạm được", "Ổn", "Vui lắm!", "Tuyệt vời!"][rating]}
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
            <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.photoBtnText}>
                {photos.length > 0 ? `Đã chọn ${photos.length} ảnh` : "Thêm ảnh"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSavePostEvent}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[COLORS.primary, "#C850C0"]} style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="heart" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>{isSaving ? "Đang lưu..." : "Lưu kỷ niệm"}</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary, flex: 1, textAlign: "center" },
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
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginBottom: 16 },
  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  stepTitle: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 6 },
  stepSub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 20 },
  // Action button
  actionBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 12, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6 },
  actionBtnGradient: { flexDirection: "row", alignItems: "center", padding: 18, gap: 12 },
  actionBtnText: { flex: 1, fontSize: 16, fontWeight: "600", color: "#fff" },
  doneHint: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  doneHintText: { fontSize: 13, color: COLORS.success, fontWeight: "500" },
  // Nav
  stepNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24 },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 4 },
  skipBtnText: { fontSize: 14, color: COLORS.textSecondary },
  nextBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  nextBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  // Articles
  emptyText: { color: COLORS.textSecondary, textAlign: "center", marginVertical: 20 },
  articleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  articleInfo: { flex: 1 },
  articleTitle: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  // Post-event
  ratingRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginVertical: 16 },
  ratingLabel: { textAlign: "center", fontSize: 15, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 8, marginTop: 12 },
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
  saveBtn: { borderRadius: 14, overflow: "hidden", marginTop: 28, elevation: 6, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
  saveBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, gap: 10 },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

export default OccasionPrepScreen;
