import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  Easing,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from '@themes/colors';

interface NotificationBannerProps {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const SCROLL_SPEED = 50; // px per second
const GAP = 100; // spacing between two copies

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message,
  icon = "notifications",
  dismissible = true,
  onDismiss,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [textWidth, setTextWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  // Slide in
  useEffect(() => {
    if (message && !isDismissed) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [message, isDismissed]);

  // Marquee: always scroll
  useEffect(() => {
    animRef.current?.stop();
    scrollAnim.setValue(0);

    if (textWidth <= 0) return;

    const oneLoopDistance = textWidth + GAP;
    const duration = (oneLoopDistance / SCROLL_SPEED) * 1000;

    animRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(scrollAnim, {
          toValue: -oneLoopDistance,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    animRef.current.start();

    return () => {
      animRef.current?.stop();
    };
  }, [textWidth, message]);

  const handleDismiss = () => {
    animRef.current?.stop();
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsDismissed(true);
      onDismiss?.();
    });
  };

  if (!message || isDismissed) return null;

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
    >
      <Ionicons name={icon} size={18} color={COLORS.white} />

      {/* Hidden: measure real text width */}
      <Text
        style={styles.hiddenText}
        onLayout={(e) => setTextWidth(Math.ceil(e.nativeEvent.layout.width))}
      >
        {message}
      </Text>

      <View style={styles.textContainer}>
        <Animated.View
          style={[
            styles.textRow,
            { transform: [{ translateX: scrollAnim }] },
          ]}
        >
          <Text style={styles.text}>{message}</Text>
          <View style={{ width: GAP }} />
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      </View>

      {dismissible && (
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 10,
    paddingBottom: 10,
    gap: 10,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  hiddenText: {
    position: "absolute",
    opacity: 0,
    fontSize: 13,
    fontWeight: "500",
  },
  textContainer: {
    flex: 1,
    overflow: "hidden",
    height: 20,
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
  },
  text: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: "500",
  },
  dismissButton: {
    padding: 4,
    opacity: 0.8,
  },
});

export default NotificationBanner;
