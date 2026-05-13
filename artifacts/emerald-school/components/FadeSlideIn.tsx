/**
 * FadeSlideIn — animates a child in by fading + sliding up from a given offset.
 * Used for staggered card entrances on the Home screen.
 *
 * Props:
 *  - delay  : ms before animation starts (use multiples like 0, 80, 160 for stagger)
 *  - from   : starting Y offset in dp (default 24)
 *  - duration: spring damping ratio (default 18)
 */

import React, { useEffect } from "react";
import { type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type Props = {
  children: React.ReactNode;
  delay?: number;
  from?: number;
  style?: ViewStyle | ViewStyle[];
};

export function FadeSlideIn({ children, delay = 0, from = 24, style }: Props) {
  const translateY = useSharedValue(from);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 20, stiffness: 180 })
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 260 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}
