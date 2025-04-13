import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Switch, SegmentedButtons } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';

type ThemeToggleProps = {
  label?: string;
  useSwitchStyle?: boolean;
};

/**
 * ThemeToggle component that allows users to switch between light, dark, and system themes
 * Can be displayed as either a switch (just toggles dark/light) or segmented buttons (for all options)
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  label = 'Dark Mode', 
  useSwitchStyle = false 
}) => {
  const { themeType, setThemeType, isDarkMode } = useTheme();

  const handleThemeChange = (value: string) => {
    setThemeType(value as 'light' | 'dark' | 'system');
  };

  // Simple switch just toggles between light and dark
  if (useSwitchStyle) {
    const toggleSwitch = () => {
      setThemeType(isDarkMode ? 'light' : 'dark');
    };

    return (
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleSwitch}
        />
      </View>
    );
  }

  // Full segmented buttons shows all options
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Theme</Text>
      <SegmentedButtons
        value={themeType}
        onValueChange={handleThemeChange}
        buttons={[
          {
            value: 'light',
            icon: 'white-balance-sunny',
            label: 'Light',
          },
          {
            value: 'dark',
            icon: 'moon-waning-crescent',
            label: 'Dark',
          },
          {
            value: 'system',
            icon: 'theme-light-dark',
            label: 'Auto',
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
});

export default ThemeToggle; 