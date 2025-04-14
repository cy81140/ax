import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Avatar, Card, List, Divider, useTheme, Surface, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { ProfileStackParamList } from '../../navigation/types';
import { isUserAdmin } from '../../services/moderation';
import { supabase } from '../../services/supabase';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  profile_picture?: string;
  bio?: string;
  is_admin?: boolean;
}

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

// Define type for props passed to List.Item left/right render functions
type ListItemProps = { color: string; style?: any };

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<ProfileNavigationProp>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  
  // Create styles with the current theme
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  useEffect(() => {
    // Fetch the user profile (including admin status)
    if (user) {
      const fetchUserProfile = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('users')
            // Select needed fields, including is_admin
            .select('id, email, username, profile_picture, bio, is_admin')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          if (data) {
            setUserProfile(data as UserProfile);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          // Handle error display?
        } finally {
          setLoading(false);
        }
      };
      fetchUserProfile();
    } else {
      setLoading(false); // Not logged in, not loading
      setUserProfile(null); // Clear profile if user logs out
    }
  }, [user]);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleMutedUsers = () => {
    navigation.navigate('MutedUsers');
  };

  const handleReports = () => {
    // Check if Reports screen exists in ProfileStackParamList
    // navigation.navigate('Reports');
    console.log("Navigate to Reports (TODO)");
  };

  const handleAdminPanel = () => {
    // Check if AdminPanel screen exists in ProfileStackParamList
    // navigation.navigate('AdminPanel');
    console.log("Navigate to Admin Panel (TODO)");
  };

  if (loading) {
    return (
      // Use Surface for loading state
      <Surface style={styles.centerContainer}>
        <ActivityIndicator animating={true} size="large" />
      </Surface>
    );
  }

  if (!user || !userProfile) {
    return (
      // Use Surface for logged out/error state
      <Surface style={styles.centerContainer}>
        <Text variant="titleMedium">Could not load profile.</Text>
        {/* Optionally add a login button if user is null */}
      </Surface>
    );
  }

  return (
    // Use Surface as the base container
    <Surface style={styles.container}>
      <ScrollView>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {/* Use Avatar.Image if picture exists */}
            {userProfile.profile_picture ? (
              <Avatar.Image size={80} source={{ uri: userProfile.profile_picture }} />
            ) : (
              <Avatar.Text size={80} label={userProfile.username.charAt(0).toUpperCase()} />
            )}
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.username}>{userProfile.username}</Text>
              <Text variant="bodyMedium" style={styles.email}>{userProfile.email}</Text>
              {userProfile.is_admin && (
                <Text variant="labelMedium" style={styles.adminBadge}>Admin</Text>
              )}
            </View>
          </View>
          <Card.Actions style={styles.profileCardActions}>
            <Button mode="contained" icon="pencil" onPress={handleEditProfile}>
              Edit Profile
            </Button>
            {/* Remove settings button here? It's in the list below */}
            {/* <Button mode="outlined" onPress={handleSettings} style={styles.settingsButton}>\n              Settings\n            </Button> */}
          </Card.Actions>
        </Card>

        <Card style={styles.menuCard}>
          <List.Section>
            <List.Subheader>Account</List.Subheader>
            <List.Item
              title="Settings"
              left={(props: ListItemProps) => <List.Icon {...props} icon="cog-outline" />}
              right={(props: ListItemProps) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleSettings}
            />
            <List.Item
              title="Muted Users"
              left={(props: ListItemProps) => <List.Icon {...props} icon="account-cancel-outline" />}
              right={(props: ListItemProps) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleMutedUsers}
            />
            <List.Item
              title="Your Reports"
              left={(props: ListItemProps) => <List.Icon {...props} icon="flag-outline" />}
              right={(props: ListItemProps) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleReports}
            />
            <Divider style={styles.divider}/>

            {userProfile.is_admin && (
              <>
                <List.Subheader>Administration</List.Subheader>
                <List.Item
                  title="Admin Panel"
                  description="Manage reports and moderate content"
                  left={(props: ListItemProps) => <List.Icon {...props} icon="shield-account-outline" />}
                  right={(props: ListItemProps) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={handleAdminPanel}
                />
                <Divider style={styles.divider}/>
              </>
            )}

            <List.Subheader>Other</List.Subheader>
            <List.Item
              title="Sign Out"
              titleStyle={{ color: theme.colors.error }}
              left={(props: ListItemProps) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
              onPress={signOut}
            />
          </List.Section>
        </Card>
      </ScrollView>
    </Surface>
  );
};

// Create styles function that takes theme as a parameter
const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor handled by Surface
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  profileCard: {
    margin: 16,
    // padding: 16, // Handled by Card content/actions padding
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, // Add padding here
    // marginBottom: 16, // Removed, spacing handled by Card structure
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  username: {
    // Using variant="headlineSmall"
    // fontSize: 24,
    // fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    // Using variant="bodyMedium"
    // fontSize: 14,
    // opacity: 0.8,
    color: theme.colors.onSurfaceVariant, // Make email less prominent
  },
  adminBadge: {
    color: theme.colors.primary,
    // Using variant="labelMedium"
    // fontWeight: 'bold',
    marginTop: 4,
  },
  profileCardActions: {
    justifyContent: 'flex-end', // Align actions to the right
    paddingBottom: 8, // Add padding below buttons
  },
  // settingsButton style removed
  menuCard: {
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 16,
  },
  divider: {
    // Add margin or use List.Section bottom margin
    // marginVertical: 8,
  },
});

export default ProfileScreen; 