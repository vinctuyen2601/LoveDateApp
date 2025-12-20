export const COLORS = {
  // Primary Colors
  primary: '#FF6B6B',
  primaryLight: '#FF8E8E',
  primaryDark: '#E85555',

  // Secondary Colors
  secondary: '#4ECDC4',
  secondaryLight: '#7ED9D2',
  secondaryDark: '#3DBAB2',

  // Accent Colors
  accent: '#FFE66D',
  accentLight: '#FFF099',
  accentDark: '#F5D943',

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#F8F9FA',
  backgroundDark: '#1A1A1A',
  surface: '#FFFFFF',
  surfaceDark: '#2C2C2C',

  // Text Colors
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textLight: '#BDC3C7',
  textDark: '#FFFFFF',
  textDisabled: '#95A5A6',

  // Status Colors
  success: '#2ECC71',
  successLight: '#58D68D',
  error: '#E74C3C',
  errorLight: '#EC7063',
  warning: '#F39C12',
  warningLight: '#F8C471',
  info: '#3498DB',
  infoLight: '#5DADE2',

  // Border Colors
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  borderDark: '#404040',

  // Shadow
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',

  // Category Colors
  categoryBirthday: '#FF6B6B',
  categoryAnniversary: '#FF69B4',
  categoryHoliday: '#4ECDC4',
  categoryOther: '#95A5A6',

  // Relationship Colors
  relationshipWife: '#FF69B4',
  relationshipHusband: '#4169E1',
  relationshipChild: '#FFD700',
  relationshipParent: '#9370DB',
  relationshipFriend: '#20B2AA',
  relationshipColleague: '#FF8C00',
  relationshipOther: '#808080',

  // Gradient Colors
  gradientStart: '#FF6B6B',
  gradientEnd: '#4ECDC4',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'birthday':
      return COLORS.categoryBirthday;
    case 'anniversary':
      return COLORS.categoryAnniversary;
    case 'holiday':
      return COLORS.categoryHoliday;
    default:
      return COLORS.categoryOther;
  }
};

export const getRelationshipColor = (relationship: string): string => {
  switch (relationship) {
    case 'wife':
      return COLORS.relationshipWife;
    case 'husband':
      return COLORS.relationshipHusband;
    case 'child':
      return COLORS.relationshipChild;
    case 'parent':
      return COLORS.relationshipParent;
    case 'friend':
      return COLORS.relationshipFriend;
    case 'colleague':
      return COLORS.relationshipColleague;
    default:
      return COLORS.relationshipOther;
  }
};

// Theme
export const LIGHT_THEME = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.textPrimary,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
  primary: COLORS.primary,
  error: COLORS.error,
  success: COLORS.success,
};

export const DARK_THEME = {
  background: COLORS.backgroundDark,
  surface: COLORS.surfaceDark,
  text: COLORS.textDark,
  textSecondary: COLORS.textLight,
  border: COLORS.borderDark,
  primary: COLORS.primary,
  error: COLORS.error,
  success: COLORS.success,
};
