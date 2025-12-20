import React, { useState } from 'react';
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
import { Event } from '../types';
import { DateUtils } from '../utils/date.utils';
import { COLORS, getCategoryColor, getRelationshipColor } from '../constants/colors';
import CountdownTimer from '../components/CountdownTimer';

const EventDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { getEventById, deleteEvent } = useEvents();
  const { eventId } = route.params;
  const event = getEventById(eventId);

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Không tìm thấy sự kiện</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const categoryColor = getCategoryColor(event.category);
  const relationshipColor = getRelationshipColor(event.relationshipType);

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    switch (category) {
      case 'birthday':
        return 'gift';
      case 'anniversary':
        return 'heart';
      case 'holiday':
        return 'star';
      default:
        return 'calendar';
    }
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'birthday':
        return 'Sinh nhật';
      case 'anniversary':
        return 'Kỷ niệm';
      case 'holiday':
        return 'Ngày lễ';
      default:
        return 'Khác';
    }
  };

  const getRelationshipLabel = (relationship: string): string => {
    const labels: Record<string, string> = {
      wife: 'Vợ',
      husband: 'Chồng',
      child: 'Con',
      parent: 'Cha mẹ',
      sibling: 'Anh chị em',
      friend: 'Bạn bè',
      colleague: 'Đồng nghiệp',
      other: 'Khác',
    };
    return labels[relationship] || relationship;
  };

  const handleEdit = () => {
    navigation.navigate('AddEvent', { eventId: event.id });
  };

  const handleDelete = () => {
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
              navigation.goBack();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa sự kiện');
            }
          },
        },
      ]
    );
  };

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

        <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: categoryColor + '15' }]}>
          <View style={[styles.heroIcon, { backgroundColor: categoryColor + '30' }]}>
            <Ionicons name={getCategoryIcon(event.category)} size={48} color={categoryColor} />
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryBadgeText}>{getCategoryLabel(event.category)}</Text>
          </View>
        </View>

        {/* Countdown Section */}
        <View style={styles.section}>
          <View style={styles.countdownCard}>
            <CountdownTimer targetDate={event.eventDate} compact={false} />
          </View>
        </View>

        {/* Date Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Thông tin ngày</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày diễn ra</Text>
                <Text style={styles.infoValue}>
                  {DateUtils.getEventDateDisplay(event.eventDate)}
                </Text>
              </View>
            </View>

            {event.isLunarCalendar && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="moon-outline" size={20} color={COLORS.warning} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Loại lịch</Text>
                  <Text style={styles.infoValue}>Âm lịch</Text>
                </View>
              </View>
            )}

            {event.isRecurring && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="repeat-outline" size={20} color={COLORS.success} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Lặp lại</Text>
                  <Text style={styles.infoValue}>Hàng năm</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Relationship Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Mối quan hệ</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.relationshipPill, { backgroundColor: relationshipColor + '20', borderColor: relationshipColor + '40' }]}>
              <Ionicons name="person" size={20} color={relationshipColor} />
              <Text style={[styles.relationshipText, { color: relationshipColor }]}>
                {getRelationshipLabel(event.relationshipType)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {event.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Mô tả</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          </View>
        )}

        {/* Reminder Settings */}
        {event.reminderSettings.remindDaysBefore.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Nhắc nhở</Text>
            </View>

            <View style={styles.infoCard}>
              {event.reminderSettings.remindDaysBefore.map((days, index) => (
                <View key={index} style={styles.reminderItem}>
                  <Ionicons name="alarm-outline" size={18} color={COLORS.info} />
                  <Text style={styles.reminderText}>
                    {days === 0 ? 'Trong ngày' : `${days} ngày trước`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Gift Ideas */}
        {event.giftIdeas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="gift" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Ý tưởng quà tặng</Text>
            </View>

            <View style={styles.infoCard}>
              {event.giftIdeas.map((gift, index) => (
                <View key={index} style={styles.giftItem}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text style={styles.giftText}>{gift}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {event.notes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book" size={22} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Ghi chú các năm</Text>
            </View>

            {event.notes.map((note, index) => (
              <View key={index} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <Text style={styles.noteYear}>Năm {note.year}</Text>
                </View>
                {note.gift && (
                  <View style={styles.noteRow}>
                    <Ionicons name="gift-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.noteLabel}>Quà tặng: </Text>
                    <Text style={styles.noteValue}>{note.gift}</Text>
                  </View>
                )}
                {note.activity && (
                  <View style={styles.noteRow}>
                    <Ionicons name="star-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.noteLabel}>Hoạt động: </Text>
                    <Text style={styles.noteValue}>{note.activity}</Text>
                  </View>
                )}
                {note.note && (
                  <View style={styles.noteRow}>
                    <Ionicons name="document-text-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.noteLabel}>Ghi chú: </Text>
                    <Text style={styles.noteValue}>{note.note}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metadataSection}>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Được tạo</Text>
            <Text style={styles.metadataValue}>
              {new Date(event.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Cập nhật lần cuối</Text>
            <Text style={styles.metadataValue}>
              {new Date(event.updatedAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>

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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  countdownCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  relationshipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  relationshipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  reminderText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  giftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  giftText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  noteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  noteHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  noteYear: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  noteValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  metadataSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metadataLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  metadataValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventDetailScreen;
