import { Easing } from 'react-native';

/**
 * Animation Design System
 * Consistent durations, spring configs, and easing curves
 */
export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  spring: {
    gentle: { tension: 50, friction: 7, useNativeDriver: true },
    bouncy: { tension: 100, friction: 8, useNativeDriver: true },
    stiff: { tension: 200, friction: 20, useNativeDriver: true },
  },
  easing: {
    standard: Easing.bezier(0.4, 0.0, 0.2, 1),
    decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
    accelerate: Easing.bezier(0.4, 0.0, 1, 1),
  },
  scale: {
    pressed: 0.97,
    normal: 1,
  },
} as const;
