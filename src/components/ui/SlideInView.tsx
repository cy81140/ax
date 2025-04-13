import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

interface SlideInViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  from?: 'left' | 'right' | 'top' | 'bottom';
  duration?: number;
}

export const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  style,
  from = 'left',
  duration = 300
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const initialValue = 100;
    const finalValue = 0;

    if (from === 'left' || from === 'right') {
      translateX.value = from === 'left' ? -initialValue : initialValue;
      translateX.value = withTiming(finalValue, { duration });
    } else {
      translateY.value = from === 'top' ? -initialValue : initialValue;
      translateY.value = withTiming(finalValue, { duration });
    }
  }, [from, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value }
      ]
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

export default SlideInView; 