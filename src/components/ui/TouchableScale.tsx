import React, { useRef } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Animated,
  StyleSheet,
} from 'react-native';
import { createPressAnimation } from '../../utils/animations';

interface TouchableScaleProps extends TouchableOpacityProps {
  scaleAmount?: number;
  duration?: number;
}

/**
 * A touchable component that scales down when pressed
 */
export const TouchableScale: React.FC<TouchableScaleProps> = ({
  children,
  style,
  scaleAmount = 0.95,
  duration = 100,
  onPressIn: externalPressIn,
  onPressOut: externalPressOut,
  ...props
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    createPressAnimation(scale, scaleAmount, duration).start();
    externalPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    createPressAnimation(scale, 1, duration).start();
    externalPressOut?.(e);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
      {...props}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}; 