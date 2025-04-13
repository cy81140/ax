import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';
import { fadeIn, fadeOut } from '../../utils/animations';

interface FadeViewProps extends ViewProps {
  visible: boolean;
  duration?: number;
  onHidden?: () => void;
}

const FadeView: React.FC<FadeViewProps> = ({
  visible,
  duration = 300,
  onHidden,
  style,
  children,
  ...props
}) => {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  
  useEffect(() => {
    if (visible) {
      fadeIn(opacity, duration).start();
    } else {
      fadeOut(opacity, duration).start(({ finished }) => {
        if (finished && onHidden) {
          onHidden();
        }
      });
    }
  }, [visible, duration, opacity, onHidden]);

  return (
    <Animated.View
      style={[
        style,
        { opacity }
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export default FadeView; 