import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Image } from 'react-native';
import { Text, TextInput, Button, Chip, Portal, Dialog, IconButton, useTheme, Surface, Appbar, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { createPost, uploadImage, uploadVideo } from '../../services/database';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CreatePollForm } from '../../components/polls';
import { AminoError, ErrorTypes } from '../../utils/errors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, MainTabParamList } from '../../types/navigation';
import { postService } from '../../services/post';
import { User, Post } from '../../types/services';
import { supabase } from '../../services/supabase';

type CreateScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'Create'>;

type ContentType = 'text' | 'image' | 'video' | 'poll';

// Helper function to get blob from URI
const getBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  return await response.blob();
};

const CreateScreen = () => {
  const navigation = useNavigation<CreateScreenNavigationProp>();
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('text');
  const [postContent, setPostContent] = useState<string>('');
  const [mediaUri, setMediaUri] = useState<string | undefined>(undefined);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [showPollForm, setShowPollForm] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Request permission for media library
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload media!');
        }
      }
    })();
  }, []);

  const pickImage = async (isVideo = false) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: isVideo 
          ? ImagePicker.MediaTypeOptions.Videos 
          : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMediaUri(result.assets[0].uri);
        setContentType(isVideo ? 'video' : 'image');
        setMediaType(isVideo ? 'video' : 'image');
        setError(null);
      }
    } catch (error) {
      console.error("Image Picker Error:", error);
      setError('Failed to pick media.');
    }
  };

  const handleMediaUpload = async (): Promise<string | undefined> => {
    if (!user || !mediaUri) {
      setError('Cannot upload media. User or media URI missing.');
      return undefined;
    }
    setUploading(true);
    setError(null);
    try {
      const filePath = `${user.id}/${Date.now()}`;
      const blob = await getBlob(mediaUri);
      let result;
      if (mediaType === 'image') {
        result = await uploadImage(filePath, blob);
      } else if (mediaType === 'video') {
        result = await uploadVideo(filePath, blob);
      } else {
          throw new Error("Invalid media type for upload");
      }
      return result.publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      setError('Failed to upload media. Please try again.');
      return undefined;
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }
    
    // Verify user authentication state
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      setError('Authentication session expired. Please log in again.');
      return;
    }
    
    if (!postContent.trim() && contentType === 'text') {
      setError('Post content cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let uploadedMediaUrl: string | undefined = undefined;
      if ((contentType === 'image' || contentType === 'video') && mediaUri) {
        uploadedMediaUrl = await handleMediaUpload();
        if (!uploadedMediaUrl) {
          setLoading(false);
          return;
        }
      }

      const postPayload = {
        user_id: user.id,
        content: postContent.trim(),
        image_url: contentType === 'image' ? uploadedMediaUrl : undefined,
        video_url: contentType === 'video' ? uploadedMediaUrl : undefined,
        likes_count: 0,
        comments_count: 0,
      };

      console.log('Creating post with user_id:', user.id);
      const response = await createPost(postPayload);
      const postData = 'data' in response ? response.data : response;
      const postError = 'error' in response ? response.error : null;

      if (postError) throw postError;

      const createdPost = Array.isArray(postData) ? postData[0] : postData;

      if (!createdPost || !createdPost.id) {
          throw new Error("Post creation response did not contain valid data.");
      }

      if (contentType === 'poll') {
        setCreatedPostId(createdPost.id);
        setShowPollForm(true);
        setLoading(false);
        return;
      }

      resetForm();
      Alert.alert('Success', 'Post created successfully');
      navigation.navigate('Home' as any);

    } catch (error: any) {
      console.error("Error creating post:", error);
      setError(error?.message || "Failed to create post. Please try again.");
    } finally {
      if (contentType !== 'poll') {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setPostContent('');
    setMediaUri(undefined);
    setMediaType(null);
    setContentType('text');
    setCreatedPostId(null);
    setError(null);
    setShowPollForm(false);
    setLoading(false);
    setUploading(false);
  };

  const handlePollCreated = () => {
    resetForm();
    Alert.alert('Success', 'Poll created successfully');
    navigation.navigate('Home' as any);
  };

  const handleCancelPoll = () => {
    setShowPollForm(false);
    resetForm();
  };

  if (showPollForm && createdPostId) {
    return (
      <CreatePollForm
        postId={createdPostId}
        onPollCreated={handlePollCreated}
        onCancel={handleCancelPoll}
      />
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Create Post" />
        <Appbar.Action
          icon="send"
          onPress={handleCreatePost}
          disabled={loading || uploading || (!postContent.trim() && contentType === 'text')}
        />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          mode="outlined"
          label="What's on your mind?"
          value={postContent}
          onChangeText={setPostContent}
          multiline
          numberOfLines={4}
          style={styles.textInput}
          maxLength={500}
        />

        {mediaUri && (
          <View style={styles.mediaPreviewContainer}>
            <Image source={{ uri: mediaUri }} style={styles.mediaPreview} resizeMode="cover" />
            <IconButton
              icon="close-circle"
              style={styles.removeMediaButton}
              size={24}
              iconColor={theme.colors.error}
              onPress={() => {
                setMediaUri(undefined);
                setMediaType(null);
                setContentType('text');
              }}
            />
          </View>
        )}

        <View style={styles.chipContainer}>
          <Chip
            icon="image"
            selected={contentType === 'image'}
            onPress={() => pickImage(false)}
            disabled={uploading}
            style={styles.chip}
          >
            Image
          </Chip>
          <Chip
            icon="video"
            selected={contentType === 'video'}
            onPress={() => pickImage(true)}
            disabled={uploading}
            style={styles.chip}
          >
            Video
          </Chip>
          <Chip
            icon="poll"
            selected={contentType === 'poll'}
            onPress={() => setContentType('poll')}
            disabled={uploading}
            style={styles.chip}
          >
            Poll
          </Chip>
        </View>

        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Uploading...</Text>
          </View>
        )}

        {loading && !uploading && (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Creating Post...</Text>
            </View>
        )}

        {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  textInput: {
    marginBottom: 16,
    minHeight: 100,
  },
  chipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  chip: {
  },
  mediaPreviewContainer: {
    marginBottom: 16,
    position: 'relative',
    alignItems: 'center',
  },
  mediaPreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  removeMediaButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 16,
  },
});

export default CreateScreen; 