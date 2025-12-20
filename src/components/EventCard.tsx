import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../types';
import { DateUtils } from '../utils/date.utils';
import { COLORS, getCategoryColor } from '../constants/colors';
import ConfirmDialog from './ConfirmDialog';

interface EventCardProps {
  event: Event;
  onPress: (event: Event) => void;
  onDelete?: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress, onDelete }) => {
  const categoryColor = getCategoryColor(event.category);
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

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: categoryColor }]}
        onPress={() => onPress(event)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
            <Ionicons name={getCategoryIcon(event.category)} size={24} color={categoryColor} />
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
      </TouchableOpacity>

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
});

export default EventCard;
