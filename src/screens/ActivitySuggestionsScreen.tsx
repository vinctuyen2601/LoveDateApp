import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { ActivitySuggestion } from '../types';
import { COLORS } from '../constants/colors';
import ActivityCard from '../components/ActivityCard';
import * as ActivityService from '../services/activitySuggestion.service';

type TabType = 'restaurant' | 'activity' | 'location';

const ActivitySuggestionsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const db = useSQLiteContext();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('restaurant');
  const [activities, setActivities] = useState<ActivitySuggestion[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number>(0);

  // Load activities
  const loadActivities = async (category: TabType) => {
    try {
      setIsLoading(true);
      const results = await ActivityService.getActivitiesByCategory(db, category);
      setActivities(results);
      setFilteredActivities(results);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadActivities(activeTab);
  }, [activeTab]);

  // Apply filters
  useEffect(() => {
    let filtered = [...activities];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(query) ||
          activity.description?.toLowerCase().includes(query) ||
          activity.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Price range filter
    if (selectedPriceRange) {
      filtered = filtered.filter((activity) => activity.priceRange === selectedPriceRange);
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter((activity) =>
        activity.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter((activity) => (activity.rating || 0) >= minRating);
    }

    setFilteredActivities(filtered);
  }, [searchQuery, selectedPriceRange, selectedLocation, minRating, activities]);

  // Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadActivities(activeTab);
    setIsRefreshing(false);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPriceRange(null);
    setSelectedLocation(null);
    setMinRating(0);
  };

  const hasActiveFilters =
    searchQuery || selectedPriceRange || selectedLocation || minRating > 0;

  // Get unique locations for filter
  const availableLocations = Array.from(
    new Set(activities.map((a) => a.location).filter(Boolean))
  ).slice(0, 5);

  // Tab configuration
  const tabs: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'restaurant', label: 'Nhà hàng', icon: 'restaurant' },
    { key: 'activity', label: 'Hoạt động', icon: 'game-controller' },
    { key: 'location', label: 'Địa điểm', icon: 'location' },
  ];

  const priceRanges = ['₫', '₫₫', '₫₫₫', '₫₫₫₫'];
  const ratingOptions = [4.5, 4.0, 3.5];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gợi ý hoạt động</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textSecondary}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? COLORS.white : COLORS.textSecondary}
            />
            <Text
              style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {/* Price Range Filter */}
        {activeTab === 'restaurant' && (
          <>
            {priceRanges.map((price) => (
              <TouchableOpacity
                key={price}
                style={[
                  styles.filterChip,
                  selectedPriceRange === price && styles.filterChipActive,
                ]}
                onPress={() =>
                  setSelectedPriceRange(selectedPriceRange === price ? null : price)
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedPriceRange === price && styles.filterChipTextActive,
                  ]}
                >
                  {price}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Rating Filter */}
        {ratingOptions.map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[styles.filterChip, minRating === rating && styles.filterChipActive]}
            onPress={() => setMinRating(minRating === rating ? 0 : rating)}
          >
            <Ionicons
              name="star"
              size={14}
              color={
                minRating === rating ? COLORS.white : COLORS.warning
              }
            />
            <Text
              style={[
                styles.filterChipText,
                minRating === rating && styles.filterChipTextActive,
              ]}
            >
              {rating}+
            </Text>
          </TouchableOpacity>
        ))}

        {/* Location Filter */}
        {availableLocations.map((location) => (
          <TouchableOpacity
            key={location}
            style={[
              styles.filterChip,
              selectedLocation === location && styles.filterChipActive,
            ]}
            onPress={() =>
              setSelectedLocation(selectedLocation === location ? null : location!)
            }
          >
            <Text
              style={[
                styles.filterChipText,
                selectedLocation === location && styles.filterChipTextActive,
              ]}
            >
              {location}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Ionicons name="close-circle" size={16} color={COLORS.error} />
            <Text style={styles.clearFiltersText}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
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
          {/* Results Count */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {filteredActivities.length} kết quả
            </Text>
          </View>

          {/* Activity List */}
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                showBookingButton={true}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="sad-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
                  <Text style={styles.emptyButtonText}>Xóa bộ lọc</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
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
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.white,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default ActivitySuggestionsScreen;
