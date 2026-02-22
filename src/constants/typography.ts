import { TextStyle } from 'react-native';

/**
 * Typography Design System
 * Consistent font sizes, weights, and line heights across the app
 */
export const TYPOGRAPHY: Record<string, TextStyle> = {
  // Display - Large headers, app name
  displayLarge: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  displayMedium: { fontSize: 24, fontWeight: '700', lineHeight: 32 },

  // Headings - Screen titles, section headers
  headingLarge: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  headingMedium: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  headingSmall: { fontSize: 16, fontWeight: '600', lineHeight: 22 },

  // Body - General content text
  bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 18 },

  // Labels - Buttons, badges, tags
  labelLarge: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  labelMedium: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  labelSmall: { fontSize: 12, fontWeight: '600', lineHeight: 16 },

  // Caption - Tiny text, timestamps
  caption: { fontSize: 11, fontWeight: '500', lineHeight: 16 },
} as const;
