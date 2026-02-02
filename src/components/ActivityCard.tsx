import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivitySuggestion } from '../types';
import { COLORS } from '../constants/colors';

interface ActivityCardProps {
  activity: ActivitySuggestion;
  onPress?: (activity: ActivitySuggestion) => void;
  showBookingButton?: boolean;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onPress,
  showBookingButton = true,
}) => {
  const handleBooking = async () => {
    if (activity.bookingUrl) {
      try {
        const supported = await Linking.canOpenURL(activity.bookingUrl);
        if (supported) {
          await Linking.openURL(activity.bookingUrl);
        } else {
          console.warn('Cannot open URL:', activity.bookingUrl);
        }
      } catch (error) {
        console.error('Error opening booking URL:', error);
      }
    }
  };

  const handleCall = async () => {
    if (activity.phoneNumber) {
      try {
        const phoneUrl = `tel:${activity.phoneNumber}`;
        const supported = await Linking.canOpenURL(phoneUrl);
        if (supported) {
          await Linking.openURL(phoneUrl);
        }
      } catch (error) {
        console.error('Error opening phone dialer:', error);
      }
    }
  };

  const getCategoryIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (activity.category) {
      case 'restaurant':
        return 'restaurant';
      case 'activity':
        return 'game-controller';
      case 'location':
        return 'location';
      default:
        return 'star';
    }
  };

  const getCategoryColor = (): string => {
    switch (activity.category) {
      case 'restaurant':
        return COLORS.categoryBirthday; // Red-ish
      case 'activity':
        return COLORS.categoryAnniversary; // Pink
      case 'location':
        return COLORS.categoryHoliday; // Purple
      default:
        return COLORS.primary;
    }
  };

  const getPriceDisplay = (): string => {
    if (!activity.priceRange) return '';
    return activity.priceRange;
  };

  const categoryColor = getCategoryColor();

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: categoryColor }]}
      onPress={() => onPress?.(activity)}
      activeOpacity={0.7}
    >
      {/* Image */}
      {activity.imageUrl && (
        <Image
          source={{ uri: activity.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}15` }]}>
            <Ionicons name={getCategoryIcon()} size={20} color={categoryColor} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.name} numberOfLines={2}>
              {activity.name}
            </Text>
            {activity.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.location}>{activity.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {activity.description && (
          <Text style={styles.description} numberOfLines={2}>
            {activity.description}
          </Text>
        )}

        {/* Meta Info */}
        <View style={styles.metaRow}>
          {/* Rating */}
          {activity.rating && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color={COLORS.warning} />
              <Text style={styles.metaText}>{activity.rating.toFixed(1)}</Text>
            </View>
          )}

          {/* Price Range */}
          {activity.priceRange && (
            <View style={styles.metaItem}>
              <Text style={styles.priceText}>{getPriceDisplay()}</Text>
            </View>
          )}

          {/* Tags */}
          {activity.tags && activity.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {activity.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Actions */}
        {(showBookingButton || activity.phoneNumber) && (
          <View style={styles.actionsRow}>
            {activity.phoneNumber && (
              <TouchableOpacity
                style={[styles.actionButton, styles.callButton]}
                onPress={handleCall}
              >
                <Ionicons name="call-outline" size={16} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Gọi</Text>
              </TouchableOpacity>
            )}
            {showBookingButton && activity.bookingUrl && (
              <TouchableOpacity
                style={[styles.actionButton, styles.bookButton]}
                onPress={handleBooking}
              >
                <Ionicons name="open-outline" size={16} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Đặt chỗ</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.border,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  callButton: {
    backgroundColor: COLORS.success,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default ActivityCard;
