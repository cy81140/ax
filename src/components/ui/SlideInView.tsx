import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';
import { slide } from '../../utils/animations';

type SlideDirection = 'left' | 'right' | 'up' | 'down';

interface SlideInViewProps extends ViewProps {
  /**
   * Direction to slide from
   * @default 'left'
   */
  direction?: SlideDirection;
  
  /**
   * Duration of the animation in milliseconds
   * @default 500
   */
  duration?: number;
  
  /**
   * Delay before starting the animation in milliseconds
   * @default 0
   */
  delay?: number;
  
  /**
   * Distance to slide in pixels
   * @default 100
   */
  distance?: number;
}

/**
 * A view that slides in its children when mounted
 */
export const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  direction = 'left',
  duration = 500,
  delay = 0,
  distance = 100,
  style,
  ...props
}) => {
  const translateX = useRef(new Animated.Value(direction === 'left' ? -distance : direction === 'right' ? distance : 0)).current;
  const translateY = useRef(new Animated.Value(direction === 'up' ? -distance : direction === 'down' ? distance : 0)).current;
  
  useEffect(() => {
    const animationX = slide(translateX, {
      toValue: 0,
      duration,
      delay,
    });
    
    const animationY = slide(translateY, {
      toValue: 0,
      duration,
      delay,
    });
    
    animationX.start();
    animationY.start();
    
    return () => {
      animationX.stop();
      animationY.stop();
    };
  }, [translateX, translateY, duration, delay]);
  
  return (
    <Animated.View
      style={[
        {
          transform: [
            { translateX },
            { translateY },
          ],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export default SlideInView; 