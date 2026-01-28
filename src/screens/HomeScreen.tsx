import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
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

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { events, isLoading, refreshEvents } = useEvents();
  const { sync, syncStatus } = useSync();
  const { message, icon } = useNotification();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    DateUtils.getTodayString()
  );
  const [currentMonth, setCurrentMonth] = useState(
    DateUtils.getTodayString()
  );
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(true); // Default is expanded

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

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day
    const sevenDaysLater = addDays(now, 7);

    return events
      .filter((event) => {
        if (!event.eventDate) return false;
        const eventDate = new Date(event.eventDate);
        eventDate.setHours(0, 0, 0, 0); // Reset to start of day
        return eventDate >= now && eventDate <= sevenDaysLater;
      })
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      )
      .slice(0, 3);
  };

  // Get category color
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

  // Prepare marked dates for calendar
  const markedDates = useMemo(() => {
    const marked: any = {};

    // Mark dates that have events
    events.forEach((event) => {
      // Validate date
      if (!event.eventDate) return;

      const date = new Date(event.eventDate);
      if (isNaN(date.getTime())) return; // Skip invalid dates

      const eventDate = DateUtils.toLocalDateString(date);

      if (!marked[eventDate]) {
        marked[eventDate] = {
          marked: true,
          dots: [],
        };
      }

      // Add dot with primary tag color
      const primaryTag = event.tags[0] || 'other';
      marked[eventDate].dots.push({
        color: getCategoryColor(primaryTag),
      });
    });

    // Mark selected date
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

  const upcomingEvents = useMemo(() => getUpcomingEvents(), [events]);

  // Calendar handlers
  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    setCurrentMonth(month.dateString);
  };

  // Get featured articles
  const [articles] = useState(() => getFeaturedArticles(DEFAULT_ARTICLES));

  const handleSurveyPress = () => {
    navigation.navigate("Suggestions", { openSurvey: true });
  };

  const handleArticlePress = (articleId: string) => {
    navigation.navigate("Suggestions");
  };

  const handleViewCalendar = () => {
    navigation.navigate("Calendar");
  };

  const handleEventPress = (event: Event) => {
    navigation.navigate("EventDetail", { eventId: event.id });
  };

  const handleAddEvent = () => {
    navigation.navigate("AddEvent");
  };

  return (
    <View style={styles.container}>
      {/* Notification Banner */}
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
        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <View style={styles.upcomingEventsSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>⏰ Sự kiện sắp tới</Text>
                <View style={styles.eventCountBadge}>
                  <Text style={styles.eventCountText}>
                    {upcomingEvents.length}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isUpcomingExpanded ? "chevron-up" : "chevron-down"}
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            {isUpcomingExpanded &&
              upcomingEvents.map((event) => {
                const primaryTag =
                  event.tags && event.tags.length > 0 ? event.tags[0] : "other";
                const categoryColor = getCategoryColor(primaryTag);
                const EventIcon =
                  primaryTag === "birthday"
                    ? BirthdayIcon
                    : primaryTag === "anniversary"
                    ? AnniversaryIcon
                    : primaryTag === "holiday"
                    ? HolidayIcon
                    : OtherIcon;

                return (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.upcomingEventCard}
                    onPress={() => handleEventPress(event)}
                  >
                    <View
                      style={[
                        styles.upcomingIconBadge,
                        { backgroundColor: categoryColor + "15" },
                      ]}
                    >
                      <EventIcon size={36} color={categoryColor} />
                    </View>
                    <View style={styles.upcomingEventContent}>
                      <Text style={styles.upcomingEventTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <View style={styles.upcomingEventMeta}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.upcomingEventDate}>
                          {format(new Date(event.eventDate), "EEEE, d MMMM", {
                            locale: vi,
                          })}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
          </View>
        )}

        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarContainer}>
            <Calendar
              current={currentMonth}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
              markedDates={markedDates}
              markingType="multi-dot"
              theme={{
                backgroundColor: COLORS.white,
                calendarBackground: COLORS.white,
                textSectionTitleColor: COLORS.textSecondary,
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.white,
                todayTextColor: COLORS.primary,
                dayTextColor: COLORS.textPrimary,
                textDisabledColor: COLORS.textLight,
                dotColor: COLORS.primary,
                selectedDotColor: COLORS.white,
                arrowColor: COLORS.primary,
                monthTextColor: COLORS.textPrimary,
                indicatorColor: COLORS.primary,
                textDayFontFamily: "System",
                textMonthFontFamily: "System",
                textDayHeaderFontFamily: "System",
                textDayFontWeight: "300",
                textMonthFontWeight: "600",
                textDayHeaderFontWeight: "500",
                textDayFontSize: 14,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 12,
              }}
              enableSwipeMonths={true}
              hideExtraDays={true}
              firstDay={0}
              renderArrow={(direction: string) => (
                <Ionicons
                  name={
                    direction === "left" ? "chevron-back" : "chevron-forward"
                  }
                  size={24}
                  color={COLORS.primary}
                />
              )}
            />
          </View>
        </View>

        {/* Survey Card */}
        <TouchableOpacity style={styles.surveyCard} onPress={handleSurveyPress}>
          <View style={styles.surveyIconContainer}>
            <Ionicons name="heart-circle" size={48} color={COLORS.white} />
          </View>
          <View style={styles.surveyContent}>
            <Text style={styles.surveyTitle}>Khảo sát tính cách 💕</Text>
            <Text style={styles.surveyDescription}>
              Tìm hiểu tính cách người yêu và nhận gợi ý quà tặng phù hợp
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        {/* MBTI Test Card */}
        <TouchableOpacity style={styles.mbtiCard} onPress={handleSurveyPress}>
          <View style={styles.mbtiIconContainer}>
            <Ionicons name="people" size={48} color={COLORS.white} />
          </View>
          <View style={styles.mbtiContent}>
            <Text style={styles.mbtiTitle}>Trách nghiệm MBTI 🧠</Text>
            <Text style={styles.mbtiDescription}>
              Khám phá 16 loại tính cách và hiểu rõ hơn về bản thân
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color={COLORS.secondary} />
        </TouchableOpacity>

        {/* Featured Articles */}
        <View style={styles.articlesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ Bài viết nổi bật</Text>
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
              <TouchableOpacity
                key={article.id}
                style={styles.articleCard}
                onPress={() => handleArticlePress(article.id)}
              >
                <Image
                  source={
                    article.imageUrl ||
                    require("../../assets/images/default-thumbnail.jpg")
                  }
                  style={styles.articleImage}
                  resizeMode="cover"
                />
                <View style={styles.articleOverlay}>
                  <View
                    style={[
                      styles.articleBadge,
                      { backgroundColor: article.color },
                    ]}
                  >
                    <Ionicons
                      name={article.icon}
                      size={12}
                      color={COLORS.white}
                    />
                  </View>
                  <Text style={styles.articleTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <Text style={styles.articleReadTime}>
                    {article.readTime} phút đọc
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
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
  // Fixed Notification Banner - Dark Theme
  fixedNotificationBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 48,
    paddingBottom: 12,
    gap: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fixedNotificationText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "500",
  },
  scrollContent: {
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 56 : 36,
  },
  // Top Notification Banner (old - for backward compatibility)
  topNotificationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 48,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.primary}20`,
  },
  // Header with Love Quote
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  loveQuote: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  },
  // Old styles for backward compatibility
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textTransform: "capitalize",
  },

  // Calendar Section
  calendarSection: {
    paddingHorizontal: 8,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  eventCountBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  eventCountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.white,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  calendarContainer: {
    backgroundColor: COLORS.white,
    marginTop: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedDateContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 4,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedDateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  selectedDateCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  miniEventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  miniEventIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  miniEventContent: {
    flex: 1,
  },
  miniEventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },

  // Upcoming Events Section
  upcomingEventsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  notificationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    gap: 8,
  },
  notificationScroll: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  upcomingEventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  upcomingIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  upcomingDateBadge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
  },
  upcomingDateDay: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    lineHeight: 28,
  },
  upcomingDateMonth: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  upcomingEventContent: {
    flex: 1,
    marginRight: 8,
  },
  upcomingEventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 22,
  },
  upcomingEventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  upcomingEventDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  },

  // Old Upcoming Events (for backward compatibility)
  upcomingSection: {
    marginTop: 16,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  upcomingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  upcomingDate: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  upcomingDay: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  upcomingMonth: {
    fontSize: 11,
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingEventTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  },

  // Survey Card
  surveyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  surveyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  surveyContent: {
    flex: 1,
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  surveyDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // MBTI Card
  mbtiCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  mbtiIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  mbtiContent: {
    flex: 1,
  },
  mbtiTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  mbtiDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Featured Articles
  articlesSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  articlesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  articleCard: {
    width: 200,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  articleImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  articleOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 12,
    justifyContent: "flex-end",
  },
  articleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 4,
    lineHeight: 18,
  },
  articleReadTime: {
    fontSize: 11,
    color: COLORS.white,
  },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default HomeScreen;
