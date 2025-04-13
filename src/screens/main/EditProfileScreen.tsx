import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, Avatar, IconButton } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import * as ImagePicker from 'expo-image-picker';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

interface ProfileData {
  username: string;
  bio: string;
  profile_picture: string | null;
}

const EditProfileScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    bio: '',
    profile_picture: null,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, bio, profile_picture')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access media library was denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setProfileData(prev => ({
          ...prev,
          profile_picture: result.assets[0].uri,
        }));
      }
    } catch (err) {
      setError('Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!profileData.username) {
      setError('Username is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let profilePictureUrl = profileData.profile_picture;

      // Upload new profile picture if it's a local URI
      if (profileData.profile_picture?.startsWith('file://')) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(`${user?.id}/${Date.now()}.jpg`, {
            uri: profileData.profile_picture,
            type: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        profilePictureUrl = uploadData.path;
      }

      const { error } = await supabase
        .from('users')
        .update({
          username: profileData.username,
          bio: profileData.bio,
          profile_picture: profilePictureUrl,
        })
        .eq('id', user?.id);

      if (error) throw error;

      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      <View style={styles.avatarContainer}>
        {profileData.profile_picture ? (
          <Image
            source={{ uri: profileData.profile_picture }}
            style={styles.avatar}
          />
        ) : (
          <Avatar.Text
            size={100}
            label={profileData.username.slice(0, 2).toUpperCase()}
          />
        )}
        <IconButton
          icon="camera"
          size={24}
          onPress={handleImagePick}
          style={styles.cameraButton}
        />
      </View>

      <TextInput
        label="Username"
        value={profileData.username}
        onChangeText={(text) => setProfileData(prev => ({ ...prev, username: text }))}
        style={styles.input}
      />

      <TextInput
        label="Bio"
        value={profileData.bio}
        onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Save Changes
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: theme.colors.primary,
  },
  input: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  button: {
    margin: 20,
  },
  error: {
    color: theme.colors.error,
    marginHorizontal: 20,
    marginBottom: 15,
  },
});

export default EditProfileScreen; 