import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import IconImage from "@components/atoms/IconImage";
import { getTagImage, getSpecialDateImage } from "@lib/iconImages";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEvents } from "@contexts/EventsContext";
import { getTagColor, getTagLabel } from "../../types";
import { ImageSourcePropType } from "react-native";
import {
  SPECIAL_DATES,
  resolveSpecialDateForYear,
  SpecialDate,
} from "../../constants/specialDates";
import { COLORS } from "@themes/colors";
import { DateUtils } from "@lib/date.utils";

const TODAY_POPUP_KEY = "@today_event_popup_date";

interface TodayItem {
  type: "event" | "special";
  tag?: string; // event tag value (birthday, memorial, etc.)
  image: ImageSourcePropType;
  title: string;
  subtitle?: string;
  color: string;
}

const TodayEventPopup: React.FC = () => {
  const { events } = useEvents();
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState<TodayItem[]>([]);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAndShow();
    }, 1500);
    return () => clearTimeout(timer);
  }, [events]);

  const checkAndShow = async () => {
    try {
      const todayStr = DateUtils.getTodayString();

      // Only show once per day
      const lastShown = await AsyncStorage.getItem(TODAY_POPUP_KEY);
      if (lastShown === todayStr) return;

      const todayItems = collectTodayItems();
      if (todayItems.length === 0) return;

      setItems(todayItems);
      setVisible(true);
      await AsyncStorage.setItem(TODAY_POPUP_KEY, todayStr);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error("TodayEventPopup error:", error);
    }
  };

  const collectTodayItems = (): TodayItem[] => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const result: TodayItem[] = [];

    // 1. System special dates
    for (const sd of SPECIAL_DATES) {
      const resolved = resolveSpecialDateForYear(sd, now.getFullYear());
      if (!resolved) continue;
      const resolvedDay = new Date(
        resolved.getFullYear(),
        resolved.getMonth(),
        resolved.getDate()
      );
      if (resolvedDay.getTime() === todayStart.getTime()) {
        result.push({
          type: "special",
          image: getSpecialDateImage(sd.id),
          title: sd.name,
          subtitle: sd.hint,
          color: sd.color,
        });
      }
    }

    // 2. User events (including recurring)
    for (const event of events) {
      if (!event.eventDate) continue;
      const eventDate = new Date(event.eventDate);
      if (isNaN(eventDate.getTime())) continue;

      let checkDate = eventDate;
      if (event.isRecurring) {
        checkDate = new Date(
          now.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate()
        );
      }
      const checkDay = new Date(
        checkDate.getFullYear(),
        checkDate.getMonth(),
        checkDate.getDate()
      );

      if (checkDay.getTime() === todayStart.getTime()) {
        const primaryTag = event.tags?.[0] || "other";
        result.push({
          type: "event",
          tag: primaryTag,
          image: getTagImage(primaryTag),
          title: event.title,
          subtitle: getTagLabel(primaryTag),
          color: getTagColor(primaryTag),
        });
      }
    }

    return result;
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  if (!visible || items.length === 0) return null;

  // ── 3 Themes: memorial (tím), birthday (hồng tươi), default (pháo hoa) ──
  const hasMemorial = items.some((i) => i.tag === "memorial");
  const allBirthday =
    !hasMemorial && items.every((i) => i.tag === "birthday");

  type PopupTheme = {
    emoji: string;
    title: string;
    headerBg: string;
    headerTitleColor: string;
    headerDateColor: string;
    buttonBg: string;
    buttonShadow: string;
  };

  const theme: PopupTheme = hasMemorial
    ? {
        emoji: "flame-outline",
        title: "Nhắc nhở hôm nay",
        headerBg: "#F3E8FF",
        headerTitleColor: "#6B21A8",
        headerDateColor: "#7C3AED",
        buttonBg: "#7C3AED",
        buttonShadow: "#7C3AED",
      }
    : allBirthday
    ? {
        emoji: "gift-outline",
        title: "Chúc mừng sinh nhật!",
        headerBg: "#FFF1F2",
        headerTitleColor: "#E11D48",
        headerDateColor: "#FB7185",
        buttonBg: "#E11D48",
        buttonShadow: "#E11D48",
      }
    : {
        emoji: "ribbon-outline",
        title: "Hôm nay có gì?",
        headerBg: "#FFF7ED",
        headerTitleColor: COLORS.textPrimary,
        headerDateColor: COLORS.textSecondary,
        buttonBg: COLORS.primary,
        buttonShadow: COLORS.primary,
      };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
            <Ionicons name={theme.emoji as any} size={36} color={theme.headerTitleColor} style={styles.headerEmoji} />
            <Text style={[styles.headerTitle, { color: theme.headerTitleColor }]}>
              {theme.title}
            </Text>
            <Text style={[styles.headerDate, { color: theme.headerDateColor }]}>
              {DateUtils.formatDate(new Date().toISOString())}
            </Text>
          </View>

          {/* Event list */}
          <ScrollView
            style={styles.listContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View
                  style={[
                    styles.itemIcon,
                    { backgroundColor: item.color + "15" },
                  ]}
                >
                  <IconImage source={item.image} size={24} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text style={styles.itemSubtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.itemBadge,
                    { backgroundColor: item.color + "15" },
                  ]}
                >
                  <Text style={[styles.itemBadgeText, { color: item.color }]}>
                    {item.type === "special"
                      ? "Ngày đặc biệt"
                      : item.tag
                      ? getTagLabel(item.tag)
                      : "Sự kiện"}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.buttonBg }]}
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "70%",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemEmoji: {
    fontSize: 22,
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  itemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  closeButton: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default TodayEventPopup;
