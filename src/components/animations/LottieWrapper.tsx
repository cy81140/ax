import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Avatar, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Only import LottieView on native platforms
let LottieView: any = null;
if (Platform.OS !== 'web') {
  try {
    // This import is only evaluated on native platforms
    LottieView = require('lottie-react-native').default;
  } catch (e) {
    console.warn('Could not load lottie-react-native:', e);
  }
}

interface LottieWrapperProps {
  source: any;
  icon?: string;
  text?: string;
  style?: any;
  size?: number;
  autoPlay?: boolean;
  loop?: boolean;
  colorFilters?: Array<{
    keypath: string;
    color: string;
  }>;
}

const LottieWrapper: React.FC<LottieWrapperProps> = ({
  source,
  icon = 'animation-outline',
  text,
  style,
  size = 180,
  autoPlay = true,
  loop = true,
  colorFilters,
}) => {
  const theme = useTheme();

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        {icon === 'loading' ? (
          <ActivityIndicator size={size / 2} color={theme.colors.primary} />
        ) : (
          <Avatar.Icon
            size={size / 1.5}
            icon={icon}
            color={theme.colors.onPrimary}
            style={{ backgroundColor: theme.colors.primary }}
          />
        )}
        {text && (
          <Text 
            style={[styles.text, { color: theme.colors.onSurface, marginTop: 16 }]}
          >
            {text}
          </Text>
        )}
      </View>
    );
  }

  // On native platforms, use the actual LottieView
  if (!LottieView) {
    return (
      <View style={[styles.container, style]}>
        <Avatar.Icon
          size={size / 1.5}
          icon={icon}
          color={theme.colors.onPrimary}
          style={{ backgroundColor: theme.colors.primary }}
        />
        {text && (
          <Text 
            style={[styles.text, { color: theme.colors.onSurface }]}
          >
            {text}
          </Text>
        )}
      </View>
    );
  }
  
  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        style={{ width: size, height: size }}
        colorFilters={colorFilters}
      />
      {text && (
        <Text 
          style={[styles.text, { color: theme.colors.onSurface }]}
        >
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
  },
});

export { LottieWrapper };
export default LottieWrapper; 