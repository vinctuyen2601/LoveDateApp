import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../../types';
import { DateUtils } from '@lib/date.utils';
import { COLORS, getCategoryColor } from '@themes/colors';
import ConfirmDialog from '@components/organisms/ConfirmDialog';
import CountdownTimer from '@components/molecules/CountdownTimer';
import PressableCard from '@components/atoms/PressableCard';

interface EventCardProps {
  event: Event;
  onPress: (event: Event) => void;
  onDelete?: (event: Event) => void;
  checklistProgress?: {
    completed: number;
    total: number;
  };
  showCountdown?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  onDelete,
  checklistProgress,
  showCountdown = false
}) => {
  // Get primary tag for color/icon (first tag in array)
  const primaryTag = event.tags[0] || 'other';
  const tagColor = getCategoryColor(primaryTag);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeletePress = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.(event);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const getTagIcon = (tags: string[]): keyof typeof Ionicons.glyphMap => {
    // Check for specific tags to determine icon
    if (tags.includes('birthday')) return 'gift';
    if (tags.includes('anniversary')) return 'heart';
    if (tags.includes('holiday')) return 'star';
    if (tags.includes('wife') || tags.includes('husband')) return 'heart-circle';
    if (tags.includes('family')) return 'people';
    return 'calendar';
  };

  return (
    <>
      <PressableCard
        style={[styles.card, { borderLeftColor: tagColor }]}
        onPress={() => onPress(event)}
      >
        <View style={styles.cardContent}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: tagColor + '20' }]}>
            <Ionicons name={getTagIcon(event.tags)} size={24} color={tagColor} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {event.title}
            </Text>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.dateText}>
                {DateUtils.getEventDateDisplay(event.eventDate)}
                {event.isLunarCalendar && <Text style={styles.lunarText}> (ÂL)</Text>}
              </Text>
            </View>

            {/* Countdown */}
            {showCountdown && (
              <View style={styles.countdownSection}>
                <CountdownTimer targetDate={event.eventDate} compact={true} />
              </View>
            )}

            {/* Checklist Progress */}
            {checklistProgress && checklistProgress.total > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(checklistProgress.completed / checklistProgress.total) * 100}%`,
                        backgroundColor: checklistProgress.completed === checklistProgress.total ? COLORS.success : tagColor,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {checklistProgress.completed === checklistProgress.total ? (
                    <>
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                      {' Đã hoàn thành'}
                    </>
                  ) : (
                    `${checklistProgress.completed}/${checklistProgress.total} việc`
                  )}
                </Text>
              </View>
            )}
          </View>

          {/* Delete button */}
          {onDelete && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDeletePress();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
      </PressableCard>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Xóa sự kiện"
        message={`Bạn có chắc muốn xóa "${event.title}"? Hành động này không thể hoàn tác.`}
        icon="trash"
        iconColor={COLORS.error}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  lunarText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.warning,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  countdownSection: {
    marginTop: 6,
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default React.memo(EventCard);
