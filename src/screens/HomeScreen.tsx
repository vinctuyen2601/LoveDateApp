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
} from "react-native";
const SCREEN_WIDTH = Dimensions.get("window").width;
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import IconImage from "@components/atoms/IconImage";
import { getTagImage, getSpecialDateImage } from "@lib/iconImages";
import { Calendar, DateData } from "react-native-calendars";
import { useEvents } from "@contexts/EventsContext";
import { useSync } from "@contexts/SyncContext";
import { useNotification } from "@contexts/NotificationContext";
import { Event, getTagColor } from "../types";
import { COLORS } from "@themes/colors";
import { CALENDAR_THEME } from "@themes/calendarTheme";
import { useNavigation } from "@react-navigation/native";
import { getFeaturedArticles } from "../data/articles";
import { getArticles } from "../services/articleService";
import { databaseService } from "../services/database.service";
import { getTrendingProducts } from "../services/affiliateProductService";
import { getSpecialDatesForMonth } from "../constants/specialDates";
import { AffiliateProduct } from "../types";
import ProductCard from "../components/suggestions/ProductCard";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { vi } from "date-fns/locale";
import { DateUtils } from "@lib/date.utils";
import NotificationBanner from "@components/molecules/NotificationBanner";
import PressableCard from "@components/atoms/PressableCard";

const TAB_BAR_HEIGHT = 60;

const CATEGORY_NAMES: Record<string, string> = {
  gifts: "Quà tặng",
  dates: "Hẹn hò",
  communication: "Giao tiếp",
  zodiac: "Cung hoàng đạo",
  personality: "Tính cách",
};



const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { events, isLoading, refreshEvents } = useEvents();
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


  const markedDates = useMemo(() => {
    const marked: any = {};
    // Lấy năm hiện tại trên calendar để hiển thị recurring events đúng năm
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
      marked[markDate].dots.push({ color: getTagColor(primaryTag), image: getTagImage(primaryTag) });
    });

    // Merge ngày đặc biệt (bao gồm âm lịch, nth-weekday) — dùng emoji
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
      marked[dateKey].dots.unshift({ color: sd.color, image: getSpecialDateImage(sd.id) });
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
  }, [events, selectedDate, currentMonth]);

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

  const handleDayPress = (day: DateData) => setSelectedDate(day.dateString);
  const handleMonthChange = (month: DateData) =>
    setCurrentMonth(month.dateString);

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
    const categoryColor = getTagColor(primaryTag);

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
          <IconImage source={getTagImage(primaryTag)} size={28} />
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
      title: "Khảo sát\ntính cách",
      subtitle: "Gợi ý quà phù hợp với nửa kia",
      color: COLORS.primary,
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
      color: COLORS.secondary,
      onPress: () =>
        navigation.navigate("ActivitySuggestions", {
          event: upcomingEvents[0] ?? events[0] ?? undefined,
        }),
    },
  ];

  return (
    <View style={styles.container}>
      <NotificationBanner message={message} image={image} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 56 },
        ]}
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
        {/* {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity
                style={styles.sectionHeaderLeft}
                onPress={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="alarm-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.sectionTitle}>Sự kiện sắp tới</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{upcomingEvents.length}</Text>
                </View>
                <Ionicons
                  name={isUpcomingExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("EventsList")}
              >
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {isUpcomingExpanded &&
              upcomingEvents.map((event) => {
                const primaryTag = event.tags?.[0] || "other";
                const categoryColor = getTagColor(primaryTag);
                const eventDate = new Date(event.eventDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysLeft = differenceInCalendarDays(eventDate, today);
                const daysLabel =
                  daysLeft === 0
                    ? "Hôm nay"
                    : daysLeft === 1
                    ? "Ngày mai"
                    : `${daysLeft} ngày`;

                return (
                  <PressableCard
                    key={event.id}
                    style={styles.upcomingCard}
                    onPress={() => handleEventPress(event)}
                  >
                    <View
                      style={[
                        styles.upcomingAccent,
                        { backgroundColor: categoryColor },
                      ]}
                    />
                    <View style={styles.upcomingBody}>
                      <View style={styles.upcomingTop}>
                        <View
                          style={[
                            styles.upcomingIconWrap,
                            { backgroundColor: categoryColor + "15" },
                          ]}
                        >
                          <IconImage source={getTagImage(primaryTag)} size={22} />
                        </View>
                        <View style={styles.upcomingInfo}>
                          <Text style={styles.upcomingTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                          <View style={styles.upcomingDateRow}>
                            <Ionicons
                              name="calendar-outline"
                              size={13}
                              color={COLORS.textSecondary}
                            />
                            <Text style={styles.upcomingDateText}>
                              {format(eventDate, "EEEE, d/MM", { locale: vi })}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            styles.upcomingCountdown,
                            daysLeft === 0 && styles.upcomingCountdownToday,
                          ]}
                        >
                          <Text
                            style={[
                              styles.upcomingCountdownText,
                              daysLeft === 0 &&
                                styles.upcomingCountdownTextToday,
                            ]}
                          >
                            {daysLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </PressableCard>
                );
              })}
          </View>
        )} */}

        {/* Local Shop Banner — hiện khi có sự kiện sắp tới */}
        {upcomingEvents.length > 0 && (
          <TouchableOpacity
            style={styles.shopBanner}
            onPress={() => navigation.navigate("LocalShop")}
            activeOpacity={0.85}
          >
            <Ionicons name="flower-outline" size={32} color={COLORS.primary} style={styles.shopBannerEmoji} />
            <View style={styles.shopBannerText}>
              <Text style={styles.shopBannerTitle}>
                Đặt hoa, bánh và quà giao tận nơi
              </Text>
              <Text style={styles.shopBannerSub}>
                Gợi ý hoàn hảo cho ngày đặc biệt sắp tới
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
          </TouchableOpacity>
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
                const dots: { color: string; image: any }[] = marking?.dots ?? [];

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
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="flash-outline" size={20} color={COLORS.primary} />
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
                style={[
                  styles.quickActionCard,
                  { backgroundColor: action.color },
                ]}
                onPress={action.onPress}
              >
                {/* Decorative circle top-right */}
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
              </PressableCard>
            ))}
          </ScrollView>
        </View>

        {/* Articles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="book-outline" size={20} color={COLORS.primary} />
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
                  name={articles[0].icon}
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
                      name={article.icon}
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
                      color={COLORS.textSecondary}
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
                <Ionicons name="trending-up" size={20} color={COLORS.primary} />
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
      <TouchableOpacity
        style={[styles.fab, { bottom: 20 + TAB_BAR_HEIGHT + insets.bottom }]}
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
    paddingTop: 0,
  },
  // Empty hint
  shopBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "25",
    elevation: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  shopBannerEmoji: {
    fontSize: 28,
  },
  shopBannerText: {
    flex: 1,
  },
  shopBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  shopBannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
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

  // Upcoming Event Card
  upcomingCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  upcomingAccent: {
    width: 4,
  },
  upcomingBody: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  upcomingTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  upcomingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  upcomingInfo: {
    flex: 1,
    marginRight: 8,
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  upcomingDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  upcomingDateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  },
  upcomingCountdown: {
    backgroundColor: COLORS.primary + "12",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  upcomingCountdownToday: {
    backgroundColor: COLORS.primary,
  },
  upcomingCountdownText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  upcomingCountdownTextToday: {
    color: COLORS.white,
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
  specialDateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: COLORS.shadow,
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
    fontWeight: "700",
    marginBottom: 3,
  },
  specialDateHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Quick Actions — full-color cards
  quickActionsScroll: {
    gap: 12,
  },
  quickActionCard: {
    width: 158,
    borderRadius: 18,
    padding: 16,
    minHeight: 148,
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
    fontWeight: "700",
    color: COLORS.white,
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
    marginTop: 10,
    alignSelf: "flex-end",
  },

  // Articles — featured hero + tile cards
  featuredArticle: {
    marginHorizontal: 4,
    borderRadius: 18,
    height: 168,
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
    fontWeight: "600",
    color: COLORS.white,
  },
  featuredTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.white,
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
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  featuredReadBtnText: {
    fontSize: 12,
    fontWeight: "700",
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
    width: 148,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  articleCardTop: {
    height: 60,
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
    fontWeight: "600",
    color: COLORS.textPrimary,
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
    color: COLORS.textSecondary,
  },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
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
