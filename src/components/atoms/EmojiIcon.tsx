import React from 'react';
import Svg, { Text as SvgText } from 'react-native-svg';

interface Props {
  emoji: string;
  size?: number;
}

/**
 * Renders an emoji using SVG Text — bypasses React Native's Text/Font system,
 * so custom fonts loaded via expo-font do NOT affect emoji rendering on iOS.
 */
const EmojiIcon: React.FC<Props> = ({ emoji, size = 24 }) => (
  <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <SvgText
      x={size / 2}
      y={size * 0.82}
      fontSize={size * 0.82}
      textAnchor="middle"
    >
      {emoji}
    </SvgText>
  </Svg>
);

export default React.memo(EmojiIcon);
