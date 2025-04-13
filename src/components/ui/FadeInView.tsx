import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { fade } from '../../utils/animations';

interface FadeInViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
}

export const FadeInView: React.FC<FadeInViewProps> = ({ children, style, duration = 300 }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fade(1, duration),
    };
  });

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 