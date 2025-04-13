import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const tabIcons = {
  Home: 'home',
  Chat: 'chat',
  Create: 'plus-circle',
  Search: 'magnify',
  Activity: 'bell',
  ProfileTab: 'account',
  Settings: 'cog',
} as const;

/**
 * A custom themed tab bar component that applies consistent theme styling
 */
export function ThemedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.background,
      borderTopColor: theme.colors.outline
    }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconName = tabIcons[route.name as keyof typeof tabIcons] || 'help-circle';
        const label = options.tabBarLabel || route.name;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tab}
          >
            <MaterialCommunityIcons
              name={iconName}
              size={24}
              color={isFocused ? theme.colors.primary : theme.colors.onSurface}
            />
            {typeof label === 'string' && (
              <Text 
                style={{ 
                  fontSize: 10, 
                  color: isFocused ? theme.colors.primary : theme.colors.onSurface,
                  marginTop: 2
                }}
              >
                {label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    flexDirection: 'row',
    height: 60,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export default ThemedTabBar; 