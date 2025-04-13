import React, { useRef } from 'react';
import { 
  Animated, 
  TouchableWithoutFeedback, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  Text 
} from 'react-native';
import { createPressAnimation } from '../../utils/animations';

interface AnimatedButtonProps {
  onPress: () => void;
  children?: React.ReactNode;
  text?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  children,
  text,
  style,
  textStyle,
  disabled = false
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { onPressIn, onPressOut } = createPressAnimation(scaleAnim);

  return (
    <TouchableWithoutFeedback
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
    >
      <Animated.View
        style={[
          styles.button,
          style,
          { opacity: disabled ? 0.5 : 1 },
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {text ? <Text style={[styles.text, textStyle]}>{text}</Text> : children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnimatedButton; 