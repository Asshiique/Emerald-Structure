/**
 * AnimatedPressable — a drop-in replacement for TouchableOpacity that adds a
 * satisfying spring scale-down on press. Used on every interactive card in
 * the app for a premium tactile feel.
 *
 * Uses Reanimated v4's `useAnimatedStyle` + `withSpring` — no gesture-handler
 * wrapping needed, works with existing onPress handlers.
 */

import React from "react";
import { type ViewStyle, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Pressable } from "react-native";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
  scaleDown?: number; // default 0.96
  activeOpacity?: number;
};

export function AnimatedPressable({
  children,
  onPress,
  style,
  disabled = false,
  scaleDown = 0.96,
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          scale.value = withSpring(scaleDown, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 300 });
        }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </Animated.View>
  );
}
