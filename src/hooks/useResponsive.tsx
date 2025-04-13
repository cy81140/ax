import { useWindowDimensions, Platform } from 'react-native';

type DeviceType = 'mobile' | 'tablet' | 'desktop';
type Orientation = 'portrait' | 'landscape';

interface ResponsiveHelpers {
  deviceType: DeviceType;
  isWeb: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: Orientation;
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

/**
 * A custom hook that provides responsive design utilities
 * This helps ensure consistent responsive behavior across the app
 */
export const useResponsive = (): ResponsiveHelpers => {
  const { width, height, scale, fontScale } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  
  // Determine device type based on screen width
  let deviceType: DeviceType = 'mobile';
  if (width >= 1024) {
    deviceType = 'desktop';
  } else if (width >= 768) {
    deviceType = 'tablet';
  }
  
  // Determine orientation
  const orientation: Orientation = width > height ? 'landscape' : 'portrait';
  
  return {
    deviceType,
    isWeb,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    orientation,
    width,
    height,
    scale,
    fontScale
  };
}; 