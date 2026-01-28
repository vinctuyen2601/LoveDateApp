import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useEvents } from '../store/EventsContext';
import { useToast } from '../contexts/ToastContext';
import { Event } from '../types';
import { COLORS } from '../constants/colors';
import EventCard from '../components/EventCard';

type FilterType = 'all' | 'upcoming' | 'past' | 'birthday' | 'anniversary' | 'holiday' | 'other';

interface RouteParams {
  filter?: FilterType;
  title?: string;
}

const EventsListScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { events, deleteEvent } = useEvents();
  const { showSuccess, showError } = useToast();

  const params: RouteParams = route.params || {};
  const initialFilter = params.filter || 'all';
  const screenTitle = params.title || 'Tất cả sự kiện';

  const [selectedFilter, setSelectedFilter] = useState<FilterType>(initialFilter);
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  // Filter events based on selected filter
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (selectedFilter) {
      case 'upcoming':
        filtered = filtered.filter((event) => {
          const eventDate = new Date(event.eventDate);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        });
        break;
      case 'past':
        filtered = filtered.filter((event) => {
          const eventDate = new Date(event.eventDate);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate < today;
        });
        break;
      case 'birthday':
      case 'anniversary':
      case 'holiday':
      case 'other':
        filtered = filtered.filter((event) => event.tags.includes(selectedFilter));
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
  }, [events, selectedFilter, sortBy]);

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  const handleEventDelete = async (event: Event) => {
    Alert.alert(
      'Xóa sự kiện',
      `Bạn có chắc muốn xóa "${event.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              showSuccess(`Đã xóa sự kiện "${event.title}"`);
            } catch (error) {
              showError('Không thể xóa sự kiện');
            }
          },
        },
      ]
    );
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
        return 'Tất cả';
      case 'upcoming':
        return 'Sắp tới';
      case 'past':
        return 'Đã qua';
      case 'birthday':
        return 'Sinh nhật';
      case 'anniversary':
        return 'Kỷ niệm';
      case 'holiday':
        return 'Ngày lễ';
      case 'other':
        return 'Khác';
      default:
        return 'Tất cả';
    }
  };

  const filters: FilterType[] = ['all', 'upcoming', 'past', 'birthday', 'anniversary', 'holiday', 'other'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{screenTitle}</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('AddEvent')}
        >
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
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
                color={selectedFilter === filter ? COLORS.white : COLORS.textSecondary}
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
          <Ionicons name="list" size={16} color={COLORS.textSecondary} />
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
            color={COLORS.primary}
          />
          <Text style={styles.sortButtonText}>
            {sortBy === 'date' ? 'Ngày' : 'Tên'}
          </Text>
          <Ionicons name="swap-vertical" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredEvents.length > 0 ? (
          <View style={styles.eventsList}>
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => handleEventPress(event)}
                onDelete={() => handleEventDelete(event)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={80}
              color={COLORS.textLight}
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
              <Ionicons name="add-circle" size={20} color={COLORS.white} />
              <Text style={styles.addButtonText}>Thêm sự kiện</Text>
            </TouchableOpacity>
          </View>
        )}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
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
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventsListScreen;
