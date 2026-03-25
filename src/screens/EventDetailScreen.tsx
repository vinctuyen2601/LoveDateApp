import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import ConfirmDialog from "@components/organisms/ConfirmDialog";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useEvents } from "@contexts/EventsContext";
import { useToast } from "../contexts/ToastContext";
import { Event, ChecklistItem, getTagInfo, getTagImage } from "../types";
import { getSpecialDateImage } from "@lib/iconImages";
import { getSpecialDatesForMonth } from "../constants/specialDates";
import { LinearGradient } from "expo-linear-gradient";
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

const OCCASION_TAGS = ["birthday", "anniversary", "holiday"];

function formatNotePrice(price: number): string {
  const styles = useStyles();
  const colors = useColors();

  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}M đ`;
  }
  if (price >= 1_000) return `${Math.round(price / 1_000)}k đ`;
  return `${price} đ`;
}

const getDaysUntil = (eventDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
};
import { DateUtils } from "@lib/date.utils";
import { COLORS } from "@themes/colors";
import CountdownTimer from "@components/molecules/CountdownTimer";
import ChecklistSection from "@components/organisms/ChecklistSection";
import * as ChecklistService from "../services/checklist.service";
import { getSharedEventInfo, getSharedOutbox } from "../services/connections.service";
import type { SharedEvent } from "../types/connections";

const EventDetailScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();

  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const db = useSQLiteContext();
  const { getEventById, deleteEvent } = useEvents();
  const { showSuccess, showError } = useToast();
  const { eventId } = route.params;

  // Get event directly in render to ensure it updates when events context changes
  const event = getEventById(eventId);

  // Checklist state
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(true);
  const [sharerPlanInfo, setSharerPlanInfo] = useState<{ hasPlan: boolean; sharerName: string } | null>(null);
  const [sharedWithList, setSharedWithList] = useState<SharedEvent[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean; title: string; message: string;
    confirmText: string; onConfirm: () => void;
  }>({ visible: false, title: '', message: '', confirmText: 'Xác nhận', onConfirm: () => {} });
  const closeConfirm = () => setConfirmDialog((d) => ({ ...d, visible: false }));

  // If event is deleted or not found, navigate back
  React.useEffect(() => {
    if (!event) {
      // Event was deleted or doesn't exist
      navigation.goBack();
    }
  }, [event, navigation]);

  // Load checklist when component mounts or event changes
  useEffect(() => {
    if (event) {
      loadChecklist();
    }
  }, [event?.id]);

  // Nếu event từ shared → lấy thông tin hasPlan của người share
  useEffect(() => {
    if (!event?.sourceSharedEventId) return;
    getSharedEventInfo(event.sourceSharedEventId)
      .then(setSharerPlanInfo)
      .catch(() => {});
  }, [event?.sourceSharedEventId]);

  // Nếu là event gốc (có serverId) → lấy danh sách đã chia sẻ
  useEffect(() => {
    if (event?.sourceSharedEventId || !event?.serverId) return;
    getSharedOutbox()
      .then((list) => {
        const filtered = list.filter((se) => se.originalEventId === event.serverId);
        setSharedWithList(filtered);
      })
      .catch(() => {});
  }, [event?.serverId, event?.sourceSharedEventId]);

  const loadChecklist = async () => {
    if (!event) return;

    try {
      setIsLoadingChecklist(true);

      // Check if checklist exists
      let items = await ChecklistService.getChecklistItems(db, event.id);

      // If no checklist, auto-generate based on event tags
      if (items.length === 0) {
        items = await ChecklistService.generateChecklistForEvent(
          db,
          event.id,
          event.title,
          event.tags
        );
      }

      // Auto-check items that match what's already prepared in EventNote (current year)
      const currentYear = new Date().getFullYear();
      const thisYearNote = event.notes?.find((n) => n.year === currentYear);
      if (thisYearNote) {
        const giftKeywords = ["quà", "hoa"];
        const activityKeywords = [
          "nhà hàng",
          "địa điểm",
          "đặt bàn",
          "kế hoạch",
          "lịch",
        ];
        let didAutoCheck = false;
        for (const item of items) {
          if (item.isCompleted) continue;
          const t = item.title.toLowerCase();
          const isGift =
            thisYearNote.gift && giftKeywords.some((k) => t.includes(k));
          const isActivity =
            thisYearNote.activity &&
            activityKeywords.some((k) => t.includes(k));
          if (isGift || isActivity) {
            await ChecklistService.updateChecklistItem(db, item.id, {
              isCompleted: true,
            });
            didAutoCheck = true;
          }
        }
        if (didAutoCheck) {
          items = await ChecklistService.getChecklistItems(db, event.id);
        }
      }

      setChecklistItems(items);
    } catch (error) {
      console.error("Error loading checklist:", error);
    } finally {
      setIsLoadingChecklist(false);
    }
  };

  const handleToggleChecklistItem = async (id: string) => {
    try {
      await ChecklistService.toggleChecklistItem(db, id);
      await loadChecklist(); // Reload to get updated data
    } catch (error) {
      showError("Không thể cập nhật checklist");
    }
  };

  const handleDeleteChecklistItem = async (id: string) => {
    try {
      await ChecklistService.deleteChecklistItem(db, id);
      await loadChecklist();
      showSuccess("Đã xóa mục");
    } catch (error) {
      showError("Không thể xóa mục");
    }
  };

  const handleAddChecklistItem = async (title: string) => {
    if (!event) return;
    try {
      await ChecklistService.createChecklistItem(db, event.id, title);
      await loadChecklist();
      showSuccess("Đã thêm mục mới");
    } catch (error) {
      showError("Không thể thêm mục");
    }
  };

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.error}
          />
          <Text style={styles.errorText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  const primaryTag = event.tags[0] || "other";
  const tagDetails = getTagInfo(primaryTag);
  const primaryColor = tagDetails.color;
  const PREP_SPECIAL_IDS = [
    "sys_valentine",
    "sys_quocte_phunu",
    "sys_phunu_vn",
    "sys_giang_sinh",
  ];
  const primaryImage = (() => {
    if (event.tags.includes("holiday")) {
      const d = new Date(event.eventDate);
      const specials = getSpecialDatesForMonth(
        d.getFullYear(),
        d.getMonth() + 1
      );
      const match = specials.find(
        (sd) => PREP_SPECIAL_IDS.includes(sd.id) && sd.solarDay === d.getDate()
      );
      if (match) return getSpecialDateImage(match.id);
    }
    return getTagImage(primaryTag);
  })();

  const handleEdit = () => {
    navigation.navigate("AddEvent", { eventId: event.id });
  };

  const handleDelete = () => {
    setConfirmDialog({
      visible: true,
      title: 'Xóa sự kiện',
      message: `Bạn có chắc muốn xóa "${event.title}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      onConfirm: async () => {
        closeConfirm();
        try {
          const eventTitle = event.title;
          await deleteEvent(event.id);
          showSuccess(`Đã xóa sự kiện "${eventTitle}"`);
        } catch (error) {
          showError("Không thể xóa sự kiện");
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section — compact */}
        <View
          style={[styles.heroSection, { backgroundColor: primaryColor + "10" }]}
        >
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.heroIcon,
                { backgroundColor: primaryColor + "20" },
              ]}
            >
              <Image source={primaryImage} style={{ width: 32, height: 32 }} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {event.title}
              </Text>
              <View style={styles.heroMeta}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: primaryColor },
                  ]}
                >
                  <Text style={styles.categoryBadgeText}>
                    {tagDetails.label}
                  </Text>
                </View>
                {event.isRecurring && (
                  <View style={styles.recurBadge}>
                    <Ionicons
                      name="repeat"
                      size={12}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.recurBadgeText}>
                      {event.recurrencePattern?.type === 'weekly'
                        ? 'Hàng tuần'
                        : event.recurrencePattern?.type === 'monthly'
                        ? 'Hàng tháng'
                        : 'Hàng năm'}
                    </Text>
                  </View>
                )}
                {event.isLunarCalendar && (
                  <View style={styles.recurBadge}>
                    <Ionicons
                      name="moon-outline"
                      size={12}
                      color={colors.warning}
                    />
                    <Text
                      style={[styles.recurBadgeText, { color: colors.warning }]}
                    >
                      Âm lịch
                    </Text>
                  </View>
                )}
                {!!event.sourceSharedEventId && (
                  <View style={[styles.recurBadge, styles.sharedBadge]}>
                    <Ionicons
                      name="people-outline"
                      size={12}
                      color={colors.primary}
                    />
                    <Text style={[styles.recurBadgeText, { color: colors.primary }]}>
                      {sharerPlanInfo?.sharerName
                        ? `Từ ${sharerPlanInfo.sharerName}`
                        : "Được chia sẻ"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Date + Countdown inline */}
          <View style={styles.heroCountdown}>
            <CountdownTimer targetDate={event.eventDate} compact={true} />
          </View>

          {/* Reminder info inline */}
          {event.reminderSettings.remindDaysBefore.length > 0 && (
            <>
              <View style={styles.heroDivider} />
              <View style={styles.reminderInline}>
                {event.reminderSettings.reminderTime && (
                  <View style={styles.reminderInlineItem}>
                    <View
                      style={[
                        styles.reminderDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.reminderInlineText}>
                      Nhắc lúc{" "}
                      <Text style={styles.reminderInlineBold}>
                        {event.reminderSettings.reminderTime.hour
                          .toString()
                          .padStart(2, "0")}
                        :
                        {event.reminderSettings.reminderTime.minute
                          .toString()
                          .padStart(2, "0")}
                      </Text>
                    </Text>
                  </View>
                )}
                <View style={styles.reminderInlineItem}>
                  <View
                    style={[
                      styles.reminderDot,
                      { backgroundColor: colors.info },
                    ]}
                  />
                  <Ionicons
                    name="notifications-outline"
                    size={16}
                    color={colors.info}
                  />
                  <Text style={styles.reminderInlineText}>
                    Nhắc trước{" "}
                    {event.reminderSettings.remindDaysBefore.map((days, i) => (
                      <Text key={i} style={styles.reminderInlineBold}>
                        {days === 0 ? "hôm nay" : `${days} ngày`}
                        {i < event.reminderSettings.remindDaysBefore.length - 1
                          ? ", "
                          : ""}
                      </Text>
                    ))}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Sharer Plan Badge — chỉ hiện nếu event từ shared + người share đã có kế hoạch */}
        {event.sourceSharedEventId && sharerPlanInfo?.hasPlan && (
          <View style={styles.sharerPlanBadge}>
            <View style={styles.sharerPlanIconWrap}>
              <Ionicons name="gift-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.sharerPlanTextWrap}>
              <Text style={styles.sharerPlanTitle}>
                {sharerPlanInfo.sharerName} đã có kế hoạch chuẩn bị
              </Text>
              <Text style={styles.sharerPlanSub}>
                Hãy để họ làm bạn ngạc nhiên nhé!
              </Text>
            </View>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>
        )}

        {/* Occasion Prep Banner — eligible tag + còn ≤ 30 ngày + chưa có note năm nay */}
        {(() => {
          if (event.sourceSharedEventId) return null;
          if (event.recurrencePattern?.type === 'weekly') return null;
          const isEligible = event.tags.some((t) => OCCASION_TAGS.includes(t));
          const daysUntil = getDaysUntil(event.eventDate);
          const currentYear = new Date().getFullYear();
          const hasNoteThisYear = event.notes?.some(
            (n) => n.year === currentYear && (n.gift || n.activity)
          );
          if (!isEligible || daysUntil < 0 || daysUntil > 30 || hasNoteThisYear)
            return null;
          return (
            <TouchableOpacity
              style={styles.prepBanner}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate("OccasionPrep", {
                  eventId: event.id,
                  event,
                })
              }
            >
              <LinearGradient
                colors={[colors.primary, "#C850C0"]}
                style={styles.prepBannerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="sparkles" size={20} color={colors.white} />
                <View style={styles.prepBannerText}>
                  <Text style={styles.prepBannerTitle}>
                    {daysUntil === 0
                      ? "Hôm nay rồi! Chuẩn bị gì chưa?"
                      : `Còn ${daysUntil} ngày — Bắt đầu chuẩn bị?`}
                  </Text>
                  <Text style={styles.prepBannerSub}>
                    {daysUntil === 0
                      ? "Để AI gợi ý quà và lịch trình ngay bây giờ"
                      : "Gợi ý quà, lịch trình và bài viết cho dịp này"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          );
        })()}

        {/* Post-event Banner — eligible + đã qua ≤ 3 ngày + chưa rating */}
        {(() => {
          if (event.sourceSharedEventId) return null;
          if (event.recurrencePattern?.type === 'weekly') return null;
          const isEligible = event.tags.some((t) => OCCASION_TAGS.includes(t));
          const daysUntil = getDaysUntil(event.eventDate);
          const currentYear = new Date().getFullYear();
          const hasRating = event.notes?.some(
            (n) => n.year === currentYear && n.rating
          );
          if (!isEligible || daysUntil >= 0 || daysUntil < -3 || hasRating)
            return null;
          return (
            <TouchableOpacity
              style={styles.postEventBanner}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate("OccasionPrep", {
                  eventId: event.id,
                  event,
                  postEvent: true,
                })
              }
            >
              <LinearGradient
                colors={[colors.primary, "#C850C0"]}
                style={styles.postEventBannerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="heart" size={20} color={colors.white} />
                <View style={styles.prepBannerText}>
                  <Text style={styles.postEventTitle}>Hôm qua thế nào?</Text>
                  <Text style={styles.postEventSub}>
                    Ghi lại kỷ niệm và đánh giá dịp này
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="rgba(255,255,255,0.8)"
                />
              </LinearGradient>
            </TouchableOpacity>
          );
        })()}

        {/* Preparation Status Card — upcoming event already has note for current year */}
        {(() => {
          if (event.sourceSharedEventId) return null;
          if (event.recurrencePattern?.type === 'weekly') return null;
          const currentYear = new Date().getFullYear();
          const daysUntil = getDaysUntil(event.eventDate);
          const thisYearNote = event.notes?.find(
            (n) => n.year === currentYear && (n.gift || n.activity)
          );
          if (daysUntil <= 0 || !thisYearNote) return null;
          const giftDone = !!thisYearNote.gift;
          const activityDone = !!thisYearNote.activity;
          const allDone = giftDone && activityDone;
          return (
            <View style={[styles.section, { marginTop: 12 }]}>
              <View style={styles.prepStatusCard}>
                {/* Header */}
                <View style={styles.prepStatusHeader}>
                  <View
                    style={[
                      styles.prepStatusIconWrap,
                      allDone && { backgroundColor: colors.success + "20" },
                    ]}
                  >
                    <Ionicons
                      name={allDone ? "checkmark-circle" : "time-outline"}
                      size={20}
                      color={allDone ? colors.success : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prepStatusTitle}>
                      {allDone
                        ? "Đã sẵn sàng cho ngày này!"
                        : "Đang chuẩn bị..."}
                    </Text>
                    {!allDone && (
                      <Text style={styles.prepStatusSubtitle}>
                        Còn thiếu{" "}
                        {!giftDone && !activityDone
                          ? "quà & lịch trình"
                          : !giftDone
                          ? "quà tặng"
                          : "lịch trình"}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("OccasionPrep", {
                        eventId: event.id,
                        event,
                      })
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.prepStatusEdit}>Chỉnh sửa</Text>
                  </TouchableOpacity>
                </View>

                {/* Gift detail */}
                {thisYearNote.gift && (
                  <View style={styles.prepDetailCard}>
                    <View style={styles.prepDetailHeader}>
                      <View style={styles.prepStatusCheck}>
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color={colors.success}
                        />
                      </View>
                      <Ionicons
                        name="gift-outline"
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={styles.prepDetailSectionLabel}>
                        Quà tặng
                      </Text>
                    </View>
                    <View style={styles.prepDetailBody}>
                      {thisYearNote.gift.imageUrl ? (
                        <Image
                          source={{ uri: thisYearNote.gift.imageUrl }}
                          style={styles.prepDetailImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={[primaryColor, primaryColor + "CC"]}
                          style={styles.prepDetailImage}
                        >
                          <Ionicons name="gift" size={28} color={colors.white} />
                        </LinearGradient>
                      )}
                      <View style={styles.prepDetailInfo}>
                        <Text style={styles.prepDetailName} numberOfLines={2}>
                          {thisYearNote.gift.name}
                        </Text>
                        {thisYearNote.gift.rating ? (
                          <View style={styles.prepDetailRatingRow}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Ionicons
                                key={s}
                                name={
                                  s <= Math.round(thisYearNote.gift!.rating!)
                                    ? "star"
                                    : "star-outline"
                                }
                                size={11}
                                color="#FFB800"
                              />
                            ))}
                            {thisYearNote.gift.reviewCount ? (
                              <Text style={styles.prepDetailReviewCount}>
                                ({thisYearNote.gift.reviewCount})
                              </Text>
                            ) : null}
                          </View>
                        ) : null}
                        <View style={styles.prepDetailMeta}>
                          {thisYearNote.gift.price != null && (
                            <View
                              style={[
                                styles.prepDetailBadge,
                                {
                                  borderColor: primaryColor + "40",
                                  backgroundColor: primaryColor + "0D",
                                },
                              ]}
                            >
                              <Ionicons
                                name="wallet-outline"
                                size={11}
                                color={primaryColor}
                              />
                              <Text
                                style={[
                                  styles.prepDetailBadgeText,
                                  { color: primaryColor },
                                ]}
                              >
                                {formatNotePrice(thisYearNote.gift.price)}
                              </Text>
                            </View>
                          )}
                          {thisYearNote.gift.source === "occasion_products" && (
                            <View style={styles.prepDetailBadge}>
                              <Ionicons
                                name="sparkles-outline"
                                size={11}
                                color={colors.textSecondary}
                              />
                              <Text style={styles.prepDetailBadgeText}>
                                Gợi ý AI
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {thisYearNote.gift.link ? (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(thisYearNote.gift!.link!)
                          }
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="open-outline"
                            size={16}
                            color={colors.info}
                          />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {thisYearNote.gift.reason ||
                    thisYearNote.gift.description ? (
                      <View
                        style={[
                          styles.prepDetailReasonBox,
                          {
                            backgroundColor: primaryColor + "0A",
                            borderColor: primaryColor + "25",
                          },
                        ]}
                      >
                        <Ionicons
                          name="sparkles"
                          size={12}
                          color={primaryColor}
                        />
                        <Text
                          style={[
                            styles.prepDetailReasonText,
                            { color: primaryColor },
                          ]}
                          numberOfLines={5}
                        >
                          {thisYearNote.gift.reason ||
                            thisYearNote.gift.description}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {/* Activity detail */}
                {thisYearNote.activity && (
                  <View style={styles.prepDetailCard}>
                    <View style={styles.prepDetailHeader}>
                      <View style={styles.prepStatusCheck}>
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color={colors.success}
                        />
                      </View>
                      <Ionicons name="map-outline" size={14} color="#4ECDC4" />
                      <Text style={styles.prepDetailSectionLabel}>
                        Lịch trình
                      </Text>
                    </View>
                    <View style={styles.prepDetailBody}>
                      <View
                        style={[
                          styles.prepDetailImage,
                          {
                            backgroundColor: primaryColor + "18",
                            alignItems: "center",
                            justifyContent: "center",
                          },
                        ]}
                      >
                        {thisYearNote.activityEmoji ? (
                          <Text style={{ fontSize: 32 }}>
                            {thisYearNote.activityEmoji}
                          </Text>
                        ) : (
                          <Ionicons name="map" size={28} color={primaryColor} />
                        )}
                      </View>
                      <View style={styles.prepDetailInfo}>
                        <Text style={styles.prepDetailName} numberOfLines={2}>
                          {thisYearNote.activity}
                        </Text>
                        <View style={styles.prepDetailMeta}>
                          {thisYearNote.activityBudget && (
                            <View
                              style={[
                                styles.prepDetailBadge,
                                {
                                  borderColor: primaryColor + "40",
                                  backgroundColor: primaryColor + "0D",
                                },
                              ]}
                            >
                              <Ionicons
                                name="wallet-outline"
                                size={11}
                                color={primaryColor}
                              />
                              <Text
                                style={[
                                  styles.prepDetailBadgeText,
                                  { color: primaryColor },
                                ]}
                              >
                                {thisYearNote.activityBudget}
                              </Text>
                            </View>
                          )}
                          <View style={styles.prepDetailBadge}>
                            <Ionicons
                              name="sparkles-outline"
                              size={11}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.prepDetailBadgeText}>
                              AI gợi ý
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    {thisYearNote.activityWhyFit ? (
                      <View
                        style={[
                          styles.prepDetailReasonBox,
                          {
                            backgroundColor: primaryColor + "0A",
                            borderColor: primaryColor + "25",
                          },
                        ]}
                      >
                        <Ionicons
                          name="sparkles"
                          size={12}
                          color={primaryColor}
                        />
                        <Text
                          style={[
                            styles.prepDetailReasonText,
                            { color: primaryColor },
                          ]}
                          numberOfLines={3}
                        >
                          {thisYearNote.activityWhyFit}
                        </Text>
                      </View>
                    ) : null}
                    {thisYearNote.activityTimeline &&
                      thisYearNote.activityTimeline.length > 0 && (
                        <View style={styles.prepDetailTimeline}>
                          {thisYearNote.activityTimeline
                            .slice(0, 4)
                            .map((step, i) => (
                              <View
                                key={i}
                                style={styles.prepDetailTimelineStep}
                              >
                                <View
                                  style={[
                                    styles.prepDetailTimelineDot,
                                    { backgroundColor: primaryColor },
                                  ]}
                                />
                                <Text style={styles.prepDetailTimelineTime}>
                                  {step.time}
                                </Text>
                                <Text
                                  style={styles.prepDetailTimelineAction}
                                  numberOfLines={1}
                                >
                                  {step.action}
                                </Text>
                              </View>
                            ))}
                        </View>
                      )}
                  </View>
                )}
              </View>
            </View>
          );
        })()}

        {/* EventNote History — previous years (or current year for past events) */}
        {(() => {
          const currentYear = new Date().getFullYear();
          const daysUntil = getDaysUntil(event.eventDate);
          // For upcoming events: exclude current year (shown in prep status above)
          // For past events: show all years
          const notes = (event.notes ?? []).filter((n) => {
            if (!(n.gift || n.activity || n.note || n.rating)) return false;
            if (daysUntil > 0 && n.year === currentYear) return false;
            return true;
          });
          if (notes.length === 0) return null;
          const sorted = [...notes].sort((a, b) => b.year - a.year);
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kỷ niệm qua các năm</Text>
              {sorted.map((note) => (
                <View key={note.year} style={styles.noteCard}>
                  <View style={styles.noteCardHeader}>
                    <View style={styles.noteYearBadge}>
                      <Text style={styles.noteYearText}>{note.year}</Text>
                    </View>
                    {note.rating != null && (
                      <View style={styles.noteStars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons
                            key={s}
                            name={s <= note.rating! ? "star" : "star-outline"}
                            size={14}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                    )}
                  </View>

                  {note.gift && (
                    <View style={styles.prepDetailCard}>
                      <View style={styles.prepDetailHeader}>
                        <View style={styles.prepStatusCheck}>
                          <Ionicons
                            name="checkmark"
                            size={13}
                            color={colors.success}
                          />
                        </View>
                        <Ionicons
                          name="gift-outline"
                          size={14}
                          color={colors.primary}
                        />
                        <Text style={styles.prepDetailSectionLabel}>
                          Quà tặng
                        </Text>
                      </View>
                      <View style={styles.prepDetailBody}>
                        {note.gift.imageUrl ? (
                          <Image
                            source={{ uri: note.gift.imageUrl }}
                            style={styles.prepDetailImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <LinearGradient
                            colors={[primaryColor, primaryColor + "CC"]}
                            style={styles.prepDetailImage}
                          >
                            <Ionicons name="gift" size={24} color={colors.white} />
                          </LinearGradient>
                        )}
                        <View style={styles.prepDetailInfo}>
                          <Text style={styles.prepDetailName} numberOfLines={2}>
                            {note.gift.name}
                          </Text>
                          {note.gift.rating ? (
                            <View style={styles.prepDetailRatingRow}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Ionicons
                                  key={s}
                                  name={
                                    s <= Math.round(note.gift!.rating!)
                                      ? "star"
                                      : "star-outline"
                                  }
                                  size={11}
                                  color="#FFB800"
                                />
                              ))}
                              {note.gift.reviewCount ? (
                                <Text style={styles.prepDetailReviewCount}>
                                  ({note.gift.reviewCount})
                                </Text>
                              ) : null}
                            </View>
                          ) : null}
                          <View style={styles.prepDetailMeta}>
                            {note.gift.price != null && (
                              <View
                                style={[
                                  styles.prepDetailBadge,
                                  {
                                    borderColor: primaryColor + "40",
                                    backgroundColor: primaryColor + "0D",
                                  },
                                ]}
                              >
                                <Ionicons
                                  name="wallet-outline"
                                  size={11}
                                  color={primaryColor}
                                />
                                <Text
                                  style={[
                                    styles.prepDetailBadgeText,
                                    { color: primaryColor },
                                  ]}
                                >
                                  {formatNotePrice(note.gift.price)}
                                </Text>
                              </View>
                            )}
                            {note.gift.source === "occasion_products" && (
                              <View style={styles.prepDetailBadge}>
                                <Ionicons
                                  name="sparkles-outline"
                                  size={11}
                                  color={colors.textSecondary}
                                />
                                <Text style={styles.prepDetailBadgeText}>
                                  Gợi ý AI
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        {note.gift.link ? (
                          <TouchableOpacity
                            onPress={() => Linking.openURL(note.gift!.link!)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name="open-outline"
                              size={16}
                              color={colors.info}
                            />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      {note.gift.reason || note.gift.description ? (
                        <View
                          style={[
                            styles.prepDetailReasonBox,
                            {
                              backgroundColor: primaryColor + "0A",
                              borderColor: primaryColor + "25",
                            },
                          ]}
                        >
                          <Ionicons
                            name="sparkles"
                            size={12}
                            color={primaryColor}
                          />
                          <Text
                            style={[
                              styles.prepDetailReasonText,
                              { color: primaryColor },
                            ]}
                            numberOfLines={5}
                          >
                            {note.gift.reason || note.gift.description}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}

                  {note.activity ? (
                    <View style={styles.noteRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={15}
                        color="#4ECDC4"
                      />
                      <Text style={styles.noteRowText}>{note.activity}</Text>
                    </View>
                  ) : null}

                  {note.note ? (
                    <View style={styles.noteRow}>
                      <Ionicons
                        name="document-text-outline"
                        size={15}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[styles.noteRowText, { fontStyle: "italic" }]}
                      >
                        {note.note}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          );
        })()}

        {/* Checklist Section */}
        <View style={styles.section}>
          <ChecklistSection
            eventId={event.id}
            items={checklistItems}
            onToggle={handleToggleChecklistItem}
            onDelete={handleDeleteChecklistItem}
            onAdd={handleAddChecklistItem}
          />
        </View>

        {/* Shared With — chỉ hiện cho event gốc khi đã chia sẻ */}
        {!event.sourceSharedEventId && sharedWithList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đã chia sẻ với</Text>
            <View style={styles.sharedWithList}>
              {sharedWithList.map((se) => {
                const statusColor =
                  se.status === 'accepted' ? colors.success :
                  se.status === 'declined' ? colors.error :
                  '#F59E0B';
                const statusBg =
                  se.status === 'accepted' ? colors.success + '18' :
                  se.status === 'declined' ? colors.error + '18' :
                  '#F59E0B18';
                const statusLabel =
                  se.status === 'accepted' ? 'Đã thêm' :
                  se.status === 'declined' ? 'Đã từ chối' : 'Chờ xác nhận';
                const initials = (se.recipient.displayName || se.recipient.email || '?')[0].toUpperCase();
                const avatarBg = ['#FF6B6B', '#4ECDC4', '#845EF7', '#339AF0'][se.recipient.id.charCodeAt(0) % 4];
                return (
                  <View key={se.id} style={styles.sharedWithRow}>
                    <View style={[styles.sharedWithAvatar, { backgroundColor: avatarBg }]}>
                      {se.recipient.photoUrl ? (
                        <Image source={{ uri: se.recipient.photoUrl }} style={styles.sharedWithAvatarImg} />
                      ) : (
                        <Text style={styles.sharedWithAvatarText}>{initials}</Text>
                      )}
                    </View>
                    <View style={styles.sharedWithInfo}>
                      <Text style={styles.sharedWithName} numberOfLines={1}>
                        {se.recipient.displayName || 'Người dùng'}
                      </Text>
                      <Text style={styles.sharedWithEmail} numberOfLines={1}>
                        {se.recipient.email}
                      </Text>
                    </View>
                    <View style={[styles.sharedWithBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.sharedWithBadgeText, { color: statusColor }]}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick Actions Grid — ẩn cho sự kiện hàng tuần */}
        {event.recurrencePattern?.type !== 'weekly' && <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chuẩn bị cho ngày đặc biệt</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("Suggestions", {
                  screen: "GiftSuggestions",
                })
              }
            >
              <View
                style={[styles.actionIcon, { backgroundColor: colors.error + "15" }]}
              >
                <Ionicons name="gift" size={22} color={colors.error} />
              </View>
              <Text style={styles.actionTitle}>Gợi ý quà</Text>
              <Text style={styles.actionSub}>AI tìm quà phù hợp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("ActivitySuggestions", {
                  eventId: event.id,
                  event,
                })
              }
            >
              <View
                style={[styles.actionIcon, { backgroundColor: colors.secondary + "15" }]}
              >
                <Ionicons name="restaurant" size={22} color={colors.secondary} />
              </View>
              <Text style={styles.actionTitle}>Hoạt động</Text>
              <Text style={styles.actionSub}>Nhà hàng, địa điểm</Text>
            </TouchableOpacity>
          </View>
        </View>}

        {/* Quick links row — compact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Khám phá thêm</Text>
          <View style={styles.quickLinksRow}>
            <TouchableOpacity
              style={styles.quickLinkItem}
              onPress={() => navigation.navigate("LocalShop")}
              activeOpacity={0.75}
            >
              <View
                style={[styles.quickLinkIcon, { backgroundColor: colors.primary + "15" }]}
              >
                <Ionicons name="flower-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.quickLinkLabel}>Đặt hoa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkItem}
              onPress={() => navigation.navigate("LocalShop")}
              activeOpacity={0.75}
            >
              <View
                style={[styles.quickLinkIcon, { backgroundColor: colors.warning + "15" }]}
              >
                <Ionicons name="restaurant-outline" size={22} color={colors.warning} />
              </View>
              <Text style={styles.quickLinkLabel}>Đặt bánh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkItem}
              onPress={() => navigation.navigate("AllProducts")}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.quickLinkIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name="gift-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.quickLinkLabel}>Quà tặng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkItem}
              onPress={() => navigation.navigate("AllArticles")}
              activeOpacity={0.75}
            >
              <View
                style={[styles.quickLinkIcon, { backgroundColor: colors.info + "15" }]}
              >
                <Ionicons name="book-outline" size={22} color={colors.info} />
              </View>
              <Text style={styles.quickLinkLabel}>Bài viết</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        icon="trash-outline"
        iconColor={colors.error}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  scrollContent: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 24,
  },

  // Hero
  heroSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 6,
    lineHeight: 26,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
  },
  recurBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sharedBadge: {
    backgroundColor: colors.primary + "18",
  },
  recurBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'Manrope_500Medium',
  },
  heroDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    // backgroundColor: colors.surface,
    borderRadius: 12,
  },
  heroDateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroDateText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
  },
  heroCountdown: {
    // CountdownTimer compact will render here
  },

  // Section
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    paddingTop: 16,
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },

  // Quick Actions Grid (2x2)
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionCard: {
    width: "48%" as any,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },

  // Occasion Prep Banner
  sharerPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: colors.primary + '10',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFD6D6',
    gap: 10,
  },
  sharerPlanIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharerPlanEmoji: {
    fontSize: 20,
  },
  sharerPlanTextWrap: {
    flex: 1,
  },
  sharerPlanTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: '#333',
  },
  sharerPlanSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  sharedWithList: {
    gap: 10,
  },
  sharedWithRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  sharedWithAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharedWithAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sharedWithAvatarText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
  },
  sharedWithInfo: {
    flex: 1,
    gap: 2,
  },
  sharedWithName: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
  },
  sharedWithEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sharedWithBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sharedWithBadgeText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
  },
  prepBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  prepBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  prepBannerText: {
    flex: 1,
  },
  prepBannerTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: colors.white,
    marginBottom: 2,
  },
  prepBannerSub: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.85,
  },
  // Post-event Banner
  postEventBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  postEventBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  postEventTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: colors.white,
    marginBottom: 2,
  },
  postEventSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  // Quick links compact row
  quickLinksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  quickLinkItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  quickLinkIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLinkLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Preparation Status Card
  prepStatusCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: 10,
  },
  prepStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  prepStatusIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  prepStatusTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
  },
  prepStatusEdit: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.primary,
  },
  prepStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
  },
  prepStatusCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  prepStatusLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 1,
  },
  prepStatusValue: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
  },

  // EventNote history
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    gap: 10,
  },
  noteCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteYearBadge: {
    backgroundColor: colors.textSecondary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  noteYearText: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: colors.white,
  },
  noteStars: {
    flexDirection: "row",
    gap: 2,
    marginLeft: 2,
  },
  noteCurrentBadge: {
    marginLeft: "auto" as any,
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  noteCurrentBadgeText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.primary,
  },
  noteGiftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.primary + "08",
    borderRadius: 10,
    padding: 10,
  },
  noteGiftName: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
    lineHeight: 19,
  },
  noteGiftPrice: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: 'Manrope_500Medium',
    marginTop: 1,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  noteRowText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Tags
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  tagPillText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
  },

  // Reminders (inline in hero)
  heroDivider: {
    height: 1,
    marginTop: 0,
    marginBottom: 12,
  },
  reminderInline: {
    gap: 8,
  },
  reminderInlineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reminderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  reminderInlineText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reminderInlineBold: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
  },

  // Prep Status — detail card styles (matching OccasionPrepScreen savedCard)
  prepStatusSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  prepDetailCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    overflow: "hidden",
  },
  prepDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  prepDetailSectionLabel: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  prepDetailBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  prepDetailImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  prepDetailInfo: {
    flex: 1,
  },
  prepDetailName: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  prepDetailMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  prepDetailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prepDetailBadgeText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textSecondary,
  },
  prepDetailRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 4,
  },
  prepDetailReviewCount: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  prepDetailReasonBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  prepDetailReasonText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: "italic",
  },
  prepDetailTimeline: {
    marginTop: 10,
    gap: 6,
  },
  prepDetailTimelineStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  prepDetailTimelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  prepDetailTimelineTime: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: colors.textSecondary,
    width: 42,
  },
  prepDetailTimelineAction: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 16,
  },
}));export default EventDetailScreen;
