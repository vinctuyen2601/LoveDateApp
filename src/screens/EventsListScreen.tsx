import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import ConfirmDialog from '@components/organisms/ConfirmDialog';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useEvents } from '@contexts/EventsContext';
import { useToast } from '../contexts/ToastContext';
import { Event, getTagLabel } from '../types';
import { COLORS } from '@themes/colors';
import EventCard from '@components/molecules/EventCard';
import IconImage from '@components/atoms/IconImage';
import { getSpecialDatesForMonth } from '../constants/specialDates';
import { getSpecialDateImage } from '@lib/iconImages';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';
import { getOccurrencesInMonth } from '@utils/recurrence';

type FilterType = 'all' | 'upcoming' | 'past' | 'birthday' | 'anniversary' | 'holiday' | 'other';

interface RouteParams {
  filter?: FilterType;
  title?: string;
  month?: string; // e.g. '2026-03-01' — filter events to this month only
}

const EventsListScreen: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();

  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { events, deleteEvent, toggleEventNotification } = useEvents();
  const { showSuccess, showError } = useToast();

  const params: RouteParams = route.params || {};
  const initialFilter = params.filter || 'all';
  const filterMonth = params.month; // optional month scope from CalendarScreen

  const screenTitle = (() => {
    const base = params.title || 'Sự kiện của tôi';
    if (!filterMonth) return base;
    const d = new Date(filterMonth);
    return `${base} ${d.getMonth() + 1}/${d.getFullYear()}`;
  })();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>(initialFilter);
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean; title: string; message: string; onConfirm: () => void;
  }>({ visible: false, title: '', message: '', onConfirm: () => {} });
  const closeConfirm = () => setConfirmDialog((d) => ({ ...d, visible: false }));

  // Filter events based on selected filter
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Scope to a specific month if passed from CalendarScreen
    if (filterMonth) {
      const monthDate = new Date(filterMonth);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      filtered = filtered.filter((event) => {
        if (!event.eventDate) return false;
        const d = new Date(event.eventDate);
        if (isNaN(d.getTime())) return false;
        if (event.isRecurring) return getOccurrencesInMonth(event, year, month).length > 0;
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For recurring events in a month-scoped view, compare against their occurrence
    // in the filtered year rather than the original eventDate year
    const getEffectiveDate = (event: Event): Date => {
      const d = new Date(event.eventDate);
      if (event.isRecurring && filterMonth) {
        const filterYear = new Date(filterMonth).getFullYear();
        return new Date(filterYear, d.getMonth(), d.getDate(),
          d.getHours(), d.getMinutes(), d.getSeconds());
      }
      return d;
    };

    switch (selectedFilter) {
      case 'upcoming':
        filtered = filtered.filter((event) => {
          const eventDate = getEffectiveDate(event);
          const eventDateDay = new Date(eventDate);
          eventDateDay.setHours(0, 0, 0, 0);

          if (eventDateDay > today) return true;

          if (eventDateDay.getTime() === today.getTime()) {
            if (event.isRecurring) return true;
            const now = new Date();
            const reminderTime = event.reminderSettings?.reminderTime;
            if (!reminderTime) return eventDate >= now;
            const reminderDate = new Date(eventDate);
            reminderDate.setHours(reminderTime.hour, reminderTime.minute, 0, 0);
            return reminderDate > now;
          }
          return false;
        });
        break;
      case 'past':
        filtered = filtered.filter((event) => {
          const eventDate = getEffectiveDate(event);
          const eventDateDay = new Date(eventDate);
          eventDateDay.setHours(0, 0, 0, 0);

          if (eventDateDay < today) return true;

          if (eventDateDay.getTime() === today.getTime()) {
            if (event.isRecurring) return false;
            const now = new Date();
            const reminderTime = event.reminderSettings?.reminderTime;
            if (!reminderTime) return eventDate < now;
            const reminderDate = new Date(eventDate);
            reminderDate.setHours(reminderTime.hour, reminderTime.minute, 0, 0);
            return reminderDate <= now;
          }
          return false;
        });
        break;
      case 'birthday':
      case 'anniversary':
      case 'holiday':
        filtered = filtered.filter((event) => event.tags.includes(selectedFilter));
        break;
      case 'other':
        filtered = filtered.filter((event) =>
          !event.tags.some((tag) => ['birthday', 'anniversary', 'holiday'].includes(tag))
        );
        break;
      case 'all':
      default:
        break;
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    } else {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [events, selectedFilter, sortBy, filterMonth]);

  // System special dates for the filtered month, further filtered by selectedFilter
  const filteredSpecialDates = useMemo(() => {
    if (!filterMonth) return [];
    const monthDate = new Date(filterMonth);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1; // 1-based
    const all = getSpecialDatesForMonth(year, month);

    if (selectedFilter === 'all') return all;
    if (selectedFilter === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      if (year > todayYear || (year === todayYear && month > todayMonth)) return all;
      if (year === todayYear && month === todayMonth)
        return all.filter((sd) => sd.solarDay >= todayDay);
      return [];
    }
    if (selectedFilter === 'past') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      if (year < todayYear || (year === todayYear && month < todayMonth)) return all;
      if (year === todayYear && month === todayMonth)
        return all.filter((sd) => sd.solarDay < todayDay);
      return [];
    }
    // birthday/anniversary/holiday/other — special dates don't have tags, hide them
    return [];
  }, [filterMonth, selectedFilter]);

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  const handleToggleNotification = async (event: Event) => {
    try {
      await toggleEventNotification(event.id);
      showSuccess(
        event.isNotificationEnabled !== false
          ? `Đã tắt thông báo "${event.title}"`
          : `Đã bật thông báo "${event.title}"`
      );
    } catch {
      showError('Không thể thay đổi thông báo');
    }
  };

  const handleEventDelete = async (event: Event) => {
    setConfirmDialog({
      visible: true,
      title: 'Xóa sự kiện',
      message: `Bạn có chắc muốn xóa "${event.title}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        closeConfirm();
        try {
          await deleteEvent(event.id);
          showSuccess(`Đã xóa sự kiện "${event.title}"`);
        } catch (error) {
          showError('Không thể xóa sự kiện');
        }
      },
    });
  };

  const getFilterIcon = (filter: FilterType): keyof typeof Ionicons.glyphMap => {
    switch (filter) {
      case 'all':
        return 'list';
      case 'upcoming':
        return 'arrow-up-circle';
      case 'past':
        return 'time';
      case 'birthday':
        return 'gift';
      case 'anniversary':
        return 'heart';
      case 'holiday':
        return 'star';
      case 'other':
        return 'ellipsis-horizontal-circle';
      default:
        return 'list';
    }
  };

  const getFilterLabel = (filter: FilterType): string => {
    switch (filter) {
      case 'all':
        return 'Sự kiện của tôi';
      case 'upcoming':
        return 'Sắp tới';
      case 'past':
        return 'Đã qua';
      default:
        return getTagLabel(filter);
    }
  };

  const monthRelation = (() => {
    if (!filterMonth) return 'current';
    const d = new Date(filterMonth);
    const today = new Date();
    const diffMonths = (d.getFullYear() - today.getFullYear()) * 12 + (d.getMonth() - today.getMonth());
    if (diffMonths > 0) return 'future';
    if (diffMonths < 0) return 'past';
    return 'current';
  })();

  const filters: FilterType[] = [
    'all',
    ...(monthRelation !== 'past' ? ['upcoming' as FilterType] : []),
    ...(monthRelation !== 'future' ? ['past' as FilterType] : []),
    'birthday', 'anniversary', 'holiday', 'other',
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{screenTitle}</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('AddEvent')}
        >
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Ionicons
                name={getFilterIcon(filter)}
                size={18}
                color={selectedFilter === filter ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter && styles.filterTabTextActive,
                ]}
              >
                {getFilterLabel(filter)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats & Sort */}
      <View style={styles.controlsContainer}>
        <View style={styles.statsRow}>
          <Ionicons name="list" size={16} color={colors.textSecondary} />
          <Text style={styles.statsText}>
            {filteredEvents.length} sự kiện
          </Text>
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortBy(sortBy === 'date' ? 'name' : 'date')}
        >
          <Ionicons
            name={sortBy === 'date' ? 'calendar' : 'text'}
            size={16}
            color={colors.white}
          />
          <Text style={styles.sortButtonText}>
            {sortBy === 'date' ? 'Ngày' : 'Tên'}
          </Text>
          <Ionicons name="swap-vertical" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {(filteredEvents.length > 0 || filteredSpecialDates.length > 0) ? (
          <View style={styles.eventsList}>
            {/* System special dates */}
            {filteredSpecialDates.map((sd) => (
              <View key={sd.id} style={styles.specialDateCard}>
                <View style={[styles.specialDateAccent, { backgroundColor: sd.color }]} />
                <IconImage source={getSpecialDateImage(sd.id)} size={28} />
                <View style={styles.specialDateInfo}>
                  <Text style={styles.specialDateName}>{sd.name}</Text>
                  <Text style={styles.specialDateSub}>
                    {sd.solarDay}/{sd.solarMonth} · Ngày đặc biệt
                  </Text>
                </View>
              </View>
            ))}
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => handleEventPress(event)}
                onDelete={() => handleEventDelete(event)}
                onToggleNotification={() => handleToggleNotification(event)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={80}
              color={colors.textLight}
            />
            <Text style={styles.emptyText}>Không có sự kiện nào</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === 'all'
                ? 'Chưa có sự kiện nào được tạo'
                : `Không có sự kiện ${getFilterLabel(selectedFilter).toLowerCase()}`}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddEvent')}
            >
              <Ionicons name="add-circle" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Thêm sự kiện</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Xóa"
        icon="trash-outline"
        iconColor={colors.error}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersScroll: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.white,
    fontFamily: 'Manrope_600SemiBold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Manrope_500Medium',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 13,
    color: colors.white,
    fontFamily: 'Manrope_600SemiBold',
  },
  content: {
    flex: 1,
  },
  eventsList: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textSecondary,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Manrope_600SemiBold',
  },
  specialDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    padding: 12,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  specialDateAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  specialDateInfo: {
    flex: 1,
  },
  specialDateName: {
    fontSize: 15,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
  },
  specialDateSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
}));export default EventsListScreen;
