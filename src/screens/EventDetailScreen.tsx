import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useEvents } from "@contexts/EventsContext";
import { useToast } from "../contexts/ToastContext";
import { Event, ChecklistItem, getTagInfo } from "../types";
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
  const primaryEmoji = tagDetails.emoji;

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
              <Text style={{ fontSize: 32 }}>{primaryEmoji}</Text>
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

        {/* Order banners — flower & cake */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.orderBanner}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("LocalShop")}
          >
            <Text style={styles.orderBannerEmoji}>💐</Text>
            <View style={styles.orderBannerText}>
              <Text style={styles.orderBannerTitle}>
                Đặt hoa tươi giao tận nơi
              </Text>
              <Text style={styles.orderBannerSub}>
                Bó hoa, giỏ hoa, hoa chúc mừng
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EC4899" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.orderBanner, { borderColor: "#F59E0B25" }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("LocalShop")}
          >
            <Text style={styles.orderBannerEmoji}>🎂</Text>
            <View style={styles.orderBannerText}>
              <Text style={styles.orderBannerTitle}>
                Đặt bánh kem, bánh ngọt
              </Text>
              <Text style={styles.orderBannerSub}>
                Bánh sinh nhật, cupcake, bánh kem
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.orderBanner, { borderColor: COLORS.primary + "25" }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("AllProducts")}
          >
            <Text style={styles.orderBannerEmoji}>🎁</Text>
            <View style={styles.orderBannerText}>
              <Text style={styles.orderBannerTitle}>Sản phẩm quà tặng</Text>
              <Text style={styles.orderBannerSub}>Xem tất cả sản phẩm gợi ý</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.orderBanner, { borderColor: "#8B5CF625" }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("AllArticles")}
          >
            <Text style={styles.orderBannerEmoji}>📖</Text>
            <View style={styles.orderBannerText}>
              <Text style={styles.orderBannerTitle}>Bài viết hay</Text>
              <Text style={styles.orderBannerSub}>Mẹo tặng quà, hẹn hò & tình yêu</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
          </TouchableOpacity>
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

  // Order banners (flower & cake)
  orderBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "25",
    marginBottom: 10,
    elevation: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  orderBannerEmoji: {
    fontSize: 28,
  },
  orderBannerText: {
    flex: 1,
  },
  orderBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  orderBannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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
