import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Avatar, Card, List, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { ProfileStackParamList } from '../../navigation/types';
import { isUserAdmin } from '../../services/moderation';
import { ListItemProps } from 'react-native-paper';
import { supabase } from '../../services/supabase';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  profile_picture?: string;
}

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<ProfileNavigationProp>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { theme } = useTheme();
  
  // Create styles with the current theme
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  useEffect(() => {
    // Check if user is an admin
    if (user) {
      isUserAdmin(user.id).then(({ isAdmin }) => {
        setIsAdmin(isAdmin);
      });
      
      // Fetch the user profile
      const fetchUserProfile = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, username, profile_picture')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          setUserProfile(data);
        }
      };
      
      fetchUserProfile();
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
    navigation.navigate('Reports');
  };

  const handleAdminPanel = () => {
    navigation.navigate('AdminPanel');
  };

  if (!user || !userProfile) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar.Text size={80} label={userProfile.username.charAt(0).toUpperCase()} />
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{userProfile.username}</Text>
            <Text style={styles.email}>{userProfile.email}</Text>
            {isAdmin && <Text style={styles.adminBadge}>Admin</Text>}
          </View>
        </View>
        <Card.Actions>
          <Button mode="contained" onPress={handleEditProfile}>
            Edit Profile
          </Button>
          <Button mode="outlined" onPress={handleSettings} style={styles.settingsButton}>
            Settings
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.menuCard}>
        <List.Section>
          <List.Subheader>Account</List.Subheader>
          <List.Item
            title="Settings"
            left={(props: any) => <List.Icon {...props} icon="cog" />}
            right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleSettings}
          />
          <List.Item
            title="Muted Users"
            left={(props: any) => <List.Icon {...props} icon="volume-off" />}
            right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleMutedUsers}
          />
          <List.Item
            title="Your Reports"
            left={(props: any) => <List.Icon {...props} icon="flag" />}
            right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleReports}
          />
          <Divider />
          
          {isAdmin && (
            <>
              <List.Subheader>Administration</List.Subheader>
              <List.Item
                title="Admin Panel"
                description="Manage reports and moderate content"
                left={(props: any) => <List.Icon {...props} icon="shield-account" />}
                right={(props: any) => <List.Icon {...props} icon="chevron-right" />}
                onPress={handleAdminPanel}
              />
              <Divider />
            </>
          )}
          
          <List.Subheader>Other</List.Subheader>
          <List.Item
            title="Sign Out"
            left={(props: any) => <List.Icon {...props} icon="logout" />}
            onPress={signOut}
          />
        </List.Section>
      </Card>
    </ScrollView>
  );
};

// Create styles function that takes theme as a parameter
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileCard: {
    margin: 16,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    opacity: 0.8,
  },
  adminBadge: {
    marginTop: 4,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  settingsButton: {
    marginLeft: 8,
  },
  menuCard: {
    margin: 16,
  },
});

export default ProfileScreen; 