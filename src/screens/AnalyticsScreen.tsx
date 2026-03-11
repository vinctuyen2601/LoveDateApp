import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { COLORS } from '@themes/colors';
import StatCard from '@components/atoms/StatCard';
import * as AnalyticsService from '../services/analytics.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 32;

const AnalyticsScreen: React.FC = () => {
  const db = useSQLiteContext();

  const [analytics, setAnalytics] = useState<AnalyticsService.AnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load analytics
  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await AnalyticsService.getDashboardAnalytics(db);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải thống kê...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="stats-chart-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>Không có dữ liệu thống kê</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thống kê</Text>
        <Text style={styles.headerSubtitle}>Tổng quan hoạt động của bạn</Text>
      </View>

      {/* Events Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Sự kiện</Text>
        </View>

        <StatCard
          title="Tổng số sự kiện"
          value={analytics.events.totalEvents}
          icon="calendar-outline"
          iconColor={COLORS.primary}
        />

        <View style={styles.row}>
          <View style={styles.halfCard}>
            <StatCard
              title="Sắp tới"
              value={analytics.events.upcomingEvents}
              icon="time-outline"
              iconColor={COLORS.warning}
            />
          </View>
          <View style={styles.halfCard}>
            <StatCard
              title="Đã qua"
              value={analytics.events.pastEvents}
              icon="checkmark-circle-outline"
              iconColor={COLORS.success}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfCard}>
            <StatCard
              title="Lặp lại"
              value={analytics.events.recurringEvents}
              icon="repeat-outline"
              iconColor={COLORS.secondary}
            />
          </View>
          <View style={styles.halfCard}>
            <StatCard
              title="Âm lịch"
              value={analytics.events.lunarCalendarEvents}
              icon="moon-outline"
              iconColor={COLORS.categoryHoliday}
            />
          </View>
        </View>
      </View>

      {/* Events by Tag Chart */}
      {analytics.events.eventsByTag.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pie-chart" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Phân loại sự kiện</Text>
          </View>

          <View style={styles.chartCard}>
            {analytics.events.eventsByTag.slice(0, 5).map((item, index) => (
              <View key={item.tag} style={styles.tagRow}>
                <View style={styles.tagInfo}>
                  <View
                    style={[
                      styles.tagDot,
                      { backgroundColor: getTagColor(item.tag, index) },
                    ]}
                  />
                  <Text style={styles.tagName}>{getTagDisplay(item.tag)}</Text>
                </View>
                <View style={styles.tagStats}>
                  <Text style={styles.tagCount}>{item.count}</Text>
                  <Text style={styles.tagPercentage}>
                    {formatPercentage((item.count / analytics.events.totalEvents) * 100)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Gift Statistics */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="gift" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Quà tặng</Text>
        </View>

        <StatCard
          title="Tổng chi tiêu"
          value={formatCurrency(analytics.gifts.totalSpent)}
          subtitle={`Trung bình: ${formatCurrency(analytics.gifts.averagePrice)}`}
          icon="wallet-outline"
          iconColor={COLORS.success}
        />

        <View style={styles.row}>
          <View style={styles.halfCard}>
            <StatCard
              title="Tổng quà"
              value={analytics.gifts.totalGifts}
              icon="gift-outline"
              iconColor={COLORS.categoryBirthday}
            />
          </View>
          <View style={styles.halfCard}>
            <StatCard
              title="Đã mua"
              value={analytics.gifts.purchasedGifts}
              icon="cart-outline"
              iconColor={COLORS.secondary}
            />
          </View>
        </View>

        {analytics.gifts.averageRating > 0 && (
          <StatCard
            title="Đánh giá trung bình"
            value={`${analytics.gifts.averageRating.toFixed(1)}/5.0`}
            subtitle="Mức độ hài lòng với quà tặng"
            icon="star-outline"
            iconColor={COLORS.warning}
          />
        )}
      </View>

      {/* Checklist Statistics */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkmark-done" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Checklist</Text>
        </View>

        <StatCard
          title="Tỷ lệ hoàn thành"
          value={formatPercentage(analytics.checklists.completionRate)}
          subtitle={`${analytics.checklists.completedItems}/${analytics.checklists.totalItems} việc`}
          icon="pie-chart-outline"
          iconColor={COLORS.success}
        />

        <View style={styles.row}>
          <View style={styles.halfCard}>
            <StatCard
              title="Tổng checklist"
              value={analytics.checklists.totalChecklists}
              icon="list-outline"
              iconColor={COLORS.primary}
            />
          </View>
          <View style={styles.halfCard}>
            <StatCard
              title="Hoàn thành"
              value={analytics.checklists.fullyCompletedEvents}
              icon="checkmark-circle-outline"
              iconColor={COLORS.success}
            />
          </View>
        </View>
      </View>

      {/* Notification Statistics */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Thông báo</Text>
        </View>

        <StatCard
          title="Tỷ lệ gửi thành công"
          value={formatPercentage(analytics.notifications.deliveryRate)}
          subtitle={`${analytics.notifications.totalDelivered}/${analytics.notifications.totalScheduled} thông báo`}
          icon="paper-plane-outline"
          iconColor={COLORS.success}
        />

        {analytics.notifications.totalFailed > 0 && (
          <StatCard
            title="Thất bại"
            value={analytics.notifications.totalFailed}
            subtitle="Số thông báo không gửi được"
            icon="alert-circle-outline"
            iconColor={COLORS.error}
          />
        )}
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

// Helper functions
const getTagColor = (tag: string, index: number): string => {
  const colors = [
    COLORS.categoryBirthday,
    COLORS.categoryAnniversary,
    COLORS.categoryHoliday,
    COLORS.primary,
    COLORS.secondary,
  ];
  return colors[index % colors.length];
};

const getTagDisplay = (tag: string): string => {
  const tagMap: Record<string, string> = {
    birthday: 'Sinh nhật',
    anniversary: 'Kỷ niệm',
    holiday: 'Ngày lễ',
    wife: 'Vợ',
    husband: 'Chồng',
    girlfriend: 'Bạn gái',
    boyfriend: 'Bạn trai',
    family: 'Gia đình',
    friend: 'Bạn bè',
    work: 'Công việc',
    other: 'Khác',
  };
  return tagMap[tag] || tag;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tagDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  tagName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  tagStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagCount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tagPercentage: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    minWidth: 50,
    textAlign: 'right',
  },
});

export default AnalyticsScreen;
