import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Image, Text } from 'react-native';
import { TextInput, Button, Avatar, useTheme, Surface, ActivityIndicator, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, ProfileStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { uploadProfileImage } from '../../services/database';
import { supabase } from '../../services/supabase';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

interface ProfileFormData {
  username: string;
  bio: string;
  profile_picture?: string;
}

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { user, session } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    bio: '',
    profile_picture: undefined,
  });

  useEffect(() => {
    // Request permission for media library
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'We need access to your photos to change your avatar.');
        }
      }
    })();

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
          username: profile.data?.username || '',
          bio: profile.data?.bio || '',
          profile_picture: profile.data?.profile_picture,
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
    if (!user) {
      setError("You must be logged in to update your profile.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Create updates object with username and bio
      const updates: any = {
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        // Always include email for new profile creation
        email: user.email || `${user.id}@placeholder.com`
      };

      if (!updates.username) {
        setError("Username cannot be empty.");
        setLoading(false);
        return;
      }

      // Upload the selected image to Supabase storage if one was selected
      if (selectedImage) {
        try {
          setUploadingImage(true);
          
          console.log("Starting profile image upload process");
          
          // Ensure we have the current user ID from session
          if (!session || !session.user) {
            throw new Error("Authentication session missing.");
          }
          const currentUserId = session.user.id;
          
          // Convert URI to blob
          const response = await fetch(selectedImage);
          const blob = await response.blob();
          
          // Generate a unique filename with timestamp
          const timestamp = new Date().getTime();
          const filename = `profile-${timestamp}.${selectedImage.split('.').pop() || 'jpg'}`;
          
          console.log("Uploading profile image:", filename);
          
          // Call the actual upload function, passing the user ID
          const { publicUrl, error: uploadResultError } = await uploadProfileImage(currentUserId, filename, blob);
          
          if (uploadResultError) {
            console.error('Error uploading profile image:', uploadResultError);
            // Check if it was a fallback
            if (uploadResultError.fallback) {
              console.log("Upload failed, using placeholder as fallback.");
              updates.profile_picture = uploadResultError.publicUrl; // Use the fallback URL
              Alert.alert(
                "Upload Failed",
                "Could not upload your selected avatar. A placeholder has been used instead."
              );
            } else {
              throw new Error(uploadResultError.message || 'Failed to upload image');
            }
          } else {
            console.log("Upload successful, URL:", publicUrl);
            updates.profile_picture = publicUrl; // Use the real URL
          }
          
          setUploadingImage(false);
          
        } catch (uploadError: any) {
          console.error('Error handling profile picture:', uploadError);
          setError(`Could not process avatar: ${uploadError.message || 'Unknown error'}`);
          setUploadingImage(false);
          setLoading(false);
          return;
        }
      }

      console.log("Updating profile with:", updates);
      
      // Verify authentication using the session from AuthContext
      if (!session || !session.user) {
        console.error('Authentication error: No active session found in context.');
        setError("Authentication error. Please log in again.");
        setLoading(false);
        return;
      }
      
      const currentUserId = session.user.id;
        
      // Direct database operation with RLS-compatible approach
      try {
        // Try insert first (handles case where profile doesn't exist)
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: currentUserId, // Use currentUserId from session
            username: updates.username,
            bio: updates.bio || '',
            email: updates.email,
            profile_picture: updates.profile_picture
          });
        
        if (!insertError) {
          Alert.alert("Success", "Your profile has been created successfully.");
          navigation.goBack();
          return;
        }
        
        // If insert failed with duplicate key, try update
        if (insertError.code === '23505') {
          console.log("Profile exists. Trying update...");
          
          const { error: updateError } = await supabase
            .from('users')
            .update({
              username: updates.username,
              bio: updates.bio || '',
              profile_picture: updates.profile_picture
            })
            .eq('id', currentUserId); // Use currentUserId from session
          
          if (!updateError) {
            Alert.alert("Success", "Your profile has been updated successfully.");
            navigation.goBack();
            return;
          }
          
          console.error("Update failed:", updateError);
          throw updateError;
        }
        
        // If we got here, both insert and conditional update failed
        console.error("Insert failed:", insertError);
        throw insertError;
      } catch (dbError: any) {
        console.error("Database operation failed:", dbError);
        
        // Last resort - try updating auth user metadata
        if (dbError.code === '42501') { // RLS violation
          try {
            console.log("Trying auth metadata update as fallback...");
            const { error: metadataError } = await supabase.auth.updateUser({
              data: { 
                username: updates.username,
                bio: updates.bio,
                profile_picture: updates.profile_picture
              }
            });
            
            if (metadataError) throw metadataError;
            
            Alert.alert("Partial Success", "Basic profile information updated.");
            navigation.goBack();
          } catch (authUpdateError) {
            console.error("Auth metadata update failed:", authUpdateError);
            setError("Couldn't update profile due to permission issues. Please contact support.");
          }
        } else {
          setError(dbError?.message || 'Failed to update profile.');
        }
      }
    } catch (error: any) {
      console.error('General error in profile update:', error);
      setError(error?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    if (!user) {
      setError("You must be logged in to update your avatar.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // Just store the selected image URI locally
        setSelectedImage(imageUri);
        
        // Update the preview immediately
        setFormData(prev => ({
          ...prev,
          profile_picture: imageUri
        }));
      }
    } catch (pickError: any) {
      console.error('Image Picker Error:', pickError);
      setError(`Failed to select image: ${pickError.message || 'Unknown error'}`);
    }
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
             disabled={loading || uploadingImage}
             style={styles.avatarButton}
           >
            Select New Avatar
           </Button>
          {selectedImage && (
            <Text style={styles.imageSelectedText}>
              New avatar selected. Save to apply changes.
            </Text>
          )}
          {uploadingImage && (
            <ActivityIndicator animating={true} size="small" style={{ marginTop: 8 }} />
          )}
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
  avatarButton: {
    marginTop: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bioInput: {
    minHeight: 100,
  },
  button: {
    marginTop: 8,
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  errorText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  imageSelectedText: {
    color: 'green',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  scrollContent: {
    padding: 16,
  }
});

export default EditProfileScreen; 