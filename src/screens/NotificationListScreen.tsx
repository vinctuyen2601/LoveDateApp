import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AppNotification,
  getInbox,
  markAllAsRead,
  clearInbox,
} from "../services/notificationInbox.service";
import { makeStyles } from "@utils/makeStyles";
import { useColors } from "@contexts/ThemeContext";
import ConfirmDialog from "@components/organisms/ConfirmDialog";

function groupLabel(notif: AppNotification): string {
  const d = new Date(notif.createdAt);
  if (isToday(d)) return "Hôm nay";
  if (isYesterday(d)) return "Hôm qua";
  if (isThisWeek(d)) return "Tuần này";
  return "Cũ hơn";
}

const GROUP_ORDER = ["Hôm nay", "Hôm qua", "Tuần này", "Cũ hơn"];

type GroupedItem =
  | { type: "header"; label: string }
  | { type: "item"; notif: AppNotification };

function buildList(notifications: AppNotification[]): GroupedItem[] {
  const groups: Record<string, AppNotification[]> = {};
  for (const n of notifications) {
    const label = groupLabel(n);
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
  const result: GroupedItem[] = [];
  for (const label of GROUP_ORDER) {
    if (!groups[label]) continue;
    result.push({ type: "header", label });
    for (const notif of groups[label]) {
      result.push({ type: "item", notif });
    }
  }
  return result;
}

const NotificationListScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const load = useCallback(async () => {
    const items = await getInbox();
    setNotifications(items);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    await load();
  };

  const handleClearAll = async () => {
    await clearInbox();
    setShowClearConfirm(false);
    await load();
  };

  const handlePress = (notif: AppNotification) => {
    navigation.navigate("NotificationDetail", { notif });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const listData = buildList(notifications);

  const renderItem = ({ item }: { item: GroupedItem }) => {
    if (item.type === "header") {
      return <Text style={styles.groupLabel}>{item.label}</Text>;
    }
    const { notif } = item;
    return (
      <TouchableOpacity
        style={[styles.item, !notif.isRead && styles.itemUnread]}
        activeOpacity={0.75}
        onPress={() => handlePress(notif)}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: notif.isRead ? colors.border : colors.primary + "20" },
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={notif.isRead ? colors.textSecondary : colors.primary}
          />
        </View>
        <View style={styles.itemContent}>
          <Text
            style={[styles.itemTitle, !notif.isRead && styles.itemTitleUnread]}
            numberOfLines={1}
          >
            {notif.title}
          </Text>
          <Text style={styles.itemBody} numberOfLines={2}>
            {notif.body}
          </Text>
          <Text style={styles.itemTime}>
            {format(new Date(notif.createdAt), "HH:mm • dd/MM/yyyy", { locale: vi })}
          </Text>
        </View>
        {!notif.isRead && <View style={styles.unreadDot} />}
        <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.headerBtn} onPress={handleMarkAllRead}>
              <Ionicons name="checkmark-done-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setShowClearConfirm(true)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color={colors.textLight}
          />
          <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
          <Text style={styles.emptySubtitle}>
            Các thông báo sự kiện và nhắc nhở sẽ xuất hiện ở đây
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, index) =>
            item.type === "header" ? `h-${item.label}` : `n-${item.notif.id}-${index}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <ConfirmDialog
        visible={showClearConfirm}
        title="Xóa tất cả thông báo"
        message="Toàn bộ lịch sử thông báo sẽ bị xóa. Bạn có chắc không?"
        icon="trash-outline"
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 32,
  },
  groupLabel: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  itemUnread: {
    backgroundColor: colors.primary + "08",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    color: colors.textPrimary,
  },
  itemTitleUnread: {
    fontFamily: "Manrope_700Bold",
  },
  itemBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
}));

export default NotificationListScreen;
