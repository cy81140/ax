import React from 'react';
import { Appbar, useTheme } from 'react-native-paper';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { View, Image, StyleSheet } from 'react-native';

// Extend props if you need more custom actions later
interface ThemedAppbarProps extends NativeStackHeaderProps {
  // Add custom props here if needed, e.g., title, actions
}

const ThemedAppbar: React.FC<ThemedAppbarProps> = ({ navigation, back, options, route }) => {
  const theme = useTheme();

  // Use title from options, fallback to route name
  const title = options.title ?? route.name;
  // Custom title rendering if needed, or pass directly
  // const customTitle = options.headerTitle ? options.headerTitle(props) : title;

  return (
    <Appbar.Header
      // Apply theme styles or specific overrides
      style={{ backgroundColor: theme.colors.elevation.level2 }} // Example styling
      // statusBarHeight={options.headerStatusBarHeight} // Pass status bar height if needed
    >
      {back ? <Appbar.BackAction onPress={navigation.goBack} color={theme.colors.onSurface} /> : null}
      <View style={styles.titleContainer}>
        <Image 
          source={require('../../assets/app-logo.png')} 
          style={styles.logo} 
        />
        <Appbar.Content title={title} titleStyle={{ color: theme.colors.onSurface }} />
      </View>
      {/* Add Appbar.Action components here for right-side actions if needed */}
      {/* Example: <Appbar.Action icon="magnify" onPress={() => {}} /> */}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
});

export default ThemedAppbar; 