import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  Easing,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

interface NotificationBannerProps {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message,
  icon = "notifications",
}) => {
  const { width: screenWidth } = useWindowDimensions();

  // Animation values
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const translateX1 = useRef(new Animated.Value(0)).current;
  const translateX2 = useRef(new Animated.Value(screenWidth)).current;

  const [textWidth, setTextWidth] = useState(0);

  // Slide in animation on mount
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // Icon pulse animation
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  // Continuous marquee scroll animation
  useEffect(() => {
    if (textWidth === 0) return;

    // Calculate total distance: text needs to move completely off screen
    const totalDistance = textWidth + screenWidth;
    const duration = totalDistance * 30; // Increased from 15 to 30 (slower speed)
    const delayDuration = 10000; // 10 seconds delay before scrolling

    // Calculate when second text should appear
    // Second text starts when first text has moved half the screen
    const secondTextStartPosition = textWidth + screenWidth / 2;
    const timeToReachHalfScreen = (screenWidth / 2 / totalDistance) * duration;
    const secondTextDelay = delayDuration + timeToReachHalfScreen;

    // Reset positions
    translateX1.setValue(0);
    translateX2.setValue(secondTextStartPosition);

    // Animate first text with delay
    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.delay(delayDuration), // Wait 10 seconds before starting
        Animated.timing(translateX1, {
          toValue: -totalDistance,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    // Animate second text - starts later to maintain spacing
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.delay(secondTextDelay), // Calculated delay to maintain spacing
        Animated.timing(translateX2, {
          toValue: -totalDistance,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, [message, textWidth, screenWidth]);

  return (
    <Animated.View
      style={[
        styles.fixedNotificationBanner,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
        }}
      >
        <Ionicons name={icon} size={20} color={COLORS.white} />
      </Animated.View>

      <View style={styles.notificationScroll}>
        <Animated.Text
          style={[
            styles.fixedNotificationText,
            {
              transform: [{ translateX: translateX1 }],
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="clip"
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (textWidth === 0) {
              setTextWidth(width);
            }
          }}
        >
          {message}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.fixedNotificationText,
            {
              position: "absolute",
              transform: [{ translateX: translateX2 }],
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {message}
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fixedNotificationBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 12,
    gap: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  notificationScroll: {
    flex: 1,
    overflow: "hidden",
  },
  fixedNotificationText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "500",
  },
});

export default NotificationBanner;
