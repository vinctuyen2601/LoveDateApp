import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { useEvents } from '@contexts/EventsContext';
import { useSync } from '@contexts/SyncContext';
import { Event } from "../types";
import { COLORS } from '@themes/colors';
import { CALENDAR_THEME } from '@themes/calendarTheme';
import { STRINGS } from "../constants/strings";
import { DateUtils } from '@lib/date.utils';
import EventCard from "@components/molecules/EventCard";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getFeaturedArticles, DEFAULT_ARTICLES } from "../data/articles";
import { EmptyState } from "@components/atoms/EmptyState";

const EVENT_EMOJIS: Record<string, string> = {
  birthday: '🎂',
  anniversary: '💑',
  holiday: '🎉',
  memorial: '✝️',
  other: '⭐',
};

const SPECIAL_DATES = [
  { month: 1,  day: 1,  name: 'Năm Mới Dương Lịch',    emoji: '🎉', color: '#F59E0B' },
  { month: 2,  day: 14, name: 'Ngày Valentine',          emoji: '💝', color: '#E91E63' },
  { month: 3,  day: 8,  name: 'Ngày Quốc tế Phụ nữ',   emoji: '🌷', color: '#9C27B0' },
  { month: 3,  day: 14, name: 'Ngày Valentine Trắng',    emoji: '🤍', color: '#64748B' },
  { month: 4,  day: 30, name: 'Ngày Giải phóng',         emoji: '🇻🇳', color: '#EF4444' },
  { month: 5,  day: 1,  name: 'Ngày Quốc tế Lao động',  emoji: '🌟', color: '#F97316' },
  { month: 6,  day: 1,  name: 'Ngày Quốc tế Thiếu nhi', emoji: '🎠', color: '#06B6D4' },
  { month: 9,  day: 2,  name: 'Ngày Quốc khánh',         emoji: '🇻🇳', color: '#EF4444' },
  { month: 10, day: 20, name: 'Ngày Phụ nữ Việt Nam',   emoji: '🌸', color: '#EC4899' },
  { month: 11, day: 20, name: 'Ngày Nhà giáo VN',        emoji: '📚', color: '#10B981' },
  { month: 12, day: 25, name: 'Giáng Sinh',              emoji: '🎄', color: '#16A34A' },
];

const CalendarScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { events, isLoading, refreshEvents, deleteEvent } = useEvents();
  const { sync, syncStatus } = useSync();

  // Accept selectedDate from navigation params (e.g. from HomeScreen)
  const initialDate = route.params?.selectedDate || DateUtils.getTodayString();

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [currentMonth, setCurrentMonth] = useState<string>(initialDate);
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

  // Prepare marked dates for calendar (emoji-based, same as HomeScreen)
  const markedDates = useMemo(() => {
    const marked: any = {};
    const calYear = parseInt(currentMonth.slice(0, 4), 10);

    events.forEach((event) => {
      if (!event.eventDate) return;
      const date = new Date(event.eventDate);
      if (isNaN(date.getTime())) return;

      let markDate: string;
      if (event.isRecurring) {
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        markDate = `${calYear}-${mm}-${dd}`;
      } else {
        markDate = DateUtils.toLocalDateString(date);
      }

      if (!marked[markDate]) {
        marked[markDate] = { marked: true, emojis: [] };
      }
      const primaryTag = event.tags[0] || 'other';
      marked[markDate].emojis.push(EVENT_EMOJIS[primaryTag] ?? '⭐');
    });

    // Merge special dates
    SPECIAL_DATES.forEach((sd) => {
      const mm = String(sd.month).padStart(2, '0');
      const dd = String(sd.day).padStart(2, '0');
      const dateKey = `${calYear}-${mm}-${dd}`;
      if (!marked[dateKey]) marked[dateKey] = { emojis: [] };
      if (!marked[dateKey].emojis) marked[dateKey].emojis = [];
      marked[dateKey].emojis.unshift(sd.emoji);
    });

    // Highlight selected date
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = COLORS.primary;
    } else {
      marked[selectedDate] = { selected: true, selectedColor: COLORS.primary };
    }

    return marked;
  }, [events, selectedDate, currentMonth]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    return events
      .filter((event) => {
        if (!event.eventDate) return false;

        const date = new Date(event.eventDate);
        if (isNaN(date.getTime())) return false;

        const eventDate = DateUtils.toLocalDateString(date);
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
    return dateString === DateUtils.getTodayString();
  };

  return (
    <View style={styles.container}>
      {/* Header with Month Stats */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar" size={28} color={COLORS.primary} />
            <Text style={styles.headerTitle}>Lịch sự kiện</Text>
          </View>

          <TouchableOpacity
            style={styles.todayButton}
            onPress={() =>
              setSelectedDate(DateUtils.getTodayString())
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
            <Text style={styles.statValue}>{events.length}</Text>
            <Text style={styles.statLabel}>Tổng số</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statItem, styles.statItemBorder]}
            onPress={() =>
              navigation.navigate('EventsList', {
                filter: 'upcoming',
                title: 'Sự kiện sắp tới',
                month: currentMonth,
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
                month: currentMonth,
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
            theme={CALENDAR_THEME}
            enableSwipeMonths={true}
            hideExtraDays={false}
            firstDay={1}
            renderArrow={(direction: string) => (
              <Ionicons
                name={direction === "left" ? "chevron-back" : "chevron-forward"}
                size={20}
                color={COLORS.primary}
              />
            )}
            dayComponent={({ date, state, marking }: any) => {
              const isSelected = !!marking?.selected;
              const isToday = state === 'today';
              const isDisabled = state === 'disabled';
              const emojis: string[] = marking?.emojis ?? [];

              return (
                <TouchableOpacity
                  onPress={() => date && handleDayPress(date)}
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

                  {emojis.length > 0 ? (
                    <View style={styles.dayEmojisRow}>
                      {emojis.slice(0, 2).map((e, i) => (
                        <Text key={i} style={styles.dayEmoji}>{e}</Text>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.dayPlaceholder} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>

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
                  onDelete={() => handleEventDelete(event)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="Không có sự kiện nào"
              subtitle="Chưa có sự kiện cho ngày này"
              actionLabel="Thêm sự kiện cho ngày này"
              onAction={() => navigation.navigate("AddEvent", { prefillDate: selectedDate })}
              iconColor={COLORS.primary}
            />
          )}
        </View>

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
                {article.imageUrl ? (
                  <Image
                    source={{ uri: article.imageUrl }}
                    style={styles.articleImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.articleImage, { backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="heart-outline" size={48} color={COLORS.textSecondary} />
                  </View>
                )}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEvent')}
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
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 0,
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
    paddingTop: 0,
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
    borderRadius: 14,
    overflow: "hidden",
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  // Custom day cell (mirrors HomeScreen)
  dayCell: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 4,
    minHeight: 52,
    width: 36,
  },
  dayNumberWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberSelected: {
    backgroundColor: COLORS.primary,
  },
  dayNumberToday: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  dayNumberText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '400',
  },
  dayTextToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: COLORS.textLight,
  },
  dayEmojisRow: {
    flexDirection: 'row',
    marginTop: 1,
  },
  dayEmoji: {
    fontSize: 11,
    lineHeight: 14,
  },
  dayPlaceholder: {
    height: 15,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default CalendarScreen;
