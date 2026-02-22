/**
 * Shared HTML styles for CKEditor content rendering
 * Used by ArticleDetailScreen and SuggestionsScreen Results Modal
 */

import { COLORS } from './colors';

export const htmlStyles = {
  body: { fontSize: 16, lineHeight: 26, color: COLORS.textPrimary },
  h1: { fontSize: 28, fontWeight: "bold" as const, color: COLORS.textPrimary, marginTop: 20, marginBottom: 12 },
  h2: { fontSize: 24, fontWeight: "bold" as const, color: COLORS.textPrimary, marginTop: 16, marginBottom: 10 },
  h3: { fontSize: 20, fontWeight: "600" as const, color: COLORS.textPrimary, marginTop: 14, marginBottom: 8 },
  h4: { fontSize: 18, fontWeight: "600" as const, color: COLORS.textPrimary, marginTop: 12, marginBottom: 6 },
  p: { fontSize: 16, lineHeight: 26, color: COLORS.textPrimary, marginBottom: 12 },
  strong: { fontWeight: "bold" as const, color: COLORS.textPrimary },
  b: { fontWeight: "bold" as const, color: COLORS.textPrimary },
  em: { fontStyle: "italic" as const },
  i: { fontStyle: "italic" as const },
  ul: { marginBottom: 12, paddingLeft: 20 },
  ol: { marginBottom: 12, paddingLeft: 20 },
  li: { fontSize: 16, lineHeight: 24, color: COLORS.textPrimary, marginBottom: 6 },
  blockquote: { backgroundColor: COLORS.background, borderLeftWidth: 4, borderLeftColor: COLORS.primary, paddingLeft: 12, paddingVertical: 8, marginBottom: 12, fontStyle: "italic" as const },
  a: { color: COLORS.primary, textDecorationLine: "underline" as const },
  hr: { backgroundColor: COLORS.border, height: 1, marginVertical: 16 },
  img: { marginVertical: 12, borderRadius: 8 },
  figure: { marginVertical: 12 },
  figcaption: { fontSize: 14, color: COLORS.textSecondary, fontStyle: "italic" as const, textAlign: "center" as const, marginTop: 8 },
};
