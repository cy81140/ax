import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ImageBackground, Platform } from 'react-native';
import { Text, Button, Avatar, Card, List, Divider, useTheme, Surface, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { MainStackParamList } from '../../navigation/types';
import { isUserAdmin } from '../../services/moderation';
import { supabase } from '../../services/supabase';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  profile_picture?: string;
  bio?: string;
  is_admin?: boolean;
}

// Use MainStackParamList for navigation as it contains all the routes needed
type ProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Define type for props passed to List.Item left/right render functions
type ListItemProps = { color: string; style?: any };

const AnimatedView = Animated.createAnimatedComponent(View);

// Shadow styles for Android/iOS
const cardShadow = (elevation: number) => ({
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity: 0.1,
      shadowRadius: elevation * 2,
    },
    android: {
      elevation,
    },
  }),
});

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
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
    navigation.navigate('Reports');
  };

  const handleAdminPanel = () => {
    navigation.navigate('AdminPanel');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <Surface style={styles.centerContainer}>
          <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </Surface>
      </SafeAreaView>
    );
  }

  if (!user || !userProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <Surface style={styles.centerContainer}>
          <Text variant="titleMedium">Could not load profile.</Text>
          <Button mode="contained" style={styles.errorButton} onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </Surface>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="light" />
      <Surface style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Header with Gradient */}
          <View style={styles.profileHeaderContainer}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            />
            <View style={styles.headerContent}>
              <IconButton
                icon="arrow-left"
                size={24}
                iconColor="#fff"
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              />
              
              <AnimatedView entering={FadeIn.duration(800)} style={styles.avatarContainer}>
                {userProfile.profile_picture ? (
                  <Avatar.Image 
                    size={100} 
                    source={{ uri: userProfile.profile_picture }} 
                    style={styles.avatar}
                  />
                ) : (
                  <Avatar.Text 
                    size={100} 
                    label={userProfile.username.charAt(0).toUpperCase()} 
                    style={styles.avatar}
                  />
                )}
              </AnimatedView>
              
              <AnimatedView entering={FadeInDown.delay(200).duration(500)} style={styles.profileTextContainer}>
                <Text variant="headlineMedium" style={styles.username}>
                  {userProfile.username}
                </Text>
                <Text variant="bodyMedium" style={styles.email}>
                  {userProfile.email}
                </Text>
                
                <View style={styles.chipsContainer}>
                  {userProfile.is_admin && (
                    <Chip 
                      icon="shield-account" 
                      style={styles.adminChip}
                      textStyle={styles.chipText}
                    >
                      Admin
                    </Chip>
                  )}
                  <Chip 
                    icon="account-check" 
                    style={styles.userChip}
                    textStyle={styles.chipText}
                  >
                    Verified
                  </Chip>
                </View>
              </AnimatedView>
            </View>
          </View>
          
          {/* Bio Section */}
          <AnimatedView entering={FadeInDown.delay(300).duration(500)}>
            <Card 
              style={[styles.bioCard, cardShadow(2)]} 
            >
              <Card.Content>
                <View style={styles.bioHeader}>
                  <Text variant="titleMedium" style={styles.bioTitle}>
                    Bio
                  </Text>
                  <Button 
                    mode="text" 
                    icon="pencil" 
                    onPress={handleEditProfile}
                    style={styles.editButton}
                  >
                    Edit
                  </Button>
                </View>
                <Text variant="bodyMedium" style={styles.bioText}>
                  {userProfile.bio || "No bio yet. Tap edit to add one!"}
                </Text>
              </Card.Content>
            </Card>
          </AnimatedView>

          {/* Account Options */}
          <AnimatedView entering={FadeInDown.delay(400).duration(500)}>
            <Card 
              style={[styles.menuCard, cardShadow(1)]} 
            >
              <Card.Content>
                <List.Section>
                  <List.Subheader style={styles.listSubheader}>Account</List.Subheader>
                  <List.Item
                    title="Settings"
                    titleStyle={styles.listItemTitle}
                    left={(props: ListItemProps) => <List.Icon {...props} icon="cog-outline" color={theme.colors.primary} />}
                    right={(props: ListItemProps) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
                    onPress={handleSettings}
                    style={styles.listItem}
                  />
                  <Divider style={styles.divider}/>
                  <List.Item
                    title="Muted Users"
                    titleStyle={styles.listItemTitle}
                    left={(props: ListItemProps) => <List.Icon {...props} icon="account-cancel-outline" color={theme.colors.primary} />}
                    right={(props: ListItemProps) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
                    onPress={handleMutedUsers}
                    style={styles.listItem}
                  />
                  <Divider style={styles.divider}/>
                  <List.Item
                    title="Your Reports"
                    titleStyle={styles.listItemTitle}
                    left={(props: ListItemProps) => <List.Icon {...props} icon="flag-outline" color={theme.colors.primary} />}
                    right={(props: ListItemProps) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
                    onPress={handleReports}
                    style={styles.listItem}
                  />
                </List.Section>
              </Card.Content>
            </Card>
          </AnimatedView>

          {/* Admin Options */}
          {userProfile.is_admin && (
            <AnimatedView entering={FadeInDown.delay(500).duration(500)}>
              <Card 
                style={[styles.menuCard, cardShadow(1)]} 
              >
                <Card.Content>
                  <List.Section>
                    <List.Subheader style={styles.listSubheader}>Administration</List.Subheader>
                    <List.Item
                      title="Admin Panel"
                      description="Manage reports and moderate content"
                      titleStyle={styles.listItemTitle}
                      descriptionStyle={styles.listItemDescription}
                      left={(props: ListItemProps) => <List.Icon {...props} icon="shield-account-outline" color={theme.colors.primary} />}
                      right={(props: ListItemProps) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
                      onPress={handleAdminPanel}
                      style={styles.listItem}
                    />
                  </List.Section>
                </Card.Content>
              </Card>
            </AnimatedView>
          )}

          {/* Sign Out Option */}
          <AnimatedView entering={FadeInDown.delay(600).duration(500)}>
            <Card 
              style={[styles.menuCard, cardShadow(1)]} 
            >
              <Card.Content>
                <List.Section>
                  <List.Subheader style={styles.listSubheader}>Other</List.Subheader>
                  <List.Item
                    title="Sign Out"
                    titleStyle={[styles.listItemTitle, { color: theme.colors.error }]}
                    left={(props: ListItemProps) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
                    onPress={signOut}
                    style={styles.listItem}
                  />
                </List.Section>
              </Card.Content>
            </Card>
          </AnimatedView>
          
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </Surface>
    </SafeAreaView>
  );
};

// Create styles function that takes theme as a parameter
const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  adminChip: {
    backgroundColor: theme.colors.errorContainer,
    marginRight: 8,
  },
  avatar: {
    borderColor: 'white',
    borderWidth: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    left: 10,
    position: 'absolute',
    top: 10,
  },
  bioCard: {
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  bioHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bioText: {
    lineHeight: 22,
  },
  bioTitle: {
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  chipText: {
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  chipsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  container: {
    flex: 1,
  },
  divider: {
    marginLeft: 54,
  },
  editButton: {
    margin: 0,
    padding: 0,
  },
  email: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  errorButton: {
    marginTop: 16,
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 20,
  },
  headerGradient: {
    height: '100%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  listItem: {
    paddingVertical: 8,
  },
  listItemDescription: {
    fontSize: 12,
  },
  listItemTitle: {
    fontWeight: '500',
  },
  listSubheader: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: theme.colors.onSurface,
    marginTop: 12,
  },
  menuCard: {
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  profileHeaderContainer: {
    height: 260,
    marginBottom: 16,
    position: 'relative',
  },
  profileTextContainer: {
    alignItems: 'center',
  },
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  userChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default ProfileScreen; 