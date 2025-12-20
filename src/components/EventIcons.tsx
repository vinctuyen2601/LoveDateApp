import React from 'react';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// Birthday Cake Icon
export const BirthdayIcon: React.FC<IconProps> = ({ size = 24, color = '#FF6B6B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Candle */}
    <Rect x="11" y="2" width="2" height="4" fill={color} />
    <Path
      d="M12 1C12 1 11 2 11 3C11 3.55 11.45 4 12 4C12.55 4 13 3.55 13 3C13 2 12 1 12 1Z"
      fill="#FFD93D"
    />
    {/* Cake layers */}
    <Path
      d="M20 19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V17H20V19Z"
      fill={color}
    />
    <Path
      d="M20 14C20 15.1 19.1 16 18 16H6C4.9 16 4 15.1 4 14V12H20V14Z"
      fill={color}
      opacity="0.8"
    />
    <Path
      d="M20 9C20 10.1 19.1 11 18 11H6C4.9 11 4 10.1 4 9V7H20V9Z"
      fill={color}
      opacity="0.6"
    />
    {/* Decorations */}
    <Circle cx="7" cy="9" r="1" fill="#FFD93D" />
    <Circle cx="12" cy="9" r="1" fill="#FFD93D" />
    <Circle cx="17" cy="9" r="1" fill="#FFD93D" />
  </Svg>
);

// Anniversary/Heart Icon
export const AnniversaryIcon: React.FC<IconProps> = ({ size = 24, color = '#E91E63' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Main heart */}
    <Path
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z"
      fill={color}
    />
    {/* Shine effect */}
    <Path
      d="M8 7C8 7 9 6 10 7C11 8 10 9 10 9"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
    />
  </Svg>
);

// Holiday/Star Icon
export const HolidayIcon: React.FC<IconProps> = ({ size = 24, color = '#FFC107' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Star shape */}
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill={color}
    />
    {/* Inner glow */}
    <Path
      d="M12 5L14.09 9.76L19 10.47L15.5 13.87L16.18 18.73L12 16.57L7.82 18.73L8.5 13.87L5 10.47L9.91 9.76L12 5Z"
      fill="#FFE082"
      opacity="0.7"
    />
    {/* Center sparkle */}
    <Circle cx="12" cy="12" r="2" fill="white" opacity="0.9" />
  </Svg>
);

// Other/Calendar Icon
export const OtherIcon: React.FC<IconProps> = ({ size = 24, color = '#9C27B0' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Calendar body */}
    <Rect x="3" y="4" width="18" height="18" rx="2" fill={color} />
    <Rect x="3" y="4" width="18" height="5" rx="2" fill={color} opacity="0.9" />

    {/* Calendar header holes */}
    <Rect x="7" y="2" width="2" height="4" rx="1" fill={color} />
    <Rect x="15" y="2" width="2" height="4" rx="1" fill={color} />

    {/* Date grid */}
    <G opacity="0.8">
      <Circle cx="8" cy="13" r="1.5" fill="white" />
      <Circle cx="12" cy="13" r="1.5" fill="white" />
      <Circle cx="16" cy="13" r="1.5" fill="white" />
      <Circle cx="8" cy="17" r="1.5" fill="white" />
      <Circle cx="12" cy="17" r="1.5" fill="white" />
      <Circle cx="16" cy="17" r="1.5" fill="white" />
    </G>

    {/* Highlight date */}
    <Circle cx="12" cy="13" r="2" fill="#FFD93D" />
    <Circle cx="12" cy="13" r="1.2" fill="white" />
  </Svg>
);

// Export all icons
export const EventCategoryIcons = {
  birthday: BirthdayIcon,
  anniversary: AnniversaryIcon,
  holiday: HolidayIcon,
  other: OtherIcon,
};
