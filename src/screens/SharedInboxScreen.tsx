import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { COLORS } from "@themes/colors";
import { useToast } from "../contexts/ToastContext";
import {
  getSharedInbox,
  getSharedOutbox,
} from "../services/connections.service";
import type { SharedEvent } from "../types/connections";
import { getTagIcon } from "../types";
import { makeStyles } from "@utils/makeStyles";
import { useColors } from "@contexts/ThemeContext";

type TabKey = "inbox" | "outbox";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (isoDate: string, isLunar: boolean): string => {
  try {
    const d = new Date(isoDate);
    const dateStr = d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return isLunar ? `${dateStr} (âm lịch)` : dateStr;
  } catch {
    return isoDate;
  }
};

const getRelativeTime = (isoDate: string): string => {
  try {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(isoDate).toLocaleDateString("vi-VN");
  } catch {
    return "";
  }
};

const getStatusConfig = (status: string) => {
  const styles = useStyles();
  const colors = useColors();

  switch (status) {
    case "pending":
      return {
        label: "Chờ xác nhận",
        color: colors.warning,
        bg: colors.warning + "18",
        icon: "time-outline" as const,
      };
    case "accepted":
      return {
        label: "Đã thêm vào lịch",
        color: colors.success,
        bg: colors.success + "18",
        icon: "checkmark-circle-outline" as const,
      };
    case "declined":
      return {
        label: "Đã từ chối",
        color: colors.error,
        bg: colors.error + "18",
        icon: "close-circle-outline" as const,
      };
    default:
      return {
        label: status,
        color: colors.textSecondary,
        bg: colors.border,
        icon: "help-circle-outline" as const,
      };
  }
};

