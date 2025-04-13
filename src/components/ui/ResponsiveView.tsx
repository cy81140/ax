import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  mobileStyle?: StyleProp<ViewStyle>;
  tabletStyle?: StyleProp<ViewStyle>;
  desktopStyle?: StyleProp<ViewStyle>;
  webStyle?: StyleProp<ViewStyle>;
  nativeStyle?: StyleProp<ViewStyle>;
}

/**
 * A responsive container that applies different styles based on device type
 * This allows for easy responsive layouts throughout the app
 */
export const ResponsiveView: React.FC<ResponsiveViewProps> = ({
  children,
  style,
  mobileStyle,
  tabletStyle,
  desktopStyle,
  webStyle,
  nativeStyle,
}) => {
  const { isMobile, isTablet, isDesktop, isWeb } = useResponsive();
  
  // Determine which styles to apply based on device
  const deviceSpecificStyle = [
    style,
    isMobile && mobileStyle,
    isTablet && tabletStyle,
    isDesktop && desktopStyle,
    isWeb && webStyle,
    !isWeb && nativeStyle,
  ];
  
  return (
    <View style={deviceSpecificStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 