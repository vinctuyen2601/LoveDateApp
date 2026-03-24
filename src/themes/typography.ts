import { TextStyle } from 'react-native';

/**
 * Typography Design System
 * Consistent font sizes, weights, and line heights across the app
 */
export const TYPOGRAPHY: Record<string, TextStyle> = {
  // Display - Large headers, app name
  displayLarge: { fontFamily: 'Manrope_700Bold', fontSize: 28, lineHeight: 36 },
  displayMedium: { fontFamily: 'Manrope_700Bold', fontSize: 24, lineHeight: 32 },

  // Headings - Screen titles, section headers
  headingLarge: { fontFamily: 'Manrope_700Bold', fontSize: 22, lineHeight: 28 },
  headingMedium: { fontFamily: 'Manrope_700Bold', fontSize: 18, lineHeight: 24 },
  headingSmall: { fontFamily: 'Manrope_600SemiBold', fontSize: 16, lineHeight: 22 },

  // Body - General content text
  bodyLarge: { fontFamily: 'Manrope_400Regular', fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: 'Manrope_400Regular', fontSize: 14, lineHeight: 20 },
  bodySmall: { fontFamily: 'Manrope_400Regular', fontSize: 13, lineHeight: 18 },

  // Labels - Buttons, badges, tags
  labelLarge: { fontFamily: 'Manrope_600SemiBold', fontSize: 16, lineHeight: 22 },
  labelMedium: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, lineHeight: 20 },
  labelSmall: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, lineHeight: 16 },

  // Caption - Tiny text, timestamps
  caption: { fontFamily: 'Manrope_500Medium', fontSize: 11, lineHeight: 16 },
} as const;
