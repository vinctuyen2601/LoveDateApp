import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useEvents } from "@contexts/EventsContext";
import { useToast } from "../contexts/ToastContext";
import { Event, ChecklistItem, getTagInfo, getTagImage } from "../types";
import { LinearGradient } from "expo-linear-gradient";

const OCCASION_TAGS = ["birthday", "anniversary", "holiday"];

function formatNotePrice(price: number): string {
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

const EventDetailScreen: React.FC = () => {
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
            color={COLORS.error}
          />
          <Text style={styles.errorText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  const primaryTag = event.tags[0] || "other";
  const tagDetails = getTagInfo(primaryTag);
  const primaryColor = tagDetails.color;
  const primaryImage = getTagImage(primaryTag);

  const handleEdit = () => {
    navigation.navigate("AddEvent", { eventId: event.id });
  };

  const handleDelete = () => {
    Alert.alert("Xóa sự kiện", `Bạn có chắc muốn xóa "${event.title}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const eventTitle = event.title; // Save title before delete
            await deleteEvent(event.id);
            showSuccess(`Đã xóa sự kiện "${eventTitle}"`);
            // No need to manually navigate - useEffect will handle it when event becomes null
          } catch (error) {
            showError("Không thể xóa sự kiện");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
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
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.recurBadgeText}>Hàng năm</Text>
                  </View>
                )}
                {event.isLunarCalendar && (
                  <View style={styles.recurBadge}>
                    <Ionicons
                      name="moon-outline"
                      size={12}
                      color={COLORS.warning}
                    />
                    <Text
                      style={[styles.recurBadgeText, { color: COLORS.warning }]}
                    >
                      Âm lịch
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
                        { backgroundColor: COLORS.primary },
                      ]}
                    />
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={COLORS.primary}
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
                      { backgroundColor: COLORS.info },
                    ]}
                  />
                  <Ionicons
                    name="notifications-outline"
                    size={16}
                    color={COLORS.info}
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

        {/* Occasion Prep Banner — eligible tag + còn ≤ 30 ngày + chưa có note năm nay */}
        {(() => {
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
                colors={[COLORS.primary, "#C850C0"]}
                style={styles.prepBannerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="sparkles" size={20} color="#fff" />
                <View style={styles.prepBannerText}>
                  <Text style={styles.prepBannerTitle}>
                    Còn {daysUntil} ngày — Bắt đầu chuẩn bị?
                  </Text>
                  <Text style={styles.prepBannerSub}>
                    Gợi ý quà, lịch trình và bài viết cho dịp này
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          );
        })()}

        {/* Post-event Banner — eligible + đã qua ≤ 3 ngày + chưa rating */}
        {(() => {
          const isEligible = event.tags.some((t) => OCCASION_TAGS.includes(t));
          const daysUntil = getDaysUntil(event.eventDate);
          const currentYear = new Date().getFullYear();
          const hasRating = event.notes?.some(
            (n) => n.year === currentYear && n.rating
          );
          if (!isEligible || daysUntil > 0 || daysUntil < -3 || hasRating)
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
              <Text style={styles.postEventEmoji}>
                <Ionicons name="heart" size={18} color={COLORS.primary} />
              </Text>
              <View style={styles.prepBannerText}>
                <Text style={styles.postEventTitle}>Hôm qua thế nào?</Text>
                <Text style={styles.postEventSub}>
                  Ghi lại kỷ niệm và đánh giá dịp này
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          );
        })()}

        {/* Preparation Status Card — upcoming event already has note for current year */}
        {(() => {
          const currentYear = new Date().getFullYear();
          const daysUntil = getDaysUntil(event.eventDate);
          const thisYearNote = event.notes?.find(
            (n) => n.year === currentYear && (n.gift || n.activity)
          );
          if (daysUntil <= 0 || !thisYearNote) return null;
          return (
            <View style={[styles.section, { marginTop: 12 }]}>
              <View style={styles.prepStatusCard}>
                {/* Header */}
                <View style={styles.prepStatusHeader}>
                  <View style={styles.prepStatusIconWrap}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={COLORS.success}
                    />
                  </View>
                  <Text style={styles.prepStatusTitle}>
                    Đang chuẩn bị cho ngày này
                  </Text>
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

                {/* Gift row */}
                {thisYearNote.gift && (
                  <View style={styles.prepStatusRow}>
                    <View style={styles.prepStatusCheck}>
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color={COLORS.success}
                      />
                    </View>
                    <Ionicons
                      name="gift-outline"
                      size={16}
                      color={COLORS.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prepStatusLabel}>
                        Bạn đã chuẩn bị quà
                      </Text>
                      <Text style={styles.prepStatusValue} numberOfLines={1}>
                        {thisYearNote.gift.name}
                        {thisYearNote.gift.price != null
                          ? `  ·  ${formatNotePrice(thisYearNote.gift.price)}`
                          : ""}
                      </Text>
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
                          color={COLORS.info}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}

                {/* Activity row */}
                {thisYearNote.activity ? (
                  <View style={styles.prepStatusRow}>
                    <View style={styles.prepStatusCheck}>
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color={COLORS.success}
                      />
                    </View>
                    <Ionicons name="map-outline" size={16} color="#4ECDC4" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prepStatusLabel}>
                        Bạn đã lên lịch trình
                      </Text>
                      <Text style={styles.prepStatusValue} numberOfLines={1}>
                        {thisYearNote.activity}
                      </Text>
                    </View>
                  </View>
                ) : null}
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
                    <View style={styles.noteGiftRow}>
                      <Ionicons
                        name="gift-outline"
                        size={16}
                        color={COLORS.primary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.noteGiftName}>
                          {note.gift.name}
                        </Text>
                        {note.gift.price != null && (
                          <Text style={styles.noteGiftPrice}>
                            {formatNotePrice(note.gift.price)}
                          </Text>
                        )}
                      </View>
                      {note.gift.link ? (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(note.gift!.link!)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="open-outline"
                            size={16}
                            color={COLORS.info}
                          />
                        </TouchableOpacity>
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
                        color={COLORS.textSecondary}
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

        {/* Quick Actions Grid */}
        <View style={styles.section}>
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
                style={[styles.actionIcon, { backgroundColor: "#FF6B6B15" }]}
              >
                <Ionicons name="gift" size={22} color="#FF6B6B" />
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
                style={[styles.actionIcon, { backgroundColor: "#4ECDC415" }]}
              >
                <Ionicons name="restaurant" size={22} color="#4ECDC4" />
              </View>
              <Text style={styles.actionTitle}>Hoạt động</Text>
              <Text style={styles.actionSub}>Nhà hàng, địa điểm</Text>
            </TouchableOpacity>
          </View>
        </View>

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
                style={[styles.quickLinkIcon, { backgroundColor: "#EC489915" }]}
              >
                <Ionicons name="flower-outline" size={22} color="#EC4899" />
              </View>
              <Text style={styles.quickLinkLabel}>Đặt hoa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkItem}
              onPress={() => navigation.navigate("LocalShop")}
              activeOpacity={0.75}
            >
              <View
                style={[styles.quickLinkIcon, { backgroundColor: "#F59E0B15" }]}
              >
                <Ionicons name="restaurant-outline" size={22} color="#F59E0B" />
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
                  { backgroundColor: COLORS.primary + "15" },
                ]}
              >
                <Ionicons
                  name="gift-outline"
                  size={22}
                  color={COLORS.primary}
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
                style={[styles.quickLinkIcon, { backgroundColor: "#8B5CF615" }]}
              >
                <Ionicons name="book-outline" size={22} color="#8B5CF6" />
              </View>
              <Text style={styles.quickLinkLabel}>Bài viết</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
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
    fontWeight: "600",
    color: COLORS.textPrimary,
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
    fontWeight: "700",
    color: COLORS.textPrimary,
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
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "700",
  },
  recurBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recurBadgeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  heroDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    // backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  heroDateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroDateText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
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
    fontWeight: "700",
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    shadowColor: COLORS.shadow,
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
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },

  // Occasion Prep Banner
  prepBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: COLORS.primary,
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
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  prepBannerSub: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.85,
  },
  // Post-event Banner
  postEventBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  postEventTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  postEventSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  postEventEmoji: {
    fontSize: 20,
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
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Preparation Status Card
  prepStatusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
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
    backgroundColor: COLORS.success + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  prepStatusTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  prepStatusEdit: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  prepStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
  },
  prepStatusCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  prepStatusLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 1,
  },
  prepStatusValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  // EventNote history
  noteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: COLORS.shadow,
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
    backgroundColor: COLORS.textSecondary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  noteYearText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
  noteStars: {
    flexDirection: "row",
    gap: 2,
    marginLeft: 2,
  },
  noteCurrentBadge: {
    marginLeft: "auto" as any,
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  noteCurrentBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },
  noteGiftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.primary + "08",
    borderRadius: 10,
    padding: 10,
  },
  noteGiftName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  noteGiftPrice: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
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
    color: COLORS.textSecondary,
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
    fontWeight: "600",
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
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  reminderInlineBold: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
});

export default EventDetailScreen;
