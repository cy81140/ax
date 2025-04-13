import { Animated, Easing } from 'react-native';

interface AnimationConfig {
  toValue: number;
  duration?: number;
  delay?: number;
  easing?: (value: number) => number;
  useNativeDriver?: boolean;
}

/**
 * Animations utility functions for enhancing the UI experience
 */

/**
 * Creates a fade animation
 */
export const fade = (
  animatedValue: Animated.Value,
  config: AnimationConfig
): Animated.CompositeAnimation => {
  const { toValue, duration = 300, delay = 0, easing = Easing.ease, useNativeDriver = true } = config;
  
  return Animated.sequence([
    Animated.delay(delay),
    Animated.timing(animatedValue, {
      toValue,
      duration,
      easing,
      useNativeDriver,
    }),
  ]);
};

/**
 * Creates a slide animation
 */
export const slide = (
  animatedValue: Animated.Value,
  config: AnimationConfig
): Animated.CompositeAnimation => {
  const { toValue, duration = 500, delay = 0, easing = Easing.out(Easing.cubic), useNativeDriver = true } = config;
  
  return Animated.sequence([
    Animated.delay(delay),
    Animated.timing(animatedValue, {
      toValue,
      duration,
      easing,
      useNativeDriver,
    }),
  ]);
};

/**
 * Creates a spring animation
 */
export const spring = (
  animatedValue: Animated.Value,
  config: AnimationConfig & { friction?: number; tension?: number }
): Animated.CompositeAnimation => {
  const { 
    toValue, 
    delay = 0, 
    friction = 7, 
    tension = 40, 
    useNativeDriver = true 
  } = config;
  
  return Animated.sequence([
    Animated.delay(delay),
    Animated.spring(animatedValue, {
      toValue,
      friction,
      tension,
      useNativeDriver,
    }),
  ]);
};

/**
 * Creates a pulse animation that loops infinitely
 */
export const pulse = (
  animatedValue: Animated.Value,
  config: {
    minValue?: number;
    maxValue?: number;
    duration?: number;
    useNativeDriver?: boolean;
  } = {}
): Animated.CompositeAnimation => {
  const { 
    minValue = 0.8, 
    maxValue = 1, 
    duration = 1000, 
    useNativeDriver = true 
  } = config;
  
  animatedValue.setValue(minValue);
  
  const pulseAnimation = Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: maxValue,
      duration: duration / 2,
      easing: Easing.sin,
      useNativeDriver,
    }),
    Animated.timing(animatedValue, {
      toValue: minValue,
      duration: duration / 2,
      easing: Easing.sin,
      useNativeDriver,
    }),
  ]);
  
  return Animated.loop(pulseAnimation);
};

/**
 * Creates a scale animation
 * @param animatedValue - The Animated.Value to animate
 * @param toValue - The target value to animate to
 * @param duration - The duration of the animation in milliseconds
 * @returns Animated.CompositeAnimation
 */
export const scale = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = 100
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.ease,
    useNativeDriver: true,
  });
};

/**
 * Creates a press animation for buttons
 * @param scale Animated.Value to animate
 * @param toValue Target value for the animation
 * @param duration Animation duration in ms
 * @returns Animated.CompositeAnimation
 */
export const createPressAnimation = (
  scale: Animated.Value,
  toValue: number = 0.95,
  duration: number = 100
): Animated.CompositeAnimation => {
  return Animated.timing(scale, {
    toValue,
    duration,
    useNativeDriver: true,
    easing: Easing.inOut(Easing.ease),
  });
};

/**
 * Slide in animation
 * @param translateY Animated.Value to animate
 * @param fromValue Starting position
 * @param duration Animation duration in ms
 * @returns Animated.CompositeAnimation
 */
export const slideIn = (
  translateY: Animated.Value,
  fromValue: number = 100,
  duration: number = 300
): Animated.CompositeAnimation => {
  translateY.setValue(fromValue);
  return Animated.timing(translateY, {
    toValue: 0,
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.ease),
  });
};

/**
 * Slide out animation
 * @param translateY Animated.Value to animate
 * @param toValue Target position
 * @param duration Animation duration in ms
 * @returns Animated.CompositeAnimation
 */
export const slideOut = (
  translateY: Animated.Value,
  toValue: number = 100,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(translateY, {
    toValue,
    duration,
    useNativeDriver: true,
    easing: Easing.in(Easing.ease),
  });
}; 