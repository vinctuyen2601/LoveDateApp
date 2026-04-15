import React, { useEffect, useRef } from "react";
import { Animated, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { makeStyles } from "@utils/makeStyles";
import { useColors } from "@contexts/ThemeContext";
import { Text } from "react-native";
import AiIcon from "./AiIcon";

interface AiViewAllBtnProps {
  onPress: () => void;
  label?: string;
}

const useStyles = makeStyles((colors) => ({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: "Manrope_600SemiBold",
    color: colors.white,
  },
}));

const AiViewAllBtn: React.FC<AiViewAllBtnProps> = ({
  onPress,
  label = "Gợi ý AI",
}) => {
  const colors = useColors();
  const styles = useStyles();
  const arrowX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowX, {
          toValue: 5,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(arrowX, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={[colors.aiPrimary, colors.aiSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btn}
        >
          <AiIcon size={14} primaryColor={colors.aiPrimary} secondaryColor={colors.aiSecondary} />
          <Text style={styles.label}>{label}</Text>
          <Animated.View style={{ transform: [{ translateX: arrowX }] }}>
            <Ionicons name="arrow-forward" size={13} color={colors.white} />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AiViewAllBtn;
