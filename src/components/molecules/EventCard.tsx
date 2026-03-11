import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event, getTagLabel, getTagIcon, getTagColor } from '../../types';
import { DateUtils } from '@lib/date.utils';
import { COLORS } from '@themes/colors';
import ConfirmDialog from '@components/organisms/ConfirmDialog';
import CountdownTimer from '@components/molecules/CountdownTimer';


interface EventCardProps {
  event: Event;
  onPress: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onToggleNotification?: (event: Event) => void;
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
  onToggleNotification,
  checklistProgress,
  showCountdown = false
}) => {
  const primaryTag = event.tags[0] || 'other';
  const tagColor = getTagColor(primaryTag);
  const tagLabel = getTagLabel(primaryTag);
  const tagIcon = getTagIcon(primaryTag);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.(event);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => onPress(event)}
      >
        <View style={[styles.accent, { backgroundColor: tagColor }]} />
        <View style={styles.body}>
          {/* Main row */}
          <View style={styles.mainRow}>
            <View style={[styles.iconWrap, { backgroundColor: tagColor + '15' }]}>
              <Ionicons name={tagIcon as any} size={24} color={tagColor} />
            </View>
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.dateText}>
                  {DateUtils.getEventDateDisplay(event.eventDate)}
                  {event.isLunarCalendar ? ' (ÂL)' : ''}
                </Text>
                <View style={styles.dot} />
                <View style={[styles.tagPill, { backgroundColor: tagColor + '15' }]}>
                  <Text style={[styles.tagPillText, { color: tagColor }]}>{tagLabel}</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </View>

          {/* Badges row */}
          <View style={styles.badgesRow}>
            {event.isRecurring && (
              <View style={styles.badge}>
                <Ionicons name="repeat" size={12} color={COLORS.textSecondary} />
                <Text style={styles.badgeText}>Hàng năm</Text>
              </View>
            )}
            {event.isNotificationEnabled === false && (
              <View style={styles.badge}>
                <Ionicons name="notifications-off-outline" size={12} color={COLORS.textLight} />
                <Text style={[styles.badgeText, { color: COLORS.textLight }]}>Tắt thông báo</Text>
              </View>
            )}

            {/* Countdown */}
            {showCountdown && (
              <View style={styles.badge}>
                <CountdownTimer targetDate={event.eventDate} compact={true} />
              </View>
            )}

            {/* Spacer to push actions right */}
            <View style={{ flex: 1 }} />

            {/* Actions */}
            {onToggleNotification && (
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); onToggleNotification(event); }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.actionBtn}
              >
                <Ionicons
                  name={event.isNotificationEnabled !== false ? 'notifications' : 'notifications-off-outline'}
                  size={18}
                  color={event.isNotificationEnabled !== false ? COLORS.primary : COLORS.textLight}
                />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.actionBtn}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>

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
                {checklistProgress.completed === checklistProgress.total
                  ? 'Đã hoàn thành'
                  : `${checklistProgress.completed}/${checklistProgress.total} việc`}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Xóa sự kiện"
        message={`Bạn có chắc muốn xóa "${event.title}"? Hành động này không thể hoàn tác.`}
        icon="trash"
        iconColor={COLORS.error}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 8,
    marginVertical: 5,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 14,
    paddingLeft: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  content: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textLight,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginLeft: 64,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  actionBtn: {
    padding: 4,
  },
  progressSection: {
    marginTop: 8,
    marginLeft: 64,
    marginRight: 4,
  },
  progressBar: {
    height: 5,
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
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default React.memo(EventCard);
