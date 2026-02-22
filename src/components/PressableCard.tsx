import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { ANIMATION } from '../constants/animations';

interface PressableCardProps extends Omit<TouchableOpacityProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
}

const PressableCard: React.FC<PressableCardProps> = ({
  children,
  style,
  scaleValue = ANIMATION.scale.pressed,
  onPress,
  ...rest
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleValue,
      ...ANIMATION.spring.stiff,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...ANIMATION.spring.gentle,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      {...rest}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default PressableCard;
