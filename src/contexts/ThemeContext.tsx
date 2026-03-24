import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@themes/colors";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type ColorScheme = Record<keyof typeof COLORS, string>;

export type ThemeName = "light" | "dark" | "rose" | "ocean" | "forest";

export interface ThemeInfo {
  name: ThemeName;
  label: string;
  preview: string; // primary color để hiển thị swatch
}

interface ThemeContextValue {
  colors: ColorScheme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Available themes — override chỉ các key thay đổi, còn lại kế thừa từ COLORS
// ─────────────────────────────────────────────────────────────────────────────
const buildTheme = (overrides: Partial<ColorScheme>): ColorScheme => ({
  ...COLORS,
  ...overrides,
});

export const THEMES: Record<ThemeName, ColorScheme> = {
  light: COLORS,

  dark: buildTheme({
    background: "#0F172A", // slate-900
    surface: "#1E293B", // slate-800
    textPrimary: "#F8FAFC", // slate-50
    textSecondary: "#94A3B8", // slate-400
    textLight: "#475569", // slate-600
    textDisabled: "#334155", // slate-700
    border: "#334155", // slate-700
    borderLight: "#1E293B", // slate-800
    shadow: "#000000" + "40",
    overlay: "#000000" + "A0",
  }),

  rose: buildTheme({
    primary: "#F43F5E", // rose-500
    primaryLight: "#FB7185", // rose-400
    secondary: "#FB923C", // orange-400
    gradientStart: "#F43F5E",
    gradientEnd: "#FB923C",
  }),

  ocean: buildTheme({
    primary: "#0EA5E9", // sky-500
    primaryLight: "#38BDF8", // sky-400
    secondary: "#06B6D4", // cyan-500
    gradientStart: "#0EA5E9",
    gradientEnd: "#06B6D4",
  }),

  forest: buildTheme({
    primary: "#22C55E", // green-500
    primaryLight: "#4ADE80", // green-400
    secondary: "#14B8A6", // teal-500
    gradientStart: "#22C55E",
    gradientEnd: "#14B8A6",
  }),
};

export const THEME_LIST: ThemeInfo[] = [
  { name: "light", label: "Cam", preview: THEMES.light.primary },
  { name: "rose", label: "Hồng", preview: THEMES.rose.primary },
  // { name: 'ocean',  label: 'Đại dương',  preview: THEMES.ocean.primary },
  { name: "forest", label: "Xanh", preview: THEMES.forest.primary },
  { name: "dark", label: "Xanh Đêm", preview: "#1E293B" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "@app_theme";

const ThemeContext = createContext<ThemeContextValue>({
  colors: COLORS,
  themeName: "light",
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeName, setThemeName] = useState<ThemeName>("light");

  // Load saved theme on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && saved in THEMES) {
        setThemeName(saved as ThemeName);
      }
    });
  }, []);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    AsyncStorage.setItem(STORAGE_KEY, name);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ colors: THEMES[themeName], themeName, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

/** Lấy màu của theme hiện tại — dùng thay cho import { COLORS } */
export const useColors = (): ColorScheme => useContext(ThemeContext).colors;

/** Lấy theme name + setTheme — dùng trong settings */
export const useTheme = () => {
  const { themeName, setTheme } = useContext(ThemeContext);
  return { themeName, setTheme };
};
