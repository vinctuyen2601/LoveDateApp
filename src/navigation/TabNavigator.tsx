import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated as RNAnimated,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
} from "react-native-reanimated";
import { Svg, Path, Defs, Filter, FeDropShadow } from "react-native-svg";
import { COLORS } from "@themes/colors";
import HomeScreen from "../screens/HomeScreen";
import CalendarScreen from "../screens/CalendarScreen";
import SuggestionsScreen from "../screens/SuggestionsScreen";
import ConnectionsScreen from "../screens/ConnectionsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { makeStyles } from "@utils/makeStyles";
import { useColors } from "@contexts/ThemeContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const SCREEN_W = Dimensions.get("window").width;
const BAR_W = SCREEN_W;
const ROW_PAD = 8;
const TAB_W = (BAR_W - ROW_PAD * 2) / 5;
const BUMP_H = 14;
const BAR_H = 62;
const TOTAL_H = BUMP_H + BAR_H;
const HW = TAB_W * 0.6; // hill half-width

// ─── Rounded-rect + hill path (worklet) ──────────────────────────────────────
function makePath(cx: number): string {
  "worklet";
  const x0 = cx - HW;
  const x1 = cx + HW;
  const lcp = x0 + HW * 0.55;
  const rcp = x1 - HW * 0.55;

  return (
    `M 0,${BUMP_H}` +
    ` L ${x0},${BUMP_H}` +
    ` C ${lcp},${BUMP_H} ${lcp},0 ${cx},0` +
    ` C ${rcp},0 ${rcp},${BUMP_H} ${x1},${BUMP_H}` +
    ` L ${BAR_W},${BUMP_H}` +
    ` L ${BAR_W},${TOTAL_H}` +
    ` L 0,${TOTAL_H} Z`
  );
}

// ─── Animated SVG background ──────────────────────────────────────────────────
const AnimatedPath = Reanimated.createAnimatedComponent(Path);

const HillBackground: React.FC<{ activeIndex: number }> = ({ activeIndex }) => {
  const colors = useColors();
  const cx = useSharedValue(ROW_PAD + (activeIndex + 0.5) * TAB_W);

  React.useEffect(() => {
    cx.value = withSpring(ROW_PAD + (activeIndex + 0.5) * TAB_W, {
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    });
  }, [activeIndex]);

  const animatedProps = useAnimatedProps(() => ({ d: makePath(cx.value) }));

  return (
    <Svg width={BAR_W} height={TOTAL_H} style={StyleSheet.absoluteFill}>
      <Defs>
        <Filter id="shadow" x="-5%" y="-20%" width="110%" height="140%">
          <FeDropShadow
            dx="0"
            dy="4"
            stdDeviation="8"
            floodColor="#000"
            floodOpacity="0.10"
          />
        </Filter>
      </Defs>
      <AnimatedPath
        animatedProps={animatedProps}
        fill={`${colors.primary}16`}
        filter="url(#shadow)"
      />
    </Svg>
  );
};

// ─── Tab item ─────────────────────────────────────────────────────────────────
const TabItem: React.FC<{
  route: { key: string; name: string };
  isFocused: boolean;
  config: TabConfig;
  onPress: () => void;
}> = ({ isFocused, config, onPress }) => {
  const styles = useStyles();
  const colors = useColors();
  const anim = React.useRef(new RNAnimated.Value(isFocused ? 1 : 0)).current;

  React.useEffect(() => {
    RNAnimated.spring(anim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      tension: 140,
      friction: 8,
    }).start();
  }, [isFocused]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.tabItem}
    >
      <RNAnimated.View style={{ transform: [{ translateY }, { scale }] }}>
        <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
          <Ionicons
            name={isFocused ? config.iconFocused : config.icon}
            size={22}
            color={isFocused ? colors.primary : colors.textSecondary}
          />
        </View>
      </RNAnimated.View>
      <Text style={[styles.label, isFocused && styles.labelActive]}>
        {config.label}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

type TabConfig = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
};

const TAB_CONFIGS: TabConfig[] = [
  {
    name: "Suggestions",
    label: "Khám phá",
    icon: "bulb-outline",
    iconFocused: "bulb",
  },
  {
    name: "Connections",
    label: "Kết nối",
    icon: "people-outline",
    iconFocused: "people",
  },
  {
    name: "Home",
    label: "Trang chủ",
    icon: "home-outline",
    iconFocused: "home",
  },
  {
    name: "Calendar",
    label: "Lịch",
    icon: "calendar-outline",
    iconFocused: "calendar",
  },

  {
    name: "Settings",
    label: "Cài đặt",
    icon: "settings-outline",
    iconFocused: "settings",
  },
];

// ─── Custom tab bar ───────────────────────────────────────────────────────────
const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom || 12 }]}>
      <View style={{ width: BAR_W, height: TOTAL_H }}>
        <HillBackground activeIndex={state.index} />
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIGS[index];
            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented)
                navigation.navigate(route.name as never);
            };
            return (
              <TabItem
                key={route.key}
                route={route}
                isFocused={isFocused}
                config={config}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

// ─── Navigator ────────────────────────────────────────────────────────────────
const TabNavigator: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Suggestions" component={SuggestionsScreen} />
    <Tab.Screen name="Connections" component={ConnectionsScreen} />
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Calendar" component={CalendarScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

export default TabNavigator;

// ─── Styles ───────────────────────────────────────────────────────────────────
const useStyles = makeStyles((colors) => ({
  wrapper: {
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  tabRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: BAR_H,
    flexDirection: "row",
    paddingHorizontal: ROW_PAD,
    overflow: "visible",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 10,
    overflow: "visible",
  },
  iconWrap: {
    width: 40,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: colors.primary + "18",
  },
  label: {
    fontSize: 10,
    fontFamily: "Manrope_500Medium",
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
    fontFamily: "Manrope_600SemiBold",
  },
}));
