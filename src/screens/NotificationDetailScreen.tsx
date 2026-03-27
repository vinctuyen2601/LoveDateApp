import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { AppNotification, markAsRead } from "../services/notificationInbox.service";
import { makeStyles } from "@utils/makeStyles";
import { useColors } from "@contexts/ThemeContext";

const NotificationDetailScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const notif: AppNotification = route.params?.notif;

  useEffect(() => {
    if (notif?.id) {
      markAsRead(notif.id);
    }
  }, [notif?.id]);

  if (!notif) return null;

  const handleNavigateToTarget = () => {
    const data = notif.data ?? {};
    const screen = data.screen as string | undefined;

    switch (screen) {
      case "EventDetail":
        if (data.eventId) {
          navigation.navigate("EventDetail", { eventId: data.eventId });
        }
        break;
      case "ArticleDetail":
        if (data.articleId) {
          navigation.navigate("ArticleDetail", { articleId: data.articleId });
        }
        break;
      case "Home":
        navigation.navigate("Main", { screen: "Home" });
        break;
      case "Connections":
        navigation.navigate("Main", { screen: "Connections" });
        break;
      default:
        // Backward compat: eventId without screen field
        if (data.eventId) {
          navigation.navigate("EventDetail", { eventId: data.eventId });
        }
        break;
    }
  };

  const hasTarget =
    notif.data &&
    (notif.data.eventId ||
      notif.data.articleId ||
      notif.data.screen === "Home" ||
      notif.data.screen === "Connections");

  const targetLabel = (() => {
    const screen = notif.data?.screen as string | undefined;
    if (screen === "ArticleDetail") return "Đọc bài viết";
    if (screen === "Home") return "Về trang chủ";
    if (screen === "Connections") return "Xem kết nối";
    if (notif.data?.eventId) return "Xem chi tiết sự kiện";
    return "Xem chi tiết";
  })();

  const targetIcon: keyof typeof Ionicons.glyphMap = (() => {
    const screen = notif.data?.screen as string | undefined;
    if (screen === "ArticleDetail") return "newspaper-outline";
    if (screen === "Home") return "home-outline";
    if (screen === "Connections") return "people-outline";
    return "calendar-outline";
  })();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết thông báo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="notifications" size={36} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{notif.title}</Text>

        {/* Time */}
        <Text style={styles.time}>
          {format(new Date(notif.createdAt), "HH:mm • EEEE, dd/MM/yyyy", { locale: vi })}
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Body */}
        <Text style={styles.bodyText}>{notif.body}</Text>

        {/* Extra data if any */}
        {notif.data && Object.keys(notif.data).length > 0 && (
          <View style={styles.metaCard}>
            {notif.data.eventTitle && (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.metaText}>{notif.data.eventTitle as string}</Text>
              </View>
            )}
            {notif.data.eventDate && (
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {format(new Date(notif.data.eventDate as string), "dd/MM/yyyy", { locale: vi })}
                </Text>
              </View>
            )}
            {typeof notif.data.daysBefore === "number" && (
              <View style={styles.metaRow}>
                <Ionicons name="alarm-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {notif.data.daysBefore === 0
                    ? "Nhắc nhở ngay hôm nay"
                    : `Nhắc trước ${notif.data.daysBefore} ngày`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* CTA */}
        {hasTarget && (
          <TouchableOpacity style={styles.ctaBtn} onPress={handleNavigateToTarget}>
            <Ionicons name={targetIcon} size={18} color={colors.white} />
            <Text style={styles.ctaBtnText}>{targetLabel}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  body: {
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  time: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Manrope_500Medium",
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: "100%",
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
    textAlign: "center",
    fontFamily: "Manrope_400Regular",
    marginBottom: 24,
  },
  metaCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: "Manrope_500Medium",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: "100%",
  },
  ctaBtnText: {
    fontSize: 16,
    fontFamily: "Manrope_600SemiBold",
    color: colors.white,
  },
}));

export default NotificationDetailScreen;
