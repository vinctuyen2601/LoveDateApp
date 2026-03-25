// AI feature color palette — used consistently across all AI UI elements
// Purple is the universal AI color (Gemini, Copilot, Claude, etc.)

export const AI_COLORS = {
  primary: "#7C3AED",    // violet-600
  secondary: "#A855F7",  // purple-500
  light: "#EDE9FE",      // violet-100
  text: "#5B21B6",       // violet-800
  white: "#FFFFFF",
} as const;

// Gradient tuple for LinearGradient colors prop
export const AI_GRADIENT: [string, string] = [AI_COLORS.primary, AI_COLORS.secondary];