const getInitials = (name?: string, email?: string): string => {
  const src = name?.trim() || email?.trim() || "?";
  const words = src.split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const AVATAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#845EF7",
  "#339AF0",
  "#51CF66",
  "#F06595",
];
const getAvatarColor = (id: string) =>
  AVATAR_COLORS[
    (id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % AVATAR_COLORS.length
  ];

// ── Main component ────────────────────────────────────────────────────────────

const SharedInboxScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const styles = useStyles();
  const colors = useColors();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>("inbox");
  const [inbox, setInbox] = useState<SharedEvent[]>([]);
  const [outbox, setOutbox] = useState<SharedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [inboxData, outboxData] = await Promise.all([
        getSharedInbox(),
        getSharedOutbox(),
      ]);
      setInbox(inboxData);
      setOutbox(outboxData);
    } catch (e: any) {
      if (!silent) showError("Không thể tải dữ liệu");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  // ── Inbox card ────────────────────────────────────────────────────────────────

  const InboxCard: React.FC<{ event: SharedEvent }> = ({ event }) => {
    const { sharer, eventSnapshot, createdAt } = event;
    const tags = eventSnapshot.tags || [];
    const firstTag = tags[0];
    const tagIcon = firstTag ? getTagIcon(firstTag) : "calendar-outline";

    return (
      <View style={styles.card}>
        {/* Sender */}
        <View style={styles.cardSender}>
          <View
            style={[
              styles.senderAvatar,
              { backgroundColor: getAvatarColor(sharer.id) },
            ]}
          >
            {sharer.photoUrl ? (
              <Image
                source={{ uri: sharer.photoUrl }}
                style={{ width: 32, height: 32, borderRadius: 16 }}
              />
            ) : (
              <Text style={styles.senderInitials}>
                {getInitials(sharer.displayName, sharer.email)}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.senderName} numberOfLines={1}>
              {sharer.displayName || sharer.email} đã thêm vào lịch bạn
            </Text>
            <Text style={styles.senderTime}>{getRelativeTime(createdAt)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: colors.success + "18" },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={13}
              color={colors.success}
            />
            <Text style={[styles.statusText, { color: colors.success }]}>
              Đã thêm
            </Text>
          </View>
        </View>

        {/* Event snapshot */}
        <View style={styles.eventPreview}>
          <Ionicons name={tagIcon as any} size={24} color={colors.primary} style={styles.eventEmoji} />
          <View style={styles.eventPreviewInfo}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {eventSnapshot.title}
            </Text>
            <Text style={styles.eventDate}>
              {formatDate(
                eventSnapshot.eventDate,
                eventSnapshot.isLunarCalendar,
              )}
              {eventSnapshot.isRecurring && " · Hàng năm"}
            </Text>
            {tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ── Outbox card ───────────────────────────────────────────────────────────────

  const OutboxCard: React.FC<{ event: SharedEvent }> = ({ event }) => {
    const { recipient, eventSnapshot, status, createdAt } = event;
    const statusCfg = getStatusConfig(status);
    const tags = eventSnapshot.tags || [];
    const firstTag = tags[0];
    const tagIcon = firstTag ? getTagIcon(firstTag) : "calendar-outline";

    return (
      <View style={styles.card}>
        <View style={styles.cardSender}>
          <View
            style={[
              styles.senderAvatar,
              { backgroundColor: getAvatarColor(recipient.id) },
            ]}
          >
            {recipient.photoUrl ? (
              <Image
                source={{ uri: recipient.photoUrl }}
                style={{ width: 32, height: 32, borderRadius: 16 }}
              />
            ) : (
              <Text style={styles.senderInitials}>
                {getInitials(recipient.displayName, recipient.email)}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.senderName} numberOfLines={1}>
              Gửi cho {recipient.displayName || recipient.email}
            </Text>
            <Text style={styles.senderTime}>{getRelativeTime(createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon} size={13} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        <View style={styles.eventPreview}>
          <Ionicons name={tagIcon as any} size={24} color={colors.primary} style={styles.eventEmoji} />
          <View style={styles.eventPreviewInfo}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {eventSnapshot.title}
            </Text>
            <Text style={styles.eventDate}>
              {formatDate(
                eventSnapshot.eventDate,
                eventSnapshot.isLunarCalendar,
              )}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const newCount = inbox.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sự kiện chia sẻ</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "inbox" && styles.tabActive]}
          onPress={() => setActiveTab("inbox")}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === "inbox" && styles.tabLabelActive,
            ]}
          >
            Nhận được
          </Text>
          {newCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{newCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "outbox" && styles.tabActive]}
          onPress={() => setActiveTab("outbox")}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === "outbox" && styles.tabLabelActive,
            ]}
          >
            Đã gửi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={colors.info}
        />
        <Text style={styles.infoBannerText}>
          {activeTab === "inbox"
            ? "Sự kiện được chia sẻ tự động thêm vào lịch — hoàn toàn độc lập, bạn có thể tuỳ chỉnh hoặc xoá bất cứ lúc nào"
            : "Lịch sử các sự kiện bạn đã chia sẻ với người thân"}
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {activeTab === "inbox" &&
            (inbox.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="mail-open-outline"
                  size={56}
                  color={colors.textLight}
                />
                <Text style={styles.emptyTitle}>Chưa có sự kiện</Text>
                <Text style={styles.emptySubtitle}>
                  Khi bạn bè chia sẻ ngày đặc biệt với bạn, chúng sẽ xuất hiện
                  tại đây
                </Text>
              </View>
            ) : (
              inbox.map((event) => <InboxCard key={event.id} event={event} />)
            ))}
          {activeTab === "outbox" &&
            (outbox.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="paper-plane-outline"
                  size={56}
                  color={colors.textLight}
                />
                <Text style={styles.emptyTitle}>Chưa chia sẻ gì</Text>
                <Text style={styles.emptySubtitle}>
                  Bạn có thể chia sẻ ngày kỷ niệm với người thân khi tạo sự kiện
                  mới
                </Text>
              </View>
            ) : (
              outbox.map((event) => <OutboxCard key={event.id} event={event} />)
            ))}
        </ScrollView>
      )}
    </View>
  );
};

export default SharedInboxScreen;

// ── Styles ────────────────────────────────────────────────────────────────────

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
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontFamily: 'Manrope_600SemiBold',
  },
  tabBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.info + "12",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  cardSender: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  senderInitials: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
  },
  senderName: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: colors.textPrimary,
  },
  senderTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
  },
  eventPreview: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  eventEmoji: {
    fontSize: 28,
    lineHeight: 36,
  },
  eventPreviewInfo: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    fontSize: 15,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  eventDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 2,
  },
  tagChip: {
    backgroundColor: colors.primary + "18",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagChipText: {
    fontSize: 11,
    color: colors.primary,
    fontFamily: 'Manrope_500Medium',
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 24,
    flex: 1,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    flex: 2,
  },
  acceptBtnText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
  },
  declineBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  declineBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
  },
}));
