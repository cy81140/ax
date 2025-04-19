import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Image, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Chip, Portal, Dialog, IconButton, useTheme, Surface, Appbar, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { postService } from '../../services/posts';
import { uploadFile } from '../../services/upload';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CreatePollForm } from '../../components/polls';
import { AminoError, ErrorTypes } from '../../utils/errors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, MainTabParamList } from '../../navigation/types';
import { User, Post } from '../../types/services';
import { supabase } from '../../services/supabase';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { NavigatorScreenParams } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type CreateScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Create'>;

type ContentType = 'text' | 'image' | 'video' | 'poll';

// Helper function to get blob from URI
const getBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  return await response.blob();
};

// Helper to convert Blob to a File-like object for uploadFile
const blobToFile = (blob: Blob, fileName: string): File => {
  // Create a File from the Blob
  return new File([blob], fileName, { type: blob.type });
};

// Loading overlay component
const LoadingOverlay = () => {
  const theme = useTheme();
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Creating post...</Text>
    </View>
  );
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
    if (!mediaUri || !mediaType) return undefined;
    setUploading(true);
    
    try {
      // Create a meaningful file name with timestamp to prevent collisions
      const timestamp = Date.now();
      const fileExt = mediaType === 'image' ? '.jpg' : '.mp4';
      const fileName = `post_${timestamp}${fileExt}`;
      const filePath = `posts/${fileName}`;
      
      // Convert URI to blob
      const blob = await getBlob(mediaUri);
      
      try {
        // Convert blob to File-like object
        const fileObject = blobToFile(blob, fileName);
        
        // Use uploadFile from the upload service
        const { data: uploadData, error: uploadError } = await uploadFile(
          fileObject, 
          'posts', 
          '', // Use empty path as the filename already contains the path
          fileName
        );
        
        if (uploadError) throw uploadError;
        
        // Get the full URL of the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from('posts')
          .getPublicUrl(uploadData.path);
          
        return publicUrlData.publicUrl;
      } catch (error) {
        console.error('Error in media upload:', error);
        throw error;
      }
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

      // Create correct payload for postService.createPost
      const createPostParams = {
        userId: user.id,
        content: postContent.trim(),
        mediaUrls: uploadedMediaUrl ? [uploadedMediaUrl] : [],
        mentions: [],
        provinces: []
      };

      console.log('Creating post with user_id:', user.id);
      const { data: createdPost, error: postError } = await postService.createPost(createPostParams);

      if (postError) throw postError;

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
      navigation.navigate('Home');

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
    navigation.navigate('Home');
  };

  const handleCancelPoll = () => {
    setShowPollForm(false);
    resetForm();
  };

  const handleCancel = () => {
    // Clear form data
    setPostContent('');
    setMediaUri(undefined);
    setMediaType(null);
    setContentType('text');
    
    // Correctly navigate to the nested Home screen within the Main tab navigator
    navigation.navigate('Home'); // Assuming CreateScreen is part of MainTabNavigator
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View entering={FadeIn.duration(300)}>
        <Surface style={styles.headerSurface} elevation={1}>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Surface>
      </Animated.View>

      <ScrollView style={styles.content}>
        <Animated.View entering={SlideInUp.delay(100).duration(400)}>
          <Surface style={styles.inputSurface} elevation={1}>
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
              autoFocus
              value={postContent}
              onChangeText={setPostContent}
            />
          </Surface>
        </Animated.View>

        {mediaUri && (
          <Animated.View entering={FadeIn.delay(200).duration(300)}>
            <Surface style={styles.mediaSurface} elevation={2}>
              <View style={styles.mediaPreviewContainer}>
                <Image source={{ uri: mediaUri }} style={styles.mediaPreview} resizeMode="cover" />
                <IconButton
                  icon="close-circle"
                  size={24}
                  style={styles.removeMediaButton}
                  onPress={() => {
                    setMediaUri(undefined);
                    setMediaType(null);
                    setContentType('text');
                  }}
                  iconColor="#fff"
                />
              </View>
            </Surface>
          </Animated.View>
        )}

        <Animated.View entering={SlideInUp.delay(200).duration(400)}>
          <Surface style={styles.optionsSurface} elevation={1}>
            <Text style={styles.optionsTitle}>Add to your post</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: theme.colors.primary + '20' }]}
                onPress={() => pickImage(false)}
                accessibilityRole="button"
                accessibilityLabel="Add photo"
                accessibilityHint="Select a photo from your gallery"
              >
                <MaterialCommunityIcons name="image-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.optionText, { color: theme.colors.primary }]}>Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: theme.colors.error + '20' }]}
                onPress={() => pickImage(true)}
                accessibilityRole="button"
                accessibilityLabel="Add video"
                accessibilityHint="Select a video from your gallery"
              >
                <MaterialCommunityIcons name="video-outline" size={24} color={theme.colors.error} />
                <Text style={[styles.optionText, { color: theme.colors.error }]}>Video</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: theme.colors.tertiary + '20' }]}
                onPress={() => setContentType('poll')}
                accessibilityRole="button"
                accessibilityLabel="Create poll"
                accessibilityHint="Create a poll for others to vote on"
              >
                <MaterialCommunityIcons name="poll" size={24} color={theme.colors.tertiary} />
                <Text style={[styles.optionText, { color: theme.colors.tertiary }]}>Poll</Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </Animated.View>
      </ScrollView>

      <Animated.View 
        entering={SlideInUp.delay(300).duration(400)}
        style={[styles.bottomButtonContainer, { backgroundColor: theme.colors.background }]}
      >
        <Button
          mode="contained"
          onPress={handleCreatePost}
          loading={loading}
          disabled={loading || (!postContent.trim() && contentType === 'text')}
          style={styles.postButton}
          contentStyle={styles.postButtonContent}
          labelStyle={styles.postButtonLabel}
        >
          Post
        </Button>
      </Animated.View>
      
      {loading && <LoadingOverlay />}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomButtonContainer: {
    backgroundColor: 'white',
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderTopWidth: 1,
    padding: 16,
  },
  cancelButton: {
    left: 16,
    position: 'absolute',
  },
  cancelText: {
    color: '#fff',
    fontWeight: '500',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
  },
  headerSurface: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#5D3FD3', // Match RegionListScreen
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputSurface: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mediaPreview: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    height: 200,
    justifyContent: 'center',
    width: '100%',
  },
  mediaPreviewContainer: {
    position: 'relative',
  },
  mediaSurface: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  optionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
  },
  optionText: {
    fontWeight: '500',
    marginLeft: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionsSurface: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  postButton: {
    borderRadius: 30,
  },
  postButtonContent: {
    height: 52,
  },
  postButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeMediaButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    right: 8,
    top: 8,
  },
  textInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

export default CreateScreen; 