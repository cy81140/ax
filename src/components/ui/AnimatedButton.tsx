import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface AnimatedButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  title,
  disabled = false,
  style,
  textStyle
}) => {
  const theme = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(disabled ? 0.5 : 1),
      transform: [{ scale: withSpring(disabled ? 0.95 : 1) }]
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.shadow
          }
        ]}
      >
        <Text style={[styles.text, { color: theme.colors.onPrimary }, textStyle]}>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    elevation: 5,
    justifyContent: 'center',
    padding: 12,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold'
  }
}); 