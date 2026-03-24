import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivitySuggestion } from '../../types';
import { COLORS } from '@themes/colors';
import PressableCard from '@components/atoms/PressableCard';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

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
  const styles = useStyles();
  const colors = useColors();

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
        return colors.categoryBirthday; // Red-ish
      case 'activity':
        return colors.categoryAnniversary; // Pink
      case 'location':
        return colors.categoryHoliday; // Purple
      default:
        return colors.primary;
    }
  };

  const getPriceDisplay = (): string => {
    if (!activity.priceRange) return '';
    return activity.priceRange;
  };

  const categoryColor = getCategoryColor();

  return (
    <PressableCard
      style={[styles.card, { borderLeftColor: categoryColor }]}
      onPress={() => onPress?.(activity)}
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
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
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
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={styles.metaText}>{Number(activity.rating).toFixed(1)}</Text>
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
                <Ionicons name="call-outline" size={16} color={colors.white} />
                <Text style={styles.actionButtonText}>Gọi</Text>
              </TouchableOpacity>
            )}
            {showBookingButton && activity.bookingUrl && (
              <TouchableOpacity
                style={[styles.actionButton, styles.bookButton]}
                onPress={handleBooking}
              >
                <Ionicons name="open-outline" size={16} color={colors.white} />
                <Text style={styles.actionButtonText}>Đặt chỗ</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </PressableCard>
  );
};

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: colors.border,
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
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
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
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: colors.success,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: colors.primary,
    fontFamily: 'Manrope_500Medium',
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
    backgroundColor: colors.success,
  },
  bookButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.white,
  },
}));export default ActivityCard;
