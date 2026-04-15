/**
 * AiIcon — AI assistant icon, derived from the app logo sparkle.
 *
 * The app logo uses a purple 4-pointed star (✦) as its AI/magic marker.
 * This component recreates that exact shape in SVG so the AI assistant
 * identity is consistent with the overall brand.
 *
 * Variants:
 *   showBackground=false (default) — white sparkle only, place inside any wrapper
 *   showBackground=true            — gradient circle + white sparkle (standalone)
 *   pulse=true                     — center breathes (use while AI is "thinking")
 *
 * Usage:
 *   // In a gradient LinearGradient wrapper (chat avatar, hero)
 *   <AiIcon size={17} />
 *
 *   // Standalone with its own gradient circle (no wrapper needed)
 *   <AiIcon size={44} showBackground />
 *
 *   // Typing / thinking state
 *   <AiIcon size={17} pulse />
 */

import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Path,
} from "react-native-svg";

interface AiIconProps {
  size?: number;
  showBackground?: boolean;
  pulse?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  /** Override with a multi-stop rainbow gradient (3+ colors) */
  gradientColors?: string[];
}

// ── SVG path builder ──────────────────────────────────────────────────────────
// Produces the 4-pointed diamond sparkle (✦) used in the app logo.
// cx, cy   — center of the star
// r        — half-length of the long arms (controls overall size)
// pinch    — how much the sides "pinch" inward; smaller = more concave
function sparkPath(cx: number, cy: number, r: number, pinch = 0.18): string {
  const c = r * pinch; // control-point offset (concavity)
  return [
    `M ${cx} ${cy - r}`,
    `Q ${cx + c} ${cy - c}  ${cx + r} ${cy}`,
    `Q ${cx + c} ${cy + c}  ${cx} ${cy + r}`,
    `Q ${cx - c} ${cy + c}  ${cx - r} ${cy}`,
    `Q ${cx - c} ${cy - c}  ${cx} ${cy - r}`,
    "Z",
  ].join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

const AiIcon: React.FC<AiIconProps> = ({
  size = 28,
  showBackground = false,
  pulse = false,
  primaryColor = "#7C3AED",
  secondaryColor = "#A855F7",
  gradientColors,
}) => {
  const gradientId = useRef(`aiBg_${Math.random().toString(36).slice(2)}`).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const cx = size / 2;
  const cy = size / 2;

  // Main sparkle arm length — fills ~52% of the circle radius
  const mainR = size * 0.29;

  // Secondary small sparkle (logo has 1–2 mini stars beside the big one)
  // Only render when size is large enough to be visible
  const showSecondary = size >= 32;
  // Small star is 38% the size of main, placed upper-right
  const smallR = mainR * 0.38;
  const smallCx = cx + mainR * 0.88;
  const smallCy = cy - mainR * 0.82;

  // Glow ring behind the main sparkle
  const glowR = mainR * 1.05;

  const inner = (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          {(gradientColors ?? [primaryColor, secondaryColor]).map((color, i, arr) => (
            <Stop
              key={i}
              offset={`${Math.round((i / (arr.length - 1)) * 100)}%`}
              stopColor={color}
            />
          ))}
        </LinearGradient>
        {/* Sparkle gradient — only used in rainbow mode */}
        {gradientColors && (
          <LinearGradient id={`${gradientId}_spark`} x1="100%" y1="0%" x2="0%" y2="100%">
            {gradientColors.map((color, i, arr) => (
              <Stop
                key={i}
                offset={`${Math.round((i / (arr.length - 1)) * 100)}%`}
                stopColor={color}
              />
            ))}
          </LinearGradient>
        )}
      </Defs>

      {/* Background gradient circle */}
      {showBackground && (
        <Circle
          cx={cx} cy={cy} r={cx}
          fill={gradientColors ? "white" : `url(#${gradientId})`}
        />
      )}

      {/* Soft glow behind main star */}
      <Circle cx={cx} cy={cy} r={glowR} fill="white" opacity={gradientColors ? 0 : 0.12} />

      {/* Main 4-pointed sparkle */}
      <Path
        d={sparkPath(cx, cy, mainR)}
        fill={gradientColors ? `url(#${gradientId}_spark)` : "white"}
        opacity={0.95}
      />

      {/* Secondary mini sparkle — mirrors app logo layout */}
      {showSecondary && (
        <Path
          d={sparkPath(smallCx, smallCy, smallR)}
          fill={gradientColors ? `url(#${gradientId}_spark)` : "white"}
          opacity={0.72}
        />
      )}
    </Svg>
  );

  // Wrap in Animated.View for the pulse effect
  if (pulse) {
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        {inner}
      </Animated.View>
    );
  }

  return inner;
};

export default AiIcon;
