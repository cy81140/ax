import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Avatar, useTheme, Surface, ActivityIndicator, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'EditProfile'>;

interface ProfileFormData {
  username: string;
  bio: string;
  profile_picture?: string;
}

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    bio: '',
    profile_picture: undefined,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setFetching(false);
        setError("Not logged in.");
        return;
      }
      setFetching(true);
      setError(null);
      try {
        const profile = await userService.getProfile(user.id);
        setFormData({
          username: profile.username || '',
          bio: profile.bio || '',
          profile_picture: profile.profile_picture,
        });
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err?.message || 'Failed to load profile data.');
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const updates = {
        username: formData.username.trim(),
        bio: formData.bio.trim(),
      };

      if (!updates.username) {
          setError("Username cannot be empty.");
          setLoading(false);
          return;
      }

      await userService.updateProfile(user.id, updates);
      navigation.goBack();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickAvatar = () => {
    console.log("Pick Avatar pressed");
  };

  if (fetching) {
    return (
      <Surface style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating={true} size="large" />
      </Surface>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          {formData.profile_picture ? (
             <Avatar.Image
                size={100}
                source={{ uri: formData.profile_picture }}
             />
          ) : (
             <Avatar.Text
                size={100}
                label={formData.username?.charAt(0).toUpperCase() || 'U'}
                style={{ backgroundColor: theme.colors.primaryContainer }}
                labelStyle={{ color: theme.colors.onPrimaryContainer }}
             />
          )}
          <Button
             icon="camera"
             mode="text"
             onPress={handlePickAvatar}
             style={styles.avatarButton}
           >
            Change Avatar
           </Button>
        </View>

        <TextInput
          mode="outlined"
          label="Username"
          value={formData.username}
          onChangeText={(text: string) => setFormData(prev => ({ ...prev, username: text }))}
          style={styles.input}
          disabled={loading}
        />

        <TextInput
          mode="outlined"
          label="Bio"
          value={formData.bio}
          onChangeText={(text: string) => setFormData(prev => ({ ...prev, bio: text }))}
          multiline
          numberOfLines={4}
          style={[styles.input, styles.bioInput]}
          maxLength={150}
          disabled={loading}
        />

        {error && (
           <HelperText type="error" visible={!!error} style={styles.errorText}>
              {error}
           </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !formData.username.trim()}
          style={styles.button}
        >
          Save Changes
        </Button>
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarButton: {
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  bioInput: {
    minHeight: 100,
  },
  button: {
    marginTop: 8,
  },
  errorText: {
      marginBottom: 8,
      textAlign: 'center',
  }
});

export default EditProfileScreen; 