import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, List, Switch, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

const SettingsScreen = () => {
  const { theme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);
  const [dataUsageReduced, setDataUsageReduced] = React.useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Title title="Appearance" />
          <Card.Content>
            <ThemeToggle useSwitchStyle={false} />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Notifications" />
          <Card.Content>
            <List.Item
              title="Enable notifications"
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
            <Divider />
            <List.Item
              title="New messages"
              right={() => <Switch value={true} />}
              disabled={!notificationsEnabled}
            />
            <Divider />
            <List.Item
              title="New followers"
              right={() => <Switch value={true} />}
              disabled={!notificationsEnabled}
            />
            <Divider />
            <List.Item
              title="Mentions"
              right={() => <Switch value={true} />}
              disabled={!notificationsEnabled}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Privacy" />
          <Card.Content>
            <List.Item
              title="Location services"
              description="Allow app to access your location"
              right={() => (
                <Switch
                  value={locationEnabled}
                  onValueChange={setLocationEnabled}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Data usage"
              description="Reduce data usage when on cellular"
              right={() => (
                <Switch
                  value={dataUsageReduced}
                  onValueChange={setDataUsageReduced}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="About" />
          <Card.Content>
            <List.Item
              title="Version"
              description="1.0.0"
              right={() => <List.Icon icon="information" />}
            />
            <Divider />
            <List.Item
              title="Terms of Service"
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => {}}
            />
            <Divider />
            <List.Item
              title="Privacy Policy"
              right={() => <List.Icon icon="chevron-right" />}
              onPress={() => {}}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    elevation: 2,
    margin: 10,
  },
  container: {
    flex: 1,
  },
});

export default SettingsScreen;