import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@themes/colors";
import { makeStyles } from "@utils/makeStyles";
import { useColors } from "@contexts/ThemeContext";

const { width } = Dimensions.get("window");

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  duration = 3000,
  onHide,
}) => {
  const styles = useStyles();
  const colors = useColors();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Slide in and fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      handleHide();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) {
        onHide();
      }
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle" as const,
          color: colors.success,
          backgroundColor: colors.success,
        };
      case "error":
        return {
          icon: "close-circle" as const,
          color: colors.error,
          backgroundColor: colors.error,
        };
      case "warning":
        return {
          icon: "warning" as const,
          color: colors.warning,
          backgroundColor: colors.warning,
        };
      case "info":
        return {
          icon: "information-circle" as const,
          color: colors.info,
          backgroundColor: colors.info,
        };
      default:
        return {
          icon: "checkmark-circle" as const,
          color: colors.success,
          backgroundColor: colors.success,
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleHide}
        style={[
          styles.toast,
          {
            backgroundColor: colors.surface,
            borderLeftColor: config.color,
            shadowColor: config.color,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: config.color + '18' }]}>
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>
        <Text style={[styles.message, { color: colors.textPrimary }]}>
          {message}
        </Text>
        <TouchableOpacity onPress={handleHide} style={styles.closeButton}>
          <Ionicons name="close" size={18} color={colors.textLight} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
}));
export default Toast;
