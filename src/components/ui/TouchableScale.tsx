import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface TouchableScaleProps {
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  scaleAmount?: number;
  duration?: number;
}

/**
 * A touchable component that scales down when pressed
 */
export const TouchableScale: React.FC<TouchableScaleProps> = ({
  onPress,
  children,
  disabled = false,
  style,
  scaleAmount = 0.95,
  duration = 200
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(disabled ? scaleAmount : 1, { duration }) }],
      opacity: withSpring(disabled ? 0.5 : 1, { duration })
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={styles.touchable}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  touchable: {
    alignItems: 'center',
    justifyContent: 'center'
  }
}); 