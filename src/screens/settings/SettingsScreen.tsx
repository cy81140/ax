import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, Card, List, Switch, Divider, Surface, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemeToggle from '../../components/ThemeToggle';

const SettingsScreen = () => {
  const theme = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);
  const [dataUsageReduced, setDataUsageReduced] = React.useState(false);

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Surface style={styles.container}>
        <ScrollView>
          <Card style={styles.card}>
            <List.Subheader>Appearance</List.Subheader>
            <Card.Content>
              <ThemeToggle useSwitchStyle={false} />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <List.Subheader>Notifications</List.Subheader>
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
                right={() => <Switch value={true} disabled={!notificationsEnabled} />}
                disabled={!notificationsEnabled}
              />
              <Divider />
              <List.Item
                title="New followers"
                right={() => <Switch value={true} disabled={!notificationsEnabled} />}
                disabled={!notificationsEnabled}
              />
              <Divider />
              <List.Item
                title="Mentions"
                right={() => <Switch value={true} disabled={!notificationsEnabled} />}
                disabled={!notificationsEnabled}
              />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <List.Subheader>Privacy</List.Subheader>
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
            <List.Subheader>About</List.Subheader>
            <Card.Content>
              <List.Item
                title="Version"
                description="1.0.0"
                right={() => <List.Icon icon="information-outline" />}
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
      </Surface>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
});

export default SettingsScreen;