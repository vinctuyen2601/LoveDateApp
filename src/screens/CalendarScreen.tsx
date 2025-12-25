import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { useEvents } from "../store/EventsContext";
import { useSync } from "../store/SyncContext";
import { Event } from "../types";
import { COLORS } from "../constants/colors";
import { STRINGS } from "../constants/strings";
import EventCard from "../components/EventCard";
import { useNavigation } from "@react-navigation/native";
import { getFeaturedArticles, DEFAULT_ARTICLES } from "../data/articles";

const { width } = Dimensions.get("window");

const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { events, isLoading, refreshEvents, deleteEvent } = useEvents();
  const { sync, syncStatus } = useSync();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentMonth, setCurrentMonth] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get featured articles
  const [articles] = useState(() => getFeaturedArticles(DEFAULT_ARTICLES));

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

  // Helper function to get category color
  const getCategoryColor = (category: string): string => {
    switch (category) {
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

      const eventDate = date.toISOString().split("T")[0];

      if (!marked[eventDate]) {
        marked[eventDate] = {
          marked: true,
          dots: [],
        };
      }

      // Add dot with category color
      const categoryColor = getCategoryColor(event.category);
      if (marked[eventDate].dots.length < 3) {
        marked[eventDate].dots.push({
          color: categoryColor,
        });
      }
    });

    // Highlight selected date
    if (marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: COLORS.primary,
      };
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: COLORS.primary,
      };
    }

    return marked;
  }, [events, selectedDate]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    return events
      .filter((event) => {
        if (!event.eventDate) return false;

        const date = new Date(event.eventDate);
        if (isNaN(date.getTime())) return false;

        const eventDate = date.toISOString().split("T")[0];
        return eventDate === selectedDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.eventDate).getTime();
        const dateB = new Date(b.eventDate).getTime();
        return dateA - dateB;
      });
  }, [events, selectedDate]);

  // Get month statistics
  const monthStats = useMemo(() => {
    const monthDate = new Date(currentMonth);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const monthEvents = events.filter((event) => {
      if (!event.eventDate) return false;

      const eventDate = new Date(event.eventDate);
      if (isNaN(eventDate.getTime())) return false;

      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = monthEvents.filter((event) => {
      const eventDate = new Date(event.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });

    const past = monthEvents.filter((event) => {
      const eventDate = new Date(event.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate < today;
    });

    return {
      total: monthEvents.length,
      upcoming: upcoming.length,
      past: past.length,
    };
  }, [events, currentMonth]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    setCurrentMonth(month.dateString);
  };

  const handleEventPress = (event: Event) => {
    navigation.navigate("EventDetail", { eventId: event.id });
  };

  const handleEventEdit = (event: Event) => {
    navigation.navigate("AddEvent", { eventId: event.id });
  };

  const handleEventDelete = async (event: Event) => {
    try {
      await deleteEvent(event.id);
    } catch (error: any) {
      console.error("Delete event failed:", error);
    }
  };

  const handleArticlePress = (articleId: string) => {
    navigation.navigate("Suggestions");
  };

  const formatSelectedDate = () => {
    try {
      const date = new Date(selectedDate);
      if (isNaN(date.getTime())) return selectedDate;

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
    } catch (error) {
      console.error("Error formatting date:", error);
      return selectedDate;
    }
  };

  const isToday = (dateString: string) => {
    return dateString === new Date().toISOString().split("T")[0];
  };

  return (
    <View style={styles.container}>
      {/* Header with Month Stats */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar" size={28} color={COLORS.primary} />
            <Text style={styles.headerTitle}>Lịch sự kiện</Text>
          </View>

          <TouchableOpacity
            style={styles.todayButton}
            onPress={() =>
              setSelectedDate(new Date().toISOString().split("T")[0])
            }
          >
            <Ionicons name="today" size={20} color={COLORS.white} />
            <Text style={styles.todayButtonText}>Hôm nay</Text>
          </TouchableOpacity>
        </View>

        {/* Month Statistics */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              navigation.navigate('EventsList', {
                filter: 'all',
                title: 'Tất cả sự kiện',
              })
            }
          >
            <Text style={styles.statValue}>{monthStats.total}</Text>
            <Text style={styles.statLabel}>Tổng số</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statItem, styles.statItemBorder]}
            onPress={() =>
              navigation.navigate('EventsList', {
                filter: 'upcoming',
                title: 'Sự kiện sắp tới',
              })
            }
          >
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {monthStats.upcoming}
            </Text>
            <Text style={styles.statLabel}>Sắp tới</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              navigation.navigate('EventsList', {
                filter: 'past',
                title: 'Sự kiện đã qua',
              })
            }
          >
            <Text style={[styles.statValue, { color: COLORS.textSecondary }]}>
              {monthStats.past}
            </Text>
            <Text style={styles.statLabel}>Đã qua</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Calendar */}
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
            firstDay={1}
            renderArrow={(direction: string) => (
              <Ionicons
                name={direction === "left" ? "chevron-back" : "chevron-forward"}
                size={24}
                color={COLORS.primary}
              />
            )}
          />
        </View>

        {/* Legend */}
        {/* <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Danh mục:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: COLORS.categoryBirthday },
                ]}
              />
              <Text style={styles.legendText}>Sinh nhật</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: COLORS.categoryAnniversary },
                ]}
              />
              <Text style={styles.legendText}>Kỷ niệm</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: COLORS.categoryHoliday },
                ]}
              />
              <Text style={styles.legendText}>Ngày lễ</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: COLORS.categoryOther },
                ]}
              />
              <Text style={styles.legendText}>Khác</Text>
            </View>
          </View>
        </View> */}

        {/* Selected Date Section */}
        <View style={styles.selectedDateContainer}>
          <View style={styles.selectedDateHeader}>
            <View style={styles.selectedDateInfo}>
              {isToday(selectedDate) && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>HÔM NAY</Text>
                </View>
              )}
              <Text style={styles.selectedDateText}>
                {formatSelectedDate()}
              </Text>
            </View>
            <View style={styles.eventCount}>
              <Text style={styles.eventCountText}>
                {selectedDateEvents.length}
              </Text>
              <Text style={styles.eventCountLabel}>sự kiện</Text>
            </View>
          </View>

          {/* Events List */}
          {selectedDateEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {selectedDateEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => handleEventPress(event)}
                  onEdit={() => handleEventEdit(event)}
                  onDelete={() => handleEventDelete(event)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={COLORS.textLight}
              />
              <Text style={styles.emptyText}>Không có sự kiện nào</Text>
              <Text style={styles.emptySubtext}>
                Nhấn vào ngày khác để xem sự kiện
              </Text>
            </View>
          )}
        </View>

        {/* Quick Add Button Hint */}
        {selectedDateEvents.length === 0 && (
          <View style={styles.hintContainer}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.info}
            />
            <Text style={styles.hintText}>
              Nhấn nút + ở góc dưới để thêm sự kiện mới
            </Text>
          </View>
        )}

        {/* Featured Articles */}
        <View style={styles.articlesSection}>
          <View style={styles.articlesSectionHeader}>
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
    backgroundColor: COLORS.white,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerWithBanner: {
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 72 : 108,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  todayButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
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
  legendContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 4,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
    padding: 16,
    backgroundColor: COLORS.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedDateInfo: {
    flex: 1,
  },
  todayBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  todayBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  eventCount: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  eventCountText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  eventCountLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  eventsList: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: "center",
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.infoLight,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.info,
    marginLeft: 8,
  },
  // Featured Articles
  articlesSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  articlesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
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
});

export default CalendarScreen;
