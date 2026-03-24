/**
 * Shared HTML styles for CKEditor content rendering
 * Used by ArticleDetailScreen and SuggestionsScreen Results Modal
 */

import { COLORS } from '@themes/colors';

export const htmlStyles = {
  body: { fontFamily: 'Manrope_400Regular', fontSize: 16, lineHeight: 26, color: COLORS.textPrimary },
  h1: { fontFamily: 'Manrope_700Bold', fontSize: 28, color: COLORS.textPrimary, marginTop: 20, marginBottom: 12 },
  h2: { fontFamily: 'Manrope_700Bold', fontSize: 24, color: COLORS.textPrimary, marginTop: 16, marginBottom: 10 },
  h3: { fontFamily: 'Manrope_600SemiBold', fontSize: 20, color: COLORS.textPrimary, marginTop: 14, marginBottom: 8 },
  h4: { fontFamily: 'Manrope_600SemiBold', fontSize: 18, color: COLORS.textPrimary, marginTop: 12, marginBottom: 6 },
  p: { fontFamily: 'Manrope_400Regular', fontSize: 16, lineHeight: 26, color: COLORS.textPrimary, marginBottom: 12 },
  strong: { fontFamily: 'Manrope_700Bold', color: COLORS.textPrimary },
  b: { fontFamily: 'Manrope_700Bold', color: COLORS.textPrimary },
  em: { fontStyle: "italic" as const },
  i: { fontStyle: "italic" as const },
  ul: { marginBottom: 12, paddingLeft: 20 },
  ol: { marginBottom: 12, paddingLeft: 20 },
  li: { fontFamily: 'Manrope_400Regular', fontSize: 16, lineHeight: 24, color: COLORS.textPrimary, marginBottom: 6 },
  blockquote: { fontFamily: 'Manrope_400Regular', backgroundColor: COLORS.background, borderLeftWidth: 4, borderLeftColor: COLORS.primary, paddingLeft: 12, paddingVertical: 8, marginBottom: 12, fontStyle: "italic" as const },
  a: { color: COLORS.primary, textDecorationLine: "underline" as const },
  hr: { backgroundColor: COLORS.border, height: 1, marginVertical: 16 },
  img: { marginVertical: 12, borderRadius: 8 },
  figure: { marginVertical: 12 },
  figcaption: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: COLORS.textSecondary, fontStyle: "italic" as const, textAlign: "center" as const, marginTop: 8 },
};
