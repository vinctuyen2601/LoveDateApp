/**
 * Shared HTML styles for CKEditor content rendering
 * Used by ArticleDetailScreen and SuggestionsScreen Results Modal
 */

import { ThemeName } from "@/contexts/ThemeContext";
import { COLORS } from "@themes/colors";

export const htmlStyles = (theme: ThemeName) => {
  const colorText = theme !== "dark" ? COLORS.textPrimary : COLORS.textLight;
  return {
    body: {
      fontFamily: "Manrope_400Regular",
      fontSize: 16,
      lineHeight: 26,
      color: colorText,
    },
    h1: {
      fontFamily: "Manrope_700Bold",
      fontSize: 28,
      color: colorText,
      marginTop: 20,
      marginBottom: 12,
    },
    h2: {
      fontFamily: "Manrope_700Bold",
      fontSize: 24,
      color: colorText,
      marginTop: 16,
      marginBottom: 10,
    },
    h3: {
      fontFamily: "Manrope_600SemiBold",
      fontSize: 20,
      color: colorText,
      marginTop: 14,
      marginBottom: 8,
    },
    h4: {
      fontFamily: "Manrope_600SemiBold",
      fontSize: 18,
      color: colorText,
      marginTop: 12,
      marginBottom: 6,
    },
    p: {
      fontFamily: "Manrope_400Regular",
      fontSize: 16,
      lineHeight: 26,
      color: colorText,
      marginBottom: 12,
    },
    strong: { fontFamily: "Manrope_700Bold", color: colorText },
    b: { fontFamily: "Manrope_700Bold", color: colorText },
    em: { fontStyle: "italic" as const },
    i: { fontStyle: "italic" as const },
    ul: { marginBottom: 12, paddingLeft: 20 },
    ol: { marginBottom: 12, paddingLeft: 20 },
    li: {
      fontFamily: "Manrope_400Regular",
      fontSize: 16,
      lineHeight: 24,
      color: colorText,
      marginBottom: 6,
    },
    blockquote: {
      fontFamily: "Manrope_400Regular",
      backgroundColor: COLORS.background,
      borderLeftWidth: 4,
      borderLeftColor: COLORS.primary,
      paddingLeft: 12,
      paddingVertical: 8,
      marginBottom: 12,
      fontStyle: "italic" as const,
    },
    a: { color: COLORS.primary, textDecorationLine: "underline" as const },
    hr: { backgroundColor: COLORS.border, height: 1, marginVertical: 16 },
    img: { marginVertical: 12, borderRadius: 8 },
    figure: { marginVertical: 12 },
    figcaption: {
      fontFamily: "Manrope_400Regular",
      fontSize: 14,
      color: COLORS.textSecondary,
      fontStyle: "italic" as const,
      textAlign: "center" as const,
      marginTop: 8,
    },
  };
};
