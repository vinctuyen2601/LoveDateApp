import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Modal,
  DeviceEventEmitter,
} from "react-native";
const SCREEN_WIDTH = Dimensions.get("window").width;
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import IconImage from "@components/atoms/IconImage";
import { getTagImage, getSpecialDateImage } from "@lib/iconImages";
import { Calendar, DateData } from "react-native-calendars";
import { useEvents } from "@contexts/EventsContext";
import { useSync } from "@contexts/SyncContext";
import { useNotification } from "@contexts/NotificationContext";
import { Event, getTagColor, getTagLabel } from "../types";
import { COLORS } from "@themes/colors";
import { getCalendarTheme } from "@themes/calendarTheme";
import { useNavigation } from "@react-navigation/native";
import { getFeaturedArticles } from "../data/articles";
import { getArticles } from "../services/articleService";
import { databaseService } from "../services/database.service";
import { getTrendingProducts } from "../services/affiliateProductService";
import {
  getSpecialDatesForMonth,
  SPECIAL_DATES,
  resolveSpecialDateForYear,
  SpecialDate,
} from "../constants/specialDates";
import { checkOnboardingComplete } from "../components/organisms/OnboardingOverlay";
import { AffiliateProduct } from "../types";
import ProductCard from "../components/suggestions/ProductCard";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { vi } from "date-fns/locale";
import { DateUtils } from "@lib/date.utils";
import NotificationBanner from "@components/molecules/NotificationBanner";
import PressableCard from "@components/atoms/PressableCard";
import HolidaySuggestionOverlay from "@components/organisms/HolidaySuggestionOverlay";
import {
  getActiveSuggestion,
  markSuggestionDone,
  snoozeSuggestion,
} from "@lib/holidaySuggestionHelper";
import { HolidaySuggestion } from "@constants/holidaySuggestions";
import { makeStyles } from "@utils/makeStyles";
import { useColors, useTheme } from "@contexts/ThemeContext";

const TAB_BAR_HEIGHT = 60;

const CATEGORY_NAMES: Record<string, string> = {
  gifts: "Quà tặng",
  dates: "Hẹn hò",
  communication: "Giao tiếp",
  zodiac: "Cung hoàng đạo",
  personality: "Tính cách",
};

// Tạo ngoài HomeScreen để tránh re-create mỗi render
const CalendarDay = React.memo(
  ({ date, state, marking, onPress, styles, colors }: any) => {
    const isSelected = !!marking?.selected;
    const isToday = state === "today";
    const isDisabled = state === "disabled";
    const dots: { color: string; image: any }[] = marking?.dots ?? [];

    return (
      <TouchableOpacity
        onPress={() => date && onPress(date)}
        activeOpacity={0.7}
        style={styles.dayCell}
      >
        <View
          style={[
            styles.dayNumberWrap,
            isSelected && styles.dayNumberSelected,
            isToday && !isSelected && styles.dayNumberToday,
          ]}
        >
          <Text
            style={[
              styles.dayNumberText,
              isToday && !isSelected && styles.dayTextToday,
              isSelected && styles.dayTextSelected,
              isDisabled && styles.dayTextDisabled,
            ]}
          >
            {date?.day}
          </Text>
        </View>
        {dots.length > 0 ? (
          <View style={styles.dayDotsRow}>
            {dots.slice(0, 2).map((dot: any, i: number) => (
              <IconImage key={i} source={dot.image} size={12} />
            ))}
          </View>
        ) : (
          <View style={styles.dayPlaceholder} />
        )}
      </TouchableOpacity>
    );
  }
);

const HomeScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();
  const { themeName } = useTheme();
  const calendarTheme = useMemo(() => getCalendarTheme(colors), [colors]);

  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { events, isLoading, refreshEvents, addEvent } = useEvents();
  const { sync } = useSync();
  const { message, image } = useNotification();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(DateUtils.getTodayString());
  const [currentMonth, setCurrentMonth] = useState(DateUtils.getTodayString());
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(true);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshEvents(), sync()]);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const sevenDaysLater = addDays(todayStart, 7);
    return events
      .filter((event) => {
        if (!event.eventDate) return false;
        const eventDate = new Date(event.eventDate);
        const eventDateDay = new Date(eventDate);
        eventDateDay.setHours(0, 0, 0, 0);

        if (eventDateDay > todayStart) {
          // Ngày tương lai: luôn hiển thị trong cửa sổ 7 ngày
          return eventDateDay <= sevenDaysLater;
        }
        if (eventDateDay.getTime() === todayStart.getTime()) {
          // Sự kiện hôm nay:
          // - Lặp lại: luôn hiển thị (vẫn còn ý nghĩa trong ngày)
          // - Một lần: chỉ hiển thị nếu chưa qua thời điểm nhắc nhở
          if (event.isRecurring) return true;
          const reminderTime = event.reminderSettings?.reminderTime;
          if (!reminderTime) return eventDate >= now;
          const reminderDate = new Date(eventDate);
          reminderDate.setHours(reminderTime.hour, reminderTime.minute, 0, 0);
          return reminderDate > now;
        }
        return false; // Ngày đã qua
      })
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      )
      .slice(0, 3);
  }, [events]);

  // Sự kiện gần nhất trong 30 ngày tới CHƯA được chuẩn bị (chưa có gift hoặc activity note)
  const nearestUnpreparedEvent = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const thirtyDaysLater = addDays(todayStart, 30);
    const eligibleTags = ["birthday", "anniversary", "holiday"];
    const currentYear = todayStart.getFullYear();
    return (
      events
        .filter((event) => {
          if (!event.eventDate) return false;
          if (event.sourceSharedEventId) return false; // Sự kiện từ kết nối không chuẩn bị quà
          const primaryTag = event.tags?.[0];
          if (!eligibleTags.includes(primaryTag)) return false;
          const eventDay = new Date(event.eventDate);
          eventDay.setHours(0, 0, 0, 0);
          if (eventDay < todayStart || eventDay > thirtyDaysLater) return false;
          // Loại bỏ event đã có note gift hoặc activity
          const note = event.notes?.find((n) => n.year === currentYear);
          return !(note?.gift || note?.activity);
        })
        .sort(
          (a, b) =>
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        )[0] ?? null
    );
  }, [events]);

  // Các ngày lễ đặc biệt cần flow chuẩn bị (Valentine, 8/3, 20/10, Giáng Sinh)
  const PREP_SPECIAL_IDS = [
    "sys_valentine",
    "sys_quocte_phunu",
    "sys_phunu_vn",
    "sys_giang_sinh",
  ];

  const nearestSpecialOccasion = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysLater = addDays(today, 30);
    const currentYear = today.getFullYear();
    let nearest: { sd: SpecialDate; date: Date; daysLeft: number } | null =
      null;

    for (const sd of SPECIAL_DATES.filter((s) =>
      PREP_SPECIAL_IDS.includes(s.id)
    )) {
      let date = resolveSpecialDateForYear(sd, currentYear);
      if (!date) continue;
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const resolved =
        d < today ? resolveSpecialDateForYear(sd, currentYear + 1) : d;
      if (!resolved) continue;
      const finalDate = new Date(resolved);
      finalDate.setHours(0, 0, 0, 0);
      if (finalDate >= today && finalDate <= thirtyDaysLater) {
        const daysLeft = differenceInCalendarDays(finalDate, today);
        if (!nearest || daysLeft < nearest.daysLeft) {
          nearest = { sd, date: finalDate, daysLeft };
        }
      }
    }
    return nearest;
  }, []);

  // const markedDates = useMemo(() => {
  //   const marked: any = {};
  //   // Lấy năm hiện tại trên calendar để hiển thị recurring events đúng năm
  //   const calYear = parseInt(currentMonth.slice(0, 4), 10);

  //   events.forEach((event) => {
  //     if (!event.eventDate) return;
  //     const date = new Date(event.eventDate);
  //     if (isNaN(date.getTime())) return;

  //     let markDate: string;
  //     if (event.isRecurring) {
  //       // Recurring (sinh nhật, kỷ niệm...): đánh dấu đúng ngày MM-DD
  //       // nhưng theo năm đang hiển thị trên calendar
  //       const mm = String(date.getMonth() + 1).padStart(2, "0");
  //       const dd = String(date.getDate()).padStart(2, "0");
  //       markDate = `${calYear}-${mm}-${dd}`;
  //     } else {
  //       markDate = DateUtils.toLocalDateString(date);
  //     }

  //     if (!marked[markDate]) {
  //       marked[markDate] = { marked: true, dots: [] };
  //     }
  //     const primaryTag = event.tags[0] || "other";
  //     marked[markDate].dots.push({
  //       color: getTagColor(primaryTag),
  //       image: getTagImage(primaryTag),
  //     });
  //   });

  //   // Merge ngày đặc biệt (bao gồm âm lịch, nth-weekday) — dùng emoji
  //   const calMonth = parseInt(currentMonth.slice(5, 7), 10);
  //   const resolvedSpecials = getSpecialDatesForMonth(calYear, calMonth);
  //   resolvedSpecials.forEach((sd) => {
  //     const mm = String(sd.solarMonth).padStart(2, "0");
  //     const dd = String(sd.solarDay).padStart(2, "0");
  //     const dateKey = `${calYear}-${mm}-${dd}`;
  //     if (!marked[dateKey]) {
  //       marked[dateKey] = { dots: [] };
  //     }
  //     if (!marked[dateKey].dots) {
  //       marked[dateKey].dots = [];
  //     }
  //     marked[dateKey].dots.unshift({
  //       color: sd.color,
  //       image: getSpecialDateImage(sd.id),
  //     });
  //   });

  //   if (marked[selectedDate]) {
  //     marked[selectedDate].selected = true;
  //     marked[selectedDate].selectedColor = colors.primary;
  //   } else {
  //     marked[selectedDate] = {
  //       selected: true,
  //       selectedColor: colors.primary,
  //     };
  //   }
  //   return marked;
  // }, [events, selectedDate, currentMonth]);

  // Chỉ tính dots từ events + specials — KHÔNG phụ thuộc selectedDate
  const baseMarkedDates = useMemo(() => {
    const marked: any = {};
    const calYear = parseInt(currentMonth.slice(0, 4), 10);

    events.forEach((event) => {
      if (!event.eventDate) return;
      const date = new Date(event.eventDate);
      if (isNaN(date.getTime())) return;

      let markDate: string;
      if (event.isRecurring) {
        // Recurring (sinh nhật, kỷ niệm...): đánh dấu đúng ngày MM-DD
        // nhưng theo năm đang hiển thị trên calendar
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        markDate = `${calYear}-${mm}-${dd}`;
      } else {
        markDate = DateUtils.toLocalDateString(date);
      }

      if (!marked[markDate]) {
        marked[markDate] = { marked: true, dots: [] };
      }
      const primaryTag = event.tags[0] || "other";
      marked[markDate].dots.push({
        color: getTagColor(primaryTag),
        image: getTagImage(primaryTag),
      });
    });

    const calMonth = parseInt(currentMonth.slice(5, 7), 10);
    const resolvedSpecials = getSpecialDatesForMonth(calYear, calMonth);
    resolvedSpecials.forEach((sd) => {
      const mm = String(sd.solarMonth).padStart(2, "0");
      const dd = String(sd.solarDay).padStart(2, "0");
      const dateKey = `${calYear}-${mm}-${dd}`;
      if (!marked[dateKey]) {
        marked[dateKey] = { dots: [] };
      }
      if (!marked[dateKey].dots) {
        marked[dateKey].dots = [];
      }
      marked[dateKey].dots.unshift({
        color: sd.color,
        image: getSpecialDateImage(sd.id),
      });
    });

    return marked;
  }, [events, currentMonth]); // ← bỏ selectedDate khỏi deps

  // Chỉ merge selectedDate highlight — O(1), không duyệt events
  const markedDates = useMemo(() => {
    const marked = { ...baseMarkedDates };
    if (marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: colors.primary,
      };
    } else {
      marked[selectedDate] = { selected: true, selectedColor: colors.primary };
    }
    return marked;
  }, [baseMarkedDates, selectedDate, colors.primary]);

  // Ngày đặc biệt trùng với ngày đang chọn
  const selectedDateSpecials = useMemo(() => {
    const [yearStr, monthStr, dayStr] = selectedDate.split("-");
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const d = parseInt(dayStr, 10);
    return getSpecialDatesForMonth(y, m).filter((sd) => sd.solarDay === d);
  }, [selectedDate]);

  const selectedDateEvents = useMemo(() => {
    return events.filter((event) => {
      if (!event.eventDate) return false;
      const date = new Date(event.eventDate);
      if (isNaN(date.getTime())) return false;

      if (event.isRecurring) {
        // Recurring: so khớp MM-DD, bỏ qua năm
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return selectedDate.slice(5) === `${mm}-${dd}`;
      }
      return DateUtils.toLocalDateString(date) === selectedDate;
    });
  }, [events, selectedDate]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const handleMonthChange = useCallback((month: DateData) => {
    setCurrentMonth(month.dateString);
  }, []);
  const [articles, setArticles] = useState<
    ReturnType<typeof getFeaturedArticles>
  >([]);

  React.useEffect(() => {
    Promise.all([getArticles(), databaseService.getReadArticleIds()])
      .then(([all, readIds]) => {
        const readSet = new Set(readIds);
        setArticles(getFeaturedArticles(all).filter((a) => !readSet.has(a.id)));
      })
      .catch(() => {});
  }, []);

  const [trendingProducts, setTrendingProducts] = useState<AffiliateProduct[]>(
    []
  );

  React.useEffect(() => {
    getTrendingProducts()
      .then(setTrendingProducts)
      .catch(() => {});
  }, []);

  // Holiday suggestion overlay
  const [activeSuggestion, setActiveSuggestion] =
    useState<HolidaySuggestion | null>(null);
  useEffect(() => {
    getActiveSuggestion()
      .then(setActiveSuggestion)
      .catch(() => {});
  }, []);

  // Occasion prep popup — show once per session
  type PrepTarget =
    | { type: "event"; daysLeft: number; tagColor: string; event: Event }
    | { type: "special"; sd: SpecialDate; date: Date; daysLeft: number };
  const [prepTarget, setPrepTarget] = useState<PrepTarget | null>(null);
  const [isOnboardingDone, setIsOnboardingDone] = useState<boolean | null>(
    null
  );
  const prepModalShown = useRef(false);

  useEffect(() => {
    checkOnboardingComplete()
      .then(setIsOnboardingDone)
      .catch(() => setIsOnboardingDone(false));

    const sub = DeviceEventEmitter.addListener("onboardingComplete", () => {
      setIsOnboardingDone(true);
    });
    return () => sub.remove();
  }, []);

  const canShowPrepModal = isOnboardingDone === true;

  useEffect(() => {
    if (isOnboardingDone === null) return; // đang load AsyncStorage, chờ
    if (!canShowPrepModal) return; // đang onboarding thật sự
    if (prepModalShown.current) return;
    if (nearestUnpreparedEvent) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysLeft = differenceInCalendarDays(
        new Date(nearestUnpreparedEvent.eventDate),
        today
      );
      const timer = setTimeout(() => {
        setPrepTarget({
          type: "event",
          daysLeft,
          tagColor: getTagColor(nearestUnpreparedEvent.tags?.[0] || "other"),
          event: nearestUnpreparedEvent,
        });
        prepModalShown.current = true;
      }, 900);
      return () => clearTimeout(timer);
    }
    if (nearestSpecialOccasion) {
      const timer = setTimeout(() => {
        setPrepTarget({ type: "special", ...nearestSpecialOccasion });
        prepModalShown.current = true;
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isOnboardingDone, nearestUnpreparedEvent, nearestSpecialOccasion]);

  const handlePrepSpecialDate = async (sd: SpecialDate, date: Date) => {
    setPrepTarget(null);
    // Tìm event holiday đã tồn tại cho ngày này
    const existing = events.find((e) => {
      const eDate = new Date(e.eventDate);
      return (
        eDate.getMonth() === date.getMonth() &&
        eDate.getDate() === date.getDate() &&
        e.tags.includes("holiday")
      );
    });
    if (existing) {
      navigation.navigate("OccasionPrep", {
        eventId: existing.id,
        event: existing,
      });
      return;
    }
    try {
      const newEvent = await addEvent({
        title: sd.name,
        eventDate: date,
        isLunarCalendar: false,
        tags: ["holiday"],
        remindDaysBefore: [7, 1],
        reminderTime: { hour: 9, minute: 0 },
        isRecurring: true,
      });
      navigation.navigate("OccasionPrep", {
        eventId: newEvent.id,
        event: newEvent,
      });
    } catch {
      // fail silently
    }
  };

  const handleSuggestionComplete = async () => {
    if (!activeSuggestion) return;
    await markSuggestionDone(activeSuggestion.id);
    setActiveSuggestion(null);
  };

  const handleSuggestionSkip = async () => {
    if (!activeSuggestion) return;
    await snoozeSuggestion(activeSuggestion.id);
    setActiveSuggestion(null);
  };

  const handleSurveyPress = () =>
    navigation.navigate("Suggestions", { openSurvey: true });
  const handleEventPress = (event: Event) =>
    navigation.navigate("EventDetail", { eventId: event.id });
  const handleAddEvent = () => navigation.navigate("AddEvent");

  // FAB pulse animation
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    const a1 = createPulse(pulse1, 0);
    const a2 = createPulse(pulse2, 700);
    a1.start();
    a2.start();
    return () => {
      a1.stop();
      a2.stop();
    };
  }, []);
  const handleViewCalendar = () => navigation.navigate("Calendar");

  // ===== SHARED EVENT CARD =====
  const isToday = (dateStr: string) => dateStr === DateUtils.getTodayString();

  const formatSelectedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const dayOfWeek = [
        "Chủ nhật",
        "Thứ 2",
        "Thứ 3",
        "Thứ 4",
        "Thứ 5",
        "Thứ 6",
        "Thứ 7",
      ];
      return `${dayOfWeek[date.getDay()]}, ${date.getDate()} tháng ${
        date.getMonth() + 1
      }, ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const renderEventCard = (
    event: Event,
    iconSource?: ReturnType<typeof getSpecialDateImage>
  ) => {
    const primaryTag = event.tags?.[0] || "other";
    const tagColor = getTagColor(primaryTag);
    const tagLabel = getTagLabel(primaryTag);
    const icon = iconSource ?? getTagImage(primaryTag);

    return (
      <TouchableOpacity
        key={event.id}
        style={styles.calEventCard}
        activeOpacity={0.7}
        onPress={() => handleEventPress(event)}
      >
        <View style={[styles.calEventAccent, { backgroundColor: tagColor }]} />
        <View style={styles.calEventBody}>
          <View style={styles.calEventRow}>
            <View
              style={[
                styles.calEventIcon,
                { backgroundColor: tagColor + "15" },
              ]}
            >
              <IconImage source={icon} size={22} />
            </View>
            <View style={styles.calEventContent}>
              <Text style={styles.calEventTitle} numberOfLines={1}>
                {event.title}
              </Text>
              <View style={styles.calEventMeta}>
                <Text style={styles.calEventDate}>
                  {DateUtils.getEventDateDisplay(event.eventDate)}
                  {event.isLunarCalendar ? " (ÂL)" : ""}
                </Text>
                <View style={styles.calEventDot} />
                <View
                  style={[
                    styles.calEventTag,
                    { backgroundColor: tagColor + "15" },
                  ]}
                >
                  <Text style={[styles.calEventTagText, { color: tagColor }]}>
                    {tagLabel}
                  </Text>
                </View>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textLight}
            />
          </View>
          {(event.isRecurring || event.isNotificationEnabled === false) && (
            <View style={styles.calEventBadges}>
              {event.isRecurring && (
                <View style={styles.calEventBadge}>
                  <Ionicons
                    name="repeat"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.calEventBadgeText}>Hàng năm</Text>
                </View>
              )}
              {event.isNotificationEnabled === false && (
                <View style={styles.calEventBadge}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={12}
                    color={colors.textLight}
                  />
                  <Text
                    style={[
                      styles.calEventBadgeText,
                      { color: colors.textLight },
                    ]}
                  >
                    Tắt TB
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ===== QUICK ACTIONS =====
  const quickActions = useMemo(
    () => [
      {
        id: "survey",
        icon: "heart-circle" as const,
        title: "Khảo sát\ntính cách",
        subtitle: "Gợi ý quà phù hợp với nửa kia",
        color: colors.primary,
        onPress: handleSurveyPress,
      },
      {
        id: "mbti",
        icon: "people" as const,
        title: "Trắc nghiệm\nMBTI",
        subtitle: "Khám phá 16 loại tính cách",
        color: "#1A9E6E",
        onPress: () => navigation.navigate("MBTISurvey"),
      },
      {
        id: "activities",
        icon: "map-outline" as const,
        title: "Gợi ý\nhoạt động",
        subtitle: "Ý tưởng hẹn hò, nhà hàng, spa...",
        color: colors.secondary,
        onPress: () =>
          navigation.navigate("ActivitySuggestions", {
            event: upcomingEvents[0] ?? events[0] ?? undefined,
          }),
      },
    ],
    [colors.primary, handleSurveyPress, navigation]
  );

  const renderDay = useCallback(
    ({ date, state, marking }: any) => (
      <CalendarDay
        date={date}
        state={state}
        marking={marking}
        onPress={handleDayPress}
        styles={styles}
        colors={colors}
      />
    ),
    [handleDayPress, styles, colors]
  );

  return (
    <View style={styles.container}>
      <NotificationBanner message={message} image={image} />

      {activeSuggestion && (
        <HolidaySuggestionOverlay
          suggestion={activeSuggestion}
          onComplete={handleSuggestionComplete}
          onSkip={handleSuggestionSkip}
          addEvent={addEvent}
        />
      )}

      {/* Occasion Prep Popup — hiển thị 1 lần khi mở app */}
      <Modal
        visible={!!prepTarget}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPrepTarget(null)}
      >
        <TouchableOpacity
          style={styles.prepModalBackdrop}
          activeOpacity={1}
          onPress={() => setPrepTarget(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.prepModalCard}>
            {prepTarget &&
              (() => {
                const isEvent = prepTarget.type === "event";
                const eventObj = isEvent ? prepTarget.event : null;
                const tagColor = isEvent
                  ? prepTarget.tagColor
                  : prepTarget.sd.color;
                const title = isEvent
                  ? eventObj?.title ?? ""
                  : prepTarget.sd.name;
                const sdIcon = isEvent ? null : prepTarget.sd.icon;
                const daysLeft = prepTarget.daysLeft;

                return (
                  <>
                    <View style={styles.prepModalHandle} />
                    <View style={styles.prepModalTopRow}>
                      <View
                        style={[
                          styles.prepModalIconWrap,
                          { backgroundColor: tagColor + "20" },
                        ]}
                      >
                        {isEvent && eventObj ? (
                          <IconImage
                            source={getTagImage(eventObj.tags?.[0] || "other")}
                            size={36}
                          />
                        ) : (
                          <Ionicons
                            name={sdIcon as any}
                            size={36}
                            color={tagColor}
                          />
                        )}
                      </View>
                      <View
                        style={[
                          styles.prepModalDaysBadge,
                          { backgroundColor: tagColor },
                        ]}
                      >
                        <Text style={styles.prepModalDaysText}>
                          {daysLeft === 0 ? "Hôm nay!" : `Còn ${daysLeft} ngày`}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.prepModalTitle}>{title}</Text>
                    <Text style={styles.prepModalSub}>
                      {isEvent
                        ? "Bạn chưa chuẩn bị gì cho dịp này. Để AI gợi ý quà và lịch trình nhé!"
                        : `${prepTarget.sd.hint}`}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        if (isEvent && eventObj) {
                          setPrepTarget(null);
                          navigation.navigate("OccasionPrep", {
                            eventId: eventObj.id,
                            event: eventObj,
                          });
                        } else if (!isEvent) {
                          handlePrepSpecialDate(prepTarget.sd, prepTarget.date);
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={[tagColor, tagColor + "CC"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.prepModalBtn}
                      >
                        <Ionicons
                          name="sparkles"
                          size={18}
                          color={colors.white}
                        />
                        <Text style={styles.prepModalBtnText}>
                          Chuẩn bị ngay
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.prepModalSkip}
                      onPress={() => setPrepTarget(null)}
                    >
                      <Text style={styles.prepModalSkipText}>Để sau</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Greeting header */}
        <View style={[styles.greeting, { paddingTop: insets.top + 16 }]}>
          {(() => {
            const h = new Date().getHours();
            let label: string;
            let iconName: keyof typeof Ionicons.glyphMap;
            if (h < 12) {
              label = "Buổi sáng tốt lành";
              iconName = "sunny-outline";
            } else if (h < 18) {
              label = "Buổi chiều vui vẻ";
              iconName = "partly-sunny-outline";
            } else {
              label = "Buổi tối bình an";
              iconName = "moon-outline";
            }
            return (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons name={iconName} size={20} color={colors.primary} />
                <Text style={styles.greetingText}>{label}</Text>
              </View>
            );
          })()}
        </View>

        {/* Hero empty state — chỉ hiện khi chưa có sự kiện nào */}
        {!isLoading && events.length === 0 && (
          <View style={styles.heroEmpty}>
            <Image
              source={require("../../assets/icons/tags/hearts.png")}
              style={styles.heroEmptyIcon}
              resizeMode="contain"
            />
            <Text style={styles.heroEmptyTitle}>Bắt đầu nào!</Text>
            <Text style={styles.heroEmptySub}>
              Thêm sự kiện đầu tiên — app sẽ tự tạo checklist chuẩn bị và nhắc
              bạn đúng lúc
            </Text>
            <TouchableOpacity
              style={styles.heroEmptyBtn}
              onPress={handleAddEvent}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={20} color={colors.white} />
              <Text style={styles.heroEmptyBtnText}>Thêm sự kiện đặc biệt</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons
                  name="alarm-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.sectionTitle}>Sự kiện sắp tới</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{upcomingEvents.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate("EventsList")}
              >
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {upcomingEvents.map((event) => {
              const primaryTag = event.tags?.[0] || "other";
              const categoryColor = getTagColor(primaryTag);
              const eventDate = new Date(event.eventDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const daysLeft = differenceInCalendarDays(eventDate, today);
              const isOccasion = [
                "birthday",
                "anniversary",
                "holiday",
              ].includes(primaryTag);

              // Trạng thái chuẩn bị từ EventNote năm nay
              const currentYear = new Date().getFullYear();
              const note = event.notes?.find((n) => n.year === currentYear);
              const hasGift = !!note?.gift;
              const hasActivity = !!note?.activity;
              const prepState =
                hasGift && hasActivity
                  ? "done"
                  : hasGift || hasActivity
                  ? "partial"
                  : "none";

              const prepBadgeConfig = {
                none: {
                  icon: "sparkles" as const,
                  color: categoryColor,
                  text: "Bắt đầu chuẩn bị",
                },
                partial: {
                  icon: "refresh-circle-outline" as const,
                  color: "#F59E0B",
                  text: "Tiếp tục chuẩn bị",
                },
                done: {
                  icon: "checkmark-circle" as const,
                  color: colors.success,
                  text: "Đã được chuẩn bị",
                },
              }[prepState];

              return (
                <PressableCard
                  key={event.id}
                  style={styles.upcomingCard}
                  onPress={() => handleEventPress(event)}
                >
                  <View
                    style={[
                      styles.upcomingIconWrap,
                      { backgroundColor: categoryColor + "18" },
                    ]}
                  >
                    <IconImage source={getTagImage(primaryTag)} size={26} />
                  </View>
                  <View style={styles.upcomingInfo}>
                    <Text style={styles.upcomingTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <View style={styles.upcomingDateRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.upcomingDateText}>
                        {format(eventDate, "EEEE, d/MM", { locale: vi })}
                      </Text>
                    </View>
                    {isOccasion && (
                      <View
                        style={[
                          styles.prepBadge,
                          { backgroundColor: prepBadgeConfig.color + "15" },
                        ]}
                      >
                        <Ionicons
                          name={prepBadgeConfig.icon}
                          size={11}
                          color={prepBadgeConfig.color}
                        />
                        <Text
                          style={[
                            styles.prepBadgeText,
                            { color: prepBadgeConfig.color },
                          ]}
                        >
                          {prepBadgeConfig.text}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View
                    style={[
                      styles.countdownCircle,
                      {
                        backgroundColor:
                          daysLeft === 0 ? categoryColor : categoryColor + "15",
                      },
                    ]}
                  >
                    {daysLeft === 0 ? (
                      <Image
                        source={require("../../assets/icons/tags/confetti.png")}
                        style={styles.countdownToday}
                      />
                    ) : (
                      <>
                        <Text
                          style={[
                            styles.countdownNum,
                            { color: categoryColor },
                          ]}
                        >
                          {daysLeft}
                        </Text>
                        <Text
                          style={[
                            styles.countdownLabel,
                            { color: categoryColor + "CC" },
                          ]}
                        >
                          ngày
                        </Text>
                      </>
                    )}
                  </View>
                </PressableCard>
              );
            })}
          </View>
        )}

        {/* Local Shop Banner — hiện khi có sự kiện sắp tới */}
        {upcomingEvents.length > 0 && (
          <TouchableOpacity
            style={styles.shopBanner}
            onPress={() => navigation.navigate("LocalShop")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary + "18", "#C850C015"]}
              style={styles.shopBannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons
                name="flower-outline"
                size={32}
                color={colors.primary}
              />
              <View style={styles.shopBannerText}>
                <Text style={styles.shopBannerTitle}>
                  Đặt hoa, bánh và quà giao tận nơi
                </Text>
                <Text style={styles.shopBannerSub}>
                  Gợi ý hoàn hảo cho ngày đặc biệt sắp tới
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
              />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Calendar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>Lịch sự kiện</Text>
            </View>
            <TouchableOpacity onPress={handleViewCalendar}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            <Calendar
              key={themeName}
              current={currentMonth}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
              markedDates={markedDates}
              theme={calendarTheme}
              enableSwipeMonths={true}
              hideExtraDays={false}
              firstDay={1}
              renderArrow={(direction: string) => (
                <Ionicons
                  name={
                    direction === "left" ? "chevron-back" : "chevron-forward"
                  }
                  size={20}
                  color={colors.primary}
                />
              )}
              dayComponent={renderDay}
            />
          </View>

          {/* Selected date panel — hiện khi có sự kiện hoặc ngày lễ */}
          {(selectedDateEvents.length > 0 ||
            selectedDateSpecials.length > 0) && (
            <View style={styles.selectedDateContainer}>
              <View style={styles.selectedDateHeader}>
                <View style={styles.selectedDateLeft}>
                  {isToday(selectedDate) && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>Hôm nay</Text>
                    </View>
                  )}
                  <Text style={styles.selectedDateText}>
                    {formatSelectedDate(selectedDate)}
                  </Text>
                </View>
                <View style={styles.eventCountBadge}>
                  <Text style={styles.eventCountBadgeText}>
                    {selectedDateEvents.length +
                      selectedDateSpecials.filter(
                        (sd) =>
                          !PREP_SPECIAL_IDS.includes(sd.id) ||
                          !selectedDateEvents.some((e) =>
                            e.tags.includes("holiday")
                          )
                      ).length}{" "}
                    sự kiện
                  </Text>
                </View>
              </View>
              <View style={styles.eventsList}>
                {selectedDateSpecials
                  .filter((sd) => {
                    // Ẩn special date nếu đã có holiday event trùng ngày (tránh duplicate)
                    if (!PREP_SPECIAL_IDS.includes(sd.id)) return true;
                    return !selectedDateEvents.some((e) =>
                      e.tags.includes("holiday")
                    );
                  })
                  .map((sd) => {
                    const isPrep = PREP_SPECIAL_IDS.includes(sd.id);
                    const Wrapper = isPrep ? TouchableOpacity : View;
                    const wrapperProps = isPrep
                      ? {
                          activeOpacity: 0.7,
                          onPress: () =>
                            handlePrepSpecialDate(sd, new Date(selectedDate)),
                        }
                      : {};
                    return (
                      <Wrapper
                        key={sd.id}
                        style={styles.calEventCard}
                        {...wrapperProps}
                      >
                        <View
                          style={[
                            styles.calEventAccent,
                            { backgroundColor: sd.color },
                          ]}
                        />
                        <View style={styles.calEventBody}>
                          <View style={styles.calEventRow}>
                            <View
                              style={[
                                styles.calEventIcon,
                                { backgroundColor: sd.color + "15" },
                              ]}
                            >
                              <IconImage
                                source={getSpecialDateImage(sd.id)}
                                size={24}
                              />
                            </View>
                            <View style={styles.calEventContent}>
                              <Text
                                style={styles.calEventTitle}
                                numberOfLines={1}
                              >
                                {sd.name}
                              </Text>
                              <View style={styles.calEventMeta}>
                                <View
                                  style={[
                                    styles.calEventTag,
                                    { backgroundColor: sd.color + "15" },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.calEventTagText,
                                      { color: sd.color },
                                    ]}
                                  >
                                    {isPrep
                                      ? "Chuẩn bị dịp này"
                                      : "Ngày đặc biệt"}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            {isPrep && (
                              <Ionicons
                                name="chevron-forward"
                                size={18}
                                color={colors.textLight}
                              />
                            )}
                          </View>
                        </View>
                      </Wrapper>
                    );
                  })}
                {selectedDateEvents.map((event) => {
                  // Holiday event → dùng icon của special date tương ứng nếu có
                  const matchingSpecial = event.tags.includes("holiday")
                    ? selectedDateSpecials.find((sd) =>
                        PREP_SPECIAL_IDS.includes(sd.id)
                      )
                    : undefined;
                  return renderEventCard(
                    event,
                    matchingSpecial
                      ? getSpecialDateImage(matchingSpecial.id)
                      : undefined
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Khám phá — sau Calendar */}
        {events.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons
                  name="flash-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.sectionTitle}>Khám phá</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsScroll}
            >
              {quickActions.map((action) => {
                const cardContent = (
                  <>
                    <View style={styles.qaDecorCircle} />
                    <View style={styles.qaIconBg}>
                      <Ionicons
                        name={action.icon}
                        size={26}
                        color="rgba(255,255,255,0.95)"
                      />
                    </View>
                    <Text style={styles.qaTitle}>{action.title}</Text>
                    <Text style={styles.qaSub} numberOfLines={2}>
                      {action.subtitle}
                    </Text>
                    <Ionicons
                      name="arrow-forward-circle"
                      size={20}
                      color="rgba(255,255,255,0.5)"
                      style={styles.qaArrow}
                    />
                  </>
                );
                return (action as any).gradient ? (
                  <PressableCard
                    key={action.id}
                    style={styles.quickActionCard}
                    onPress={action.onPress}
                  >
                    <LinearGradient
                      colors={(action as any).gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    {cardContent}
                  </PressableCard>
                ) : (
                  <PressableCard
                    key={action.id}
                    style={[
                      styles.quickActionCard,
                      { backgroundColor: action.color },
                    ]}
                    onPress={action.onPress}
                  >
                    {cardContent}
                  </PressableCard>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Articles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="book-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Bài viết nổi bật</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("AllArticles")}
            >
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {/* Featured hero card — first article */}
          {articles.length > 0 && (
            <PressableCard
              style={[
                styles.featuredArticle,
                { backgroundColor: articles[0].color },
              ]}
              onPress={() => {
                databaseService
                  .markArticleRead(articles[0].id)
                  .catch(console.error);
                navigation.navigate("ArticleDetail", { article: articles[0] });
              }}
            >
              {/* Background image */}
              {articles[0].imageUrl && (
                <Image
                  source={{ uri: articles[0].imageUrl }}
                  style={styles.featuredBgImage}
                  resizeMode="cover"
                />
              )}
              {/* Dark overlay for text readability */}
              <View
                style={[
                  styles.featuredOverlay,
                  !articles[0].imageUrl && {
                    backgroundColor: "rgba(0,0,0,0.15)",
                  },
                ]}
              />
              {/* Decorative large icon watermark (shown when no image) */}
              {!articles[0].imageUrl && (
                <Ionicons
                  name={articles[0].icon as any}
                  size={96}
                  color="rgba(255,255,255,0.12)"
                  style={styles.featuredDecorIcon}
                />
              )}
              <View style={styles.featuredInner}>
                <View style={styles.featuredCatBadge}>
                  <Text style={styles.featuredCatText}>
                    {CATEGORY_NAMES[articles[0].category] ?? "Bài viết"}
                  </Text>
                </View>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {articles[0].title}
                </Text>
                <View style={styles.featuredMeta}>
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color="rgba(255,255,255,0.8)"
                  />
                  <Text style={styles.featuredMetaText}>
                    {articles[0].readTime ?? 5} phút đọc
                  </Text>
                  <View style={styles.featuredReadBtn}>
                    <Text
                      style={[
                        styles.featuredReadBtnText,
                        { color: articles[0].color },
                      ]}
                    >
                      Đọc ngay
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={11}
                      color={articles[0].color}
                    />
                  </View>
                </View>
              </View>
            </PressableCard>
          )}

          {/* Remaining articles — horizontal tile scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.articlesScroll}
          >
            {articles.slice(1, 5).map((article) => (
              <PressableCard
                key={article.id}
                style={styles.articleCard}
                onPress={() => {
                  databaseService
                    .markArticleRead(article.id)
                    .catch(console.error);
                  navigation.navigate("ArticleDetail", { article });
                }}
              >
                <View
                  style={[
                    styles.articleCardTop,
                    { backgroundColor: article.color },
                  ]}
                >
                  {article.imageUrl ? (
                    <Image
                      source={{ uri: article.imageUrl }}
                      style={styles.articleCardTopImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name={article.icon as any}
                      size={24}
                      color="rgba(255,255,255,0.95)"
                    />
                  )}
                </View>
                <View style={styles.articleCardBody}>
                  <Text style={styles.articleTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <View style={styles.articleMeta}>
                    <Ionicons
                      name="time-outline"
                      size={11}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.articleReadTime}>
                      {article.readTime ?? 5} phút
                    </Text>
                  </View>
                </View>
              </PressableCard>
            ))}
          </ScrollView>
        </View>

        {/* Trending Products */}
        {trendingProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="trending-up" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Xu hướng quà tặng</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate("AllProducts")}
              >
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {trendingProducts.slice(0, 6).map((product) => (
                <View key={product.id} style={styles.productsGridItem}>
                  <ProductCard product={product} variant="grid" />
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* FAB */}
      <View
        style={[
          styles.fabWrapper,
          { bottom: 20 + TAB_BAR_HEIGHT + insets.bottom },
        ]}
      >
        {[pulse1, pulse2].map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              styles.fabRing,
              {
                opacity: anim.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, 0.45, 0],
                }),
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2.2],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddEvent}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 0,
  },
  // Greeting header
  greeting: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  greetingText: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  // Shop banner (gradient)
  shopBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  shopBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.primary + "25",
    borderRadius: 14,
  },
  shopBannerText: {
    flex: 1,
  },
  shopBannerTitle: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  shopBannerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Selected date panel
  selectedDateContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 4,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  selectedDateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  selectedDateLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  todayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  todayBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
  },
  selectedDateText: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
  },
  eventCountBadge: {
    backgroundColor: colors.primary + "12",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  eventCountBadgeText: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    color: colors.primary,
  },
  eventsList: {
    padding: 8,
    gap: 6,
  },
  calEventCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: "hidden",
  },
  calEventAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  calEventBody: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 14,
  },
  calEventRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  calEventIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  calEventContent: {
    flex: 1,
    paddingHorizontal: 10,
  },
  calEventTitle: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
    marginBottom: 3,
  },
  calEventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  calEventDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  calEventDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textLight,
  },
  calEventTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  calEventTagText: {
    fontSize: 11,
    fontFamily: "Manrope_600SemiBold",
  },
  calEventBadges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    marginLeft: 64,
  },
  calEventBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  calEventBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  heroEmpty: {
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.primary + "15",
  },
  heroEmptyIcon: {
    width: 72,
    height: 72,
    marginBottom: 12,
  },
  heroEmptyTitle: {
    fontSize: 22,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  heroEmptySub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  heroEmptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  heroEmptyBtnText: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },

  // Sections
  section: {
    marginTop: 20,
    paddingHorizontal: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },
  viewAllText: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: "Manrope_600SemiBold",
  },

  // Event Card
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderLeftWidth: 4,
  },
  eventIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  eventCardContent: {
    flex: 1,
    marginRight: 8,
  },
  eventCardTitle: {
    fontSize: 15,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  eventCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventCardDate: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },

  // Upcoming Event Card — redesigned
  upcomingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  upcomingIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  upcomingInfo: {
    flex: 1,
    gap: 3,
  },
  upcomingTitle: {
    fontSize: 15,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
  },
  upcomingDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  upcomingDateText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  prepBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  prepBadgeText: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
  },
  countdownCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  countdownNum: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    lineHeight: 24,
  },
  countdownLabel: {
    fontSize: 10,
    fontFamily: "Manrope_500Medium",
    lineHeight: 13,
  },
  countdownToday: {
    width: 32,
    height: 32,
  },

  // Custom day cell
  dayCell: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 4,
    minHeight: 52,
    width: 36,
  },
  dayNumberWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumberSelected: {
    backgroundColor: colors.primary,
  },
  dayNumberToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayNumberText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: "Manrope_400Regular",
  },
  dayTextToday: {
    color: colors.primary,
    fontFamily: "Manrope_700Bold",
  },
  dayTextSelected: {
    color: colors.white,
    fontFamily: "Manrope_700Bold",
  },
  dayTextDisabled: {
    color: colors.textLight,
  },
  dayDotsRow: {
    flexDirection: "row",
    marginTop: 2,
    gap: 1,
    justifyContent: "center",
  },
  dayPlaceholder: {
    height: 12,
  },

  // Calendar
  calendarContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },

  // Selected Date
  selectedDateSection: {
    paddingHorizontal: 12,
    marginTop: 16,
  },
  selectedDateTitle: {
    fontSize: 15,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
  },
  specialDateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  specialDateIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  specialDateEmoji: { fontSize: 26 },
  specialDateContent: { flex: 1 },
  specialDateName: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
    marginBottom: 3,
  },
  specialDateHint: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Quick Actions — full-color cards
  quickActionsScroll: {
    gap: 12,
  },
  quickActionCard: {
    width: 158,
    borderRadius: 18,
    padding: 16,
    height: 202,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: "hidden",
  },
  qaDecorCircle: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -20,
    right: -20,
  },
  qaIconBg: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  qaTitle: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
    lineHeight: 20,
    marginBottom: 4,
  },
  qaSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 15,
    flex: 1,
  },
  qaArrow: {
    marginTop: 0,
    alignSelf: "flex-end",
  },

  // Articles — featured hero + tile cards
  featuredArticle: {
    marginHorizontal: 4,
    borderRadius: 18,
    height: 220,
    overflow: "hidden",
    marginBottom: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  featuredBgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  featuredOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  featuredDecorIcon: {
    position: "absolute",
    right: -10,
    top: -10,
  },
  featuredInner: {
    flex: 1,
    padding: 18,
    justifyContent: "flex-end",
  },
  featuredCatBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  featuredCatText: {
    fontSize: 11,
    fontFamily: "Manrope_600SemiBold",
    color: colors.white,
  },
  featuredTitle: {
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
    lineHeight: 24,
    marginBottom: 12,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featuredMetaText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    flex: 1,
  },
  featuredReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  featuredReadBtnText: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
  },
  productsScroll: {
    paddingHorizontal: 4,
  },
  productsVertical: {
    paddingHorizontal: 4,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 4,
    gap: 12,
  },
  productsGridItem: {
    width: Math.floor((SCREEN_WIDTH - 24 - 8 - 12) / 2),
  },
  articlesScroll: {
    gap: 12,
  },
  articleCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  articleCardTop: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  articleCardTopImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  articleCardBody: {
    padding: 10,
  },
  articleTitle: {
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
    color: colors.textPrimary,
    lineHeight: 17,
    marginBottom: 7,
  },
  articleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  articleReadTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // FAB
  fabWrapper: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  fabRing: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Occasion prep popup modal
  prepModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  prepModalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 12,
    width: "100%",
  },
  prepModalHandle: {
    display: "none",
  },
  prepModalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prepModalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  prepModalDaysBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  prepModalDaysText: {
    fontSize: 14,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },
  prepModalTitle: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    color: colors.textPrimary,
  },
  prepModalSub: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  prepModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  prepModalBtnText: {
    fontSize: 16,
    fontFamily: "Manrope_700Bold",
    color: colors.white,
  },
  prepModalSkip: {
    alignItems: "center",
    paddingVertical: 10,
  },
  prepModalSkipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
}));
export default HomeScreen;
