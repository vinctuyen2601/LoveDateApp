import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Animated,
  Text,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@themes/colors";

interface NotificationBannerProps {
  message: string;
  image?: ImageSourcePropType;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message,
  image,
  dismissible = true,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const [isDismissed, setIsDismissed] = useState(false);
  const slideAnim = useRef(new Animated.Value(-120)).current;

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

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
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
      style={[
        styles.banner,
        { paddingTop: insets.top + 10, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.text}>
        {message}
        {image ? " " : ""}
        {image && <Image source={image} style={styles.inlineIcon} />}
      </Text>
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
    alignItems: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: COLORS.white,
    fontWeight: "500",
    lineHeight: 18,
  },
  inlineIcon: {
    width: 18,
    height: 18,
  },
  dismissButton: {
    padding: 4,
    opacity: 0.8,
    marginTop: 1,
  },
});

export default NotificationBanner;
