import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar, DateData } from "react-native-calendars";
import { useEvents } from "../store/EventsContext";
import { useSync } from "../store/SyncContext";
import { useNotification } from "../store/NotificationContext";
import { Event } from "../types";
import { COLORS } from "../constants/colors";
import { CALENDAR_THEME } from "../constants/calendarTheme";
import { useNavigation } from "@react-navigation/native";
import { getFeaturedArticles, DEFAULT_ARTICLES } from "../data/articles";
import { format, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import { DateUtils } from "../utils/date.utils";
import {
  BirthdayIcon,
  AnniversaryIcon,
  HolidayIcon,
  OtherIcon,
} from "../components/EventIcons";
import NotificationBanner from "../components/NotificationBanner";
import PressableCard from "../components/PressableCard";

const TAB_BAR_HEIGHT = 60;

const getEventIcon = (primaryTag: string) => {
  switch (primaryTag) {
    case "birthday":
      return BirthdayIcon;
    case "anniversary":
      return AnniversaryIcon;
    case "holiday":
      return HolidayIcon;
    default:
      return OtherIcon;
  }
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { events, isLoading, refreshEvents } = useEvents();
  const { sync } = useSync();
  const { message, icon } = useNotification();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    DateUtils.getTodayString()
  );
  const [currentMonth, setCurrentMonth] = useState(
    DateUtils.getTodayString()
  );
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
    now.setHours(0, 0, 0, 0);
    const sevenDaysLater = addDays(now, 7);
    return events
      .filter((event) => {
        if (!event.eventDate) return false;
        const eventDate = new Date(event.eventDate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= now && eventDate <= sevenDaysLater;
      })
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      )
      .slice(0, 3);
  }, [events]);

  const getCategoryColor = (tag: string): string => {
    switch (tag) {
      case "birthday":
        return COLORS.categoryBirthday;
      case "anniversary":
        return COLORS.categoryAnniversary;
      case "holiday":
        return COLORS.categoryHoliday;
      default:
        return COLORS.categoryOther;
    }
  };

  const markedDates = useMemo(() => {
    const marked: any = {};
    events.forEach((event) => {
      if (!event.eventDate) return;
      const date = new Date(event.eventDate);
      if (isNaN(date.getTime())) return;
      const eventDate = DateUtils.toLocalDateString(date);
      if (!marked[eventDate]) {
        marked[eventDate] = { marked: true, dots: [] };
      }
      const primaryTag = event.tags[0] || "other";
      marked[eventDate].dots.push({ color: getCategoryColor(primaryTag) });
    });
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = COLORS.primary;
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: COLORS.primary,
      };
    }
    return marked;
  }, [events, selectedDate]);

  const selectedDateEvents = useMemo(() => {
    return events.filter((event) => {
      if (!event.eventDate) return false;
      const eventDate = DateUtils.toLocalDateString(new Date(event.eventDate));
      return eventDate === selectedDate;
    });
  }, [events, selectedDate]);

  const handleDayPress = (day: DateData) => setSelectedDate(day.dateString);
  const handleMonthChange = (month: DateData) =>
    setCurrentMonth(month.dateString);

  const [articles] = useState(() => getFeaturedArticles(DEFAULT_ARTICLES));

  const handleSurveyPress = () =>
    navigation.navigate("Suggestions", { openSurvey: true });
  const handleEventPress = (event: Event) =>
    navigation.navigate("EventDetail", { eventId: event.id });
  const handleAddEvent = () => navigation.navigate("AddEvent");
  const handleViewCalendar = () => navigation.navigate("Calendar");

  // ===== SHARED EVENT CARD =====
  const renderEventCard = (
    event: Event,
    options: { showDate?: boolean } = {}
  ) => {
    const { showDate = true } = options;
    const primaryTag =
      event.tags && event.tags.length > 0 ? event.tags[0] : "other";
    const categoryColor = getCategoryColor(primaryTag);
    const EventIcon = getEventIcon(primaryTag);

    return (
      <PressableCard
        key={event.id}
        style={[styles.eventCard, { borderLeftColor: categoryColor }]}
        onPress={() => handleEventPress(event)}
      >
        <View
          style={[
            styles.eventIconBadge,
            { backgroundColor: categoryColor + "15" },
          ]}
        >
          <EventIcon size={32} color={categoryColor} />
        </View>
        <View style={styles.eventCardContent}>
          <Text style={styles.eventCardTitle} numberOfLines={2}>
            {event.title}
          </Text>
          {showDate && (
            <View style={styles.eventCardMeta}>
              <Ionicons
                name="time-outline"
                size={13}
                color={COLORS.textSecondary}
              />
              <Text style={styles.eventCardDate}>
                {format(new Date(event.eventDate), "EEEE, d MMMM", {
                  locale: vi,
                })}
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </PressableCard>
    );
  };

  // ===== QUICK ACTIONS =====
  const quickActions = [
    {
      id: "survey",
      icon: "heart-circle" as const,
      title: "Khảo sát tính cách",
      subtitle: "Gợi ý quà tặng",
      color: COLORS.primary,
      onPress: handleSurveyPress,
    },
    {
      id: "mbti",
      icon: "people" as const,
      title: "Trắc nghiệm MBTI",
      subtitle: "16 loại tính cách",
      color: COLORS.secondary,
      onPress: handleSurveyPress,
    },
    {
      id: "add",
      icon: "add-circle" as const,
      title: "Thêm sự kiện",
      subtitle: "Tạo mới ngay",
      color: COLORS.success,
      onPress: handleAddEvent,
    },
  ];


  return (
    <View style={styles.container}>
      <NotificationBanner message={message} icon={icon} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Empty hint banner */}
        {!isLoading && events.length === 0 && (
          <PressableCard style={styles.emptyHint} onPress={handleAddEvent}>
            <Ionicons name="add-circle" size={20} color={COLORS.primary} />
            <Text style={styles.emptyHintText}>
              Thêm sự kiện đầu tiên của bạn
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={COLORS.textSecondary}
            />
          </PressableCard>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons
                  name="alarm-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.sectionTitle}>Sự kiện sắp tới</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {upcomingEvents.length}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isUpcomingExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
            {isUpcomingExpanded &&
              upcomingEvents.map((event) => renderEventCard(event))}
          </View>
        )}

        {/* Calendar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>Lịch sự kiện</Text>
            </View>
            <TouchableOpacity onPress={handleViewCalendar}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            <Calendar
              current={currentMonth}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
              markedDates={markedDates}
              markingType="multi-dot"
              theme={CALENDAR_THEME}
              enableSwipeMonths={true}
              hideExtraDays={false}
              firstDay={1}
              renderArrow={(direction: string) => (
                <Ionicons
                  name={
                    direction === "left" ? "chevron-back" : "chevron-forward"
                  }
                  size={20}
                  color={COLORS.primary}
                />
              )}
            />
          </View>
        </View>

        {/* Selected Date Events */}
        {selectedDateEvents.length > 0 && (
          <View style={styles.selectedDateSection}>
            <View style={styles.selectedDateHeader}>
              <Ionicons
                name="today-outline"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.selectedDateTitle}>
                Ngay{" "}
                {format(new Date(selectedDate + "T00:00:00"), "d/M", {
                  locale: vi,
                })}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {selectedDateEvents.length}
                </Text>
              </View>
            </View>
            {selectedDateEvents.map((event) =>
              renderEventCard(event, { showDate: false })
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="flash-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>Khám phá</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            {quickActions.map((action) => (
              <PressableCard
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.onPress}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: action.color + "15" },
                  ]}
                >
                  <Ionicons
                    name={action.icon}
                    size={28}
                    color={action.color}
                  />
                </View>
                <Text style={styles.quickActionTitle} numberOfLines={1}>
                  {action.title}
                </Text>
                <Text style={styles.quickActionSubtitle} numberOfLines={1}>
                  {action.subtitle}
                </Text>
              </PressableCard>
            ))}
          </ScrollView>
        </View>

        {/* Articles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="book-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>Bài viết nổi bật</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Suggestions")}
            >
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.articlesScroll}
          >
            {articles.slice(0, 4).map((article) => (
              <PressableCard
                key={article.id}
                style={styles.articleCard}
                onPress={() => navigation.navigate("Suggestions")}
              >
                <View
                  style={[
                    styles.articleColorBar,
                    { backgroundColor: article.color },
                  ]}
                />
                <View style={styles.articleContent}>
                  <View
                    style={[
                      styles.articleIconCircle,
                      { backgroundColor: article.color + "15" },
                    ]}
                  >
                    <Ionicons
                      name={article.icon}
                      size={20}
                      color={article.color}
                    />
                  </View>
                  <Text style={styles.articleTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <View style={styles.articleMeta}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.articleReadTime}>
                      {article.readTime} phút
                    </Text>
                  </View>
                </View>
              </PressableCard>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddEvent}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 56 : 56,
  },
  // Empty hint
  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + "20",
    borderStyle: "dashed",
  },
  emptyHintText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "500",
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
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.white,
  },
  viewAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },

  // Event Card
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: COLORS.shadow,
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
    fontWeight: "600",
    color: COLORS.textPrimary,
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
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  },

  // Calendar
  calendarContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
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
  selectedDateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  selectedDateTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  // Quick Actions
  quickActionsScroll: {
    gap: 12,
  },
  quickActionCard: {
    width: 140,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Articles
  articlesScroll: {
    gap: 12,
  },
  articleCard: {
    width: 170,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  articleColorBar: {
    height: 6,
    width: "100%",
  },
  articleContent: {
    padding: 14,
  },
  articleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  articleTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 8,
  },
  articleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  articleReadTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20 + TAB_BAR_HEIGHT,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HomeScreen;
