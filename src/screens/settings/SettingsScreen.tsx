import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Card, List, Switch, Divider, Surface, useTheme, Avatar, IconButton, Badge, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemeToggle from '../../components/ThemeToggle';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

type SettingsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Settings'>;

// Don't animate the Card itself (which causes typing issues)
// Instead wrap the Card in an Animated.View
// Type for List.Icon props
type ListIconProps = {
  color: string;
  style: {
    marginLeft?: number;
    marginRight?: number;
    marginVertical?: number;
  };
};

const SettingsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);
  const [dataUsageReduced, setDataUsageReduced] = React.useState(false);

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Surface style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>Settings</Text>
          <IconButton 
            icon="arrow-left" 
            size={24} 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          />
          <Badge visible={true} size={8} style={styles.badge} />
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* User Profile Quick Access */}
          <TouchableRipple onPress={() => navigation.navigate('Profile')}>
            <Animated.View
              style={styles.profileCard}
              entering={FadeInDown.delay(100).duration(500)}
            >
              <Card>
                <View style={styles.profileContent}>
                  <Avatar.Text 
                    size={50} 
                    label={user?.email?.charAt(0).toUpperCase() || 'U'} 
                    style={styles.avatar}
                  />
                  <View style={styles.profileInfo}>
                    <Text variant="titleMedium" style={styles.username}>
                      {user?.email || 'User Profile'}
                    </Text>
                    <Text variant="bodySmall" style={styles.emailText}>
                      Tap to view profile
                    </Text>
                  </View>
                  <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={24} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                </View>
              </Card>
            </Animated.View>
          </TouchableRipple>

          <Animated.View
            style={styles.card}
            entering={FadeInRight.delay(200).duration(400)}
          >
            <Card>
              <List.Subheader style={styles.subheader}>Appearance</List.Subheader>
              <Card.Content>
                <ThemeToggle useSwitchStyle={false} />
              </Card.Content>
            </Card>
          </Animated.View>

          <Animated.View
            style={styles.card}
            entering={FadeInRight.delay(300).duration(400)}
          >
            <Card>
              <List.Subheader style={styles.subheader}>Notifications</List.Subheader>
              <Card.Content>
                <List.Item
                  title="Enable notifications"
                  left={(props: ListIconProps) => <List.Icon {...props} icon="bell-outline" />}
                  right={() => (
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={setNotificationsEnabled}
                      color={theme.colors.primary}
                    />
                  )}
                />
                <Divider style={styles.divider} />
                <List.Item
                  title="New messages"
                  left={(props: ListIconProps) => <List.Icon {...props} icon="message-outline" />}
                  right={() => <Switch value={true} disabled={!notificationsEnabled} color={theme.colors.primary} />}
                  disabled={!notificationsEnabled}
                />
                <Divider style={styles.divider} />
                <List.Item
                  title="New followers"
                  left={(props: ListIconProps) => <List.Icon {...props} icon="account-plus-outline" />}
                  right={() => <Switch value={true} disabled={!notificationsEnabled} color={theme.colors.primary} />}
                  disabled={!notificationsEnabled}
                />
                <Divider style={styles.divider} />
                <List.Item
                  title="Mentions"
                  left={(props: ListIconProps) => <List.Icon {...props} icon="at" />}
                  right={() => <Switch value={true} disabled={!notificationsEnabled} color={theme.colors.primary} />}
                  disabled={!notificationsEnabled}
                />
              </Card.Content>
            </Card>
          </Animated.View>

          <Animated.View
            style={styles.card}
            entering={FadeInRight.delay(400).duration(400)}
          >
            <Card>
              <List.Subheader style={styles.subheader}>Privacy</List.Subheader>
              <Card.Content>
                <List.Item
                  title="Location services"
                  description="Allow app to access your location"
                  left={(props: ListIconProps) => <List.Icon {...props} icon="map-marker-outline" />}
                  right={() => (
                    <Switch
                      value={locationEnabled}
                      onValueChange={setLocationEnabled}
                      color={theme.colors.primary}
                    />
                  )}
                />
                <Divider style={styles.divider} />
                <List.Item
                  title="Data usage"
                  description="Reduce data usage when on cellular"
                  left={(props: ListIconProps) => <List.Icon {...props} icon="cellphone" />}
                  right={() => (
                    <Switch
                      value={dataUsageReduced}
                      onValueChange={setDataUsageReduced}
                      color={theme.colors.primary}
                    />
                  )}
                />
              </Card.Content>
            </Card>
          </Animated.View>

          <Animated.View
            style={styles.card}
            entering={FadeInRight.delay(500).duration(400)}
          >
            <Card>
              <List.Subheader style={styles.subheader}>About</List.Subheader>
              <Card.Content>
                <List.Item
                  title="Version"
                  description="1.0.0"
                  left={(props: ListIconProps) => <List.Icon {...props} icon="information-outline" />}
                />
                <Divider style={styles.divider} />
                <TouchableRipple onPress={() => navigation.navigate('TermsOfService')}>
                  <List.Item
                    title="Terms of Service"
                    left={(props: ListIconProps) => <List.Icon {...props} icon="file-document-outline" />}
                    right={(props: ListIconProps) => <List.Icon {...props} icon="chevron-right" />}
                  />
                </TouchableRipple>
                <Divider style={styles.divider} />
                <TouchableRipple onPress={() => navigation.navigate('PrivacyPolicy')}>
                  <List.Item
                    title="Privacy Policy"
                    left={(props: ListIconProps) => <List.Icon {...props} icon="shield-account-outline" />}
                    right={(props: ListIconProps) => <List.Icon {...props} icon="chevron-right" />}
                  />
                </TouchableRipple>
                <Divider style={styles.divider} />
                <TouchableRipple onPress={() => navigation.navigate('Debug')}>
                  <List.Item
                    title="Supabase Debug"
                    description="Troubleshoot connection issues"
                    left={(props: ListIconProps) => <List.Icon {...props} icon="database-check" />}
                    right={(props: ListIconProps) => <List.Icon {...props} icon="chevron-right" />}
                  />
                </TouchableRipple>
              </Card.Content>
            </Card>
          </Animated.View>
        </ScrollView>
      </Surface>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: 16,
  },
  backButton: {
    left: 8,
    position: 'absolute',
  },
  badge: {
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    right: 20,
    top: 20,
  },
  card: {
    borderRadius: 16,
    margin: 12,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
  },
  divider: {
    height: 0.5,
    marginLeft: 54,
  },
  emailText: {
    color: theme.colors.onSurfaceVariant,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    position: 'relative',
  },
  headerTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileCard: {
    borderRadius: 16,
    margin: 12,
    overflow: 'hidden',
  },
  profileContent: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 16,
  },
  profileInfo: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  subheader: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    fontWeight: 'bold',
  },
});

export default SettingsScreen;