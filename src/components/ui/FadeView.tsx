import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { fade } from '../../utils/animations';

interface FadeViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
  visible: boolean;
}

export const FadeView: React.FC<FadeViewProps> = ({ 
  children, 
  style, 
  duration = 300,
  visible 
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fade(visible ? 1 : 0, duration),
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