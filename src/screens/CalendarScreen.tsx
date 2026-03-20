import React, { useState, useMemo } from "react";
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
import IconImage from "@components/atoms/IconImage";
import { getTagImage, getSpecialDateImage } from "@lib/iconImages";
import { useEvents } from "@contexts/EventsContext";
import { useSync } from "@contexts/SyncContext";
import { Event, getTagColor, getTagLabel } from "../types";
import { COLORS } from "@themes/colors";
import { CALENDAR_THEME } from "@themes/calendarTheme";
import { STRINGS } from "../constants/strings";
import { DateUtils } from "@lib/date.utils";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getFeaturedArticles, DEFAULT_ARTICLES } from "../data/articles";
import {
  getSpecialDatesForMonth,
  SpecialDate,
} from "../constants/specialDates";

const CalendarScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { events, isLoading, refreshEvents, deleteEvent, addEvent } =
    useEvents();
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

  const PREP_SPECIAL_IDS = [
    "sys_valentine",
    "sys_quocte_phunu",
    "sys_phunu_vn",
    "sys_giang_sinh",
  ];

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

    // Merge special dates (bao gom am lich, nth-weekday)
    const calMonth = parseInt(currentMonth.slice(5, 7), 10);
    const resolvedSpecials = getSpecialDatesForMonth(calYear, calMonth);
    resolvedSpecials.forEach((sd) => {
      const mm = String(sd.solarMonth).padStart(2, "0");
      const dd = String(sd.solarDay).padStart(2, "0");
      const dateKey = `${calYear}-${mm}-${dd}`;
      if (!marked[dateKey]) marked[dateKey] = { dots: [] };
      if (!marked[dateKey].dots) marked[dateKey].dots = [];

      if (PREP_SPECIAL_IDS.includes(sd.id)) {
        // Find the holiday event dot index for this date (if any)
        const holidayEventExists = events.some((e) => {
          if (!e.eventDate || !e.tags.includes("holiday")) return false;
          const d = new Date(e.eventDate);
          const mk = e.isRecurring
            ? `${calYear}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                d.getDate()
              ).padStart(2, "0")}`
            : DateUtils.toLocalDateString(d);
          return mk === dateKey;
        });
        if (holidayEventExists) {
          // Replace holiday dot with special date icon so only one dot shows
          const holidayDotIdx = marked[dateKey].dots.findIndex(
            (dot: any) => dot.color === getTagColor("holiday")
          );
          const specialDot = {
            color: sd.color,
            image: getSpecialDateImage(sd.id),
          };
          if (holidayDotIdx >= 0) {
            marked[dateKey].dots[holidayDotIdx] = specialDot;
          } else {
            marked[dateKey].dots.unshift(specialDot);
          }
          return;
        }
      }

      marked[dateKey].dots.unshift({
        color: sd.color,
        image: getSpecialDateImage(sd.id),
      });
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

  // Get events for selected date (recurring events match by month+day)
  const selectedDateEvents = useMemo(() => {
    const selDate = new Date(selectedDate);
    if (isNaN(selDate.getTime())) return [];
    const selMonth = selDate.getMonth();
    const selDay = selDate.getDate();

    return events
      .filter((event) => {
        if (!event.eventDate) return false;
        const d = new Date(event.eventDate);
        if (isNaN(d.getTime())) return false;

        if (event.isRecurring) {
          // Recurring: match by month + day only
          return d.getMonth() === selMonth && d.getDate() === selDay;
        }
        // One-time: exact date match
        return DateUtils.toLocalDateString(d) === selectedDate;
      })
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      );
  }, [events, selectedDate]);

  // System special dates matching selected date
  const selectedDateSpecials = useMemo(() => {
    const [yearStr, monthStr, dayStr] = selectedDate.split("-");
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const d = parseInt(dayStr, 10);
    return getSpecialDatesForMonth(y, m).filter((sd) => sd.solarDay === d);
  }, [selectedDate]);

  // Get month statistics
  const monthStats = useMemo(() => {
    const monthDate = new Date(currentMonth);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth(); // 0-based

    // User events: recurring matches by month only, one-time by year+month
    const monthEvents = events.filter((event) => {
      if (!event.eventDate) return false;
      const d = new Date(event.eventDate);
      if (isNaN(d.getTime())) return false;
      if (event.isRecurring) return d.getMonth() === month;
      return d.getFullYear() === year && d.getMonth() === month;
    });

    // Special dates in this month (resolved from shared data)
    const specialInMonth = getSpecialDatesForMonth(year, month + 1);

    const totalCount = monthEvents.length + specialInMonth.length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    const isCurrentMonth = year === todayYear && month === todayMonth;

    // Upcoming/past for user events — compare using calendar day in month
    const upcomingUserEvents = monthEvents.filter((event) => {
      const d = new Date(event.eventDate);
      if (!isCurrentMonth) return month > todayMonth || year > todayYear;
      const eventDayInMonth = new Date(year, month, d.getDate());
      eventDayInMonth.setHours(0, 0, 0, 0);
      return eventDayInMonth >= today;
    });

    const pastUserEvents = monthEvents.length - upcomingUserEvents.length;

    // Upcoming/past for special dates
    let upcomingSpecial = 0;
    let pastSpecial = 0;
    if (isCurrentMonth) {
      specialInMonth.forEach((sd) => {
        if (sd.solarDay >= todayDay) upcomingSpecial++;
        else pastSpecial++;
      });
    } else if (month > todayMonth || year > todayYear) {
      upcomingSpecial = specialInMonth.length;
    } else {
      pastSpecial = specialInMonth.length;
    }

    return {
      total: totalCount,
      upcoming: upcomingUserEvents.length + upcomingSpecial,
      past: pastUserEvents + pastSpecial,
    };
  }, [events, currentMonth]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    setCurrentMonth(month.dateString);
  };

  const handlePrepSpecialDate = async (sd: SpecialDate, date: Date) => {
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
      let text = `${dayOfWeek[date.getDay()]}, ${date.getDate()} tháng ${
        date.getMonth() + 1
      }, ${date.getFullYear()}`;

      return text;
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
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          {/* <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => {
                setSelectedDate(DateUtils.getTodayString());
                setCurrentMonth(DateUtils.getTodayString());
              }}
            >
              <Ionicons name="today" size={16} color={COLORS.white} />
              <Text style={styles.todayButtonText}>Hôm nay</Text>
            </TouchableOpacity>
          </View> */}

          {/* Section header: Sự kiện + Xem tất cả */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sự kiện</Text>
            <TouchableOpacity
              style={styles.viewAllLink}
              onPress={() =>
                navigation.navigate("EventsList", {
                  filter: "all",
                  title: "Sự kiện của tôi",
                })
              }
            >
              <Text style={styles.viewAllLinkText}>
                Sự kiện của tôi ({events.length})
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Month stats chips */}
          <View style={styles.statsChips}>
            <TouchableOpacity
              style={styles.statChip}
              onPress={() =>
                navigation.navigate("EventsList", {
                  filter: "all",
                  title: "Sự kiện trong tháng",
                  month: currentMonth,
                })
              }
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.statChipValue}>{monthStats.total}</Text>
              <Text style={styles.statChipLabel}>trong tháng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statChip}
              onPress={() =>
                navigation.navigate("EventsList", {
                  filter: "upcoming",
                  title: "Sắp tới trong tháng",
                  month: currentMonth,
                })
              }
            >
              <Ionicons
                name="arrow-up-circle-outline"
                size={14}
                color={COLORS.success}
              />
              <Text style={[styles.statChipValue, { color: COLORS.success }]}>
                {monthStats.upcoming}
              </Text>
              <Text style={styles.statChipLabel}>sắp tới</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statChip}
              onPress={() =>
                navigation.navigate("EventsList", {
                  filter: "past",
                  title: "Đã qua trong tháng",
                  month: currentMonth,
                })
              }
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text
                style={[styles.statChipValue, { color: COLORS.textSecondary }]}
              >
                {monthStats.past}
              </Text>
              <Text style={styles.statChipLabel}>đã qua</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Selected Date Section */}
          <View style={styles.selectedDateContainer}>
            <View style={styles.selectedDateHeader}>
              <View style={styles.selectedDateLeft}>
                {isToday(selectedDate) && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Hôm nay</Text>
                  </View>
                )}
                <Text style={styles.selectedDateText}>
                  {formatSelectedDate()}
                </Text>
              </View>
              {selectedDateEvents.length + selectedDateSpecials.length > 0 && (
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
              )}
            </View>

            {/* Events List */}
            {selectedDateEvents.length + selectedDateSpecials.length > 0 ? (
              <View style={styles.eventsList}>
                {/* System special dates */}
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
                                color={COLORS.textLight}
                              />
                            )}
                          </View>
                        </View>
                      </Wrapper>
                    );
                  })}

                {/* User events */}
                {selectedDateEvents.map((event) => {
                  const primaryTag = event.tags?.[0] || "other";
                  const tagColor = getTagColor(primaryTag);
                  const tagLabel = getTagLabel(primaryTag);
                  const matchingSpecial = event.tags.includes("holiday")
                    ? selectedDateSpecials.find((sd) =>
                        PREP_SPECIAL_IDS.includes(sd.id)
                      )
                    : undefined;
                  const icon = matchingSpecial
                    ? getSpecialDateImage(matchingSpecial.id)
                    : getTagImage(primaryTag);

                  return (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.calEventCard}
                      activeOpacity={0.7}
                      onPress={() => handleEventPress(event)}
                    >
                      <View
                        style={[
                          styles.calEventAccent,
                          { backgroundColor: tagColor },
                        ]}
                      />
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
                            <Text
                              style={styles.calEventTitle}
                              numberOfLines={1}
                            >
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
                                <Text
                                  style={[
                                    styles.calEventTagText,
                                    { color: tagColor },
                                  ]}
                                >
                                  {tagLabel}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={COLORS.textLight}
                          />
                        </View>
                        {/* Bottom row: badges */}
                        <View style={styles.calEventBadges}>
                          {event.isRecurring && (
                            <View style={styles.calEventBadge}>
                              <Ionicons
                                name="repeat"
                                size={12}
                                color={COLORS.textSecondary}
                              />
                              <Text style={styles.calEventBadgeText}>
                                Hàng năm
                              </Text>
                            </View>
                          )}
                          {event.isNotificationEnabled === false && (
                            <View style={styles.calEventBadge}>
                              <Ionicons
                                name="notifications-off-outline"
                                size={12}
                                color={COLORS.textLight}
                              />
                              <Text
                                style={[
                                  styles.calEventBadgeText,
                                  { color: COLORS.textLight },
                                ]}
                              >
                                Tắt TB
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyDateState}>
                <Ionicons
                  name="calendar-outline"
                  size={40}
                  color={COLORS.textLight}
                />
                <Text style={styles.emptyDateText}>Chưa có sự kiện</Text>
                <TouchableOpacity
                  style={styles.emptyDateAction}
                  onPress={() =>
                    navigation.navigate("AddEvent", {
                      prefillDate: selectedDate,
                    })
                  }
                >
                  <Ionicons name="add" size={16} color={COLORS.primary} />
                  <Text style={styles.emptyDateActionText}>Thêm sự kiện</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

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
                  name={
                    direction === "left" ? "chevron-back" : "chevron-forward"
                  }
                  size={20}
                  color={COLORS.primary}
                />
              )}
              dayComponent={({ date, state, marking }: any) => {
                const isSelected = !!marking?.selected;
                const isToday = state === "today";
                const isDisabled = state === "disabled";
                const dots: { color: string; image: any }[] =
                  marking?.dots ?? [];

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

                    {dots.length > 0 ? (
                      <View style={styles.dayDotsRow}>
                        {dots.slice(0, 2).map((dot, i) => (
                          <IconImage key={i} source={dot.image} size={12} />
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

          {/* Featured Articles */}
          {/* <View style={styles.articlesSection}>
          <View style={styles.articlesSectionHeader}>
            <Text style={styles.articlesSectionTitle}>✨ Bài viết nổi bật</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Suggestions")}
            >
              <Text style={styles.articlesViewAllText}>Xem tất cả</Text>
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
        </View> */}

          {/* Bottom Spacing */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddEvent")}
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
    backgroundColor: COLORS.primary + "10",
    paddingTop: 0,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 5,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: COLORS.primary + "50",
  },
  headerWithBanner: {
    paddingTop: 0,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    // marginBottom: 16,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  viewAllLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  statsChips: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  statChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statChipValue: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  statChipLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.primary,
  },
  dayNumberToday: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  dayNumberText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "400",
  },
  dayTextToday: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  dayTextSelected: {
    color: COLORS.white,
    fontWeight: "700",
  },
  dayTextDisabled: {
    color: COLORS.textLight,
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
  selectedDateContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 4,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  selectedDateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  selectedDateLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  todayBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  todayBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "700",
  },
  selectedDateText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  eventCountBadge: {
    backgroundColor: COLORS.primary + "12",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  eventCountBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  eventsList: {
    padding: 8,
    gap: 6,
  },
  calEventCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
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
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  calEventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  calEventDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  calEventDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textLight,
  },
  calEventTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  calEventTagText: {
    fontSize: 11,
    fontWeight: "600",
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
    color: COLORS.textSecondary,
  },
  emptyDateState: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  emptyDateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyDateAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "12",
  },
  emptyDateActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
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
  articlesSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  articlesViewAllText: {
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
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default CalendarScreen;
