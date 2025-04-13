import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';
import { fadeIn } from '../../utils/animations';

export interface FadeInViewProps extends ViewProps {
  /**
   * Duration of the fade-in animation in milliseconds
   * @default 500
   */
  duration?: number;
  
  /**
   * Delay before the animation starts in milliseconds
   * @default 0
   */
  delay?: number;
  
  /**
   * Initial opacity value
   * @default 0
   */
  initialOpacity?: number;
  
  /**
   * Target opacity value to animate to
   * @default 1
   */
  targetOpacity?: number;
}

/**
 * A component that fades in its children when mounted
 */
export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 500,
  delay = 0,
  initialOpacity = 0,
  targetOpacity = 1,
  style,
  ...props
}) => {
  const opacity = useRef(new Animated.Value(initialOpacity)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      fadeIn(opacity, targetOpacity, duration)
    ]);
    
    animation.start();
    
    return () => {
      animation.stop();
    };
  }, [opacity, duration, delay, targetOpacity]);

  return (
    <Animated.View
      style={[
        { opacity },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export default FadeInView; 