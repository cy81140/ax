import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Image } from 'react-native';
import { Text, TextInput, Button, Chip, Portal, Dialog, IconButton, useTheme } from 'react-native-paper';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { createPost, uploadImage, uploadVideo } from '../../services/database';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CreatePollForm } from '../../components/polls';
import { AminoError, ErrorTypes } from '../../utils/errors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { postService } from '../../services/post';
import { User, Post } from '../../types/services';

type CreateScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'CreatePost'>;

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
  const [formData, setFormData] = useState<Partial<Post>>({
    content: '',
    likes_count: 0,
    comments_count: 0
  });
  const [mediaUri, setMediaUri] = useState<string | undefined>(undefined);
  const [showPollForm, setShowPollForm] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

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
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMediaUri(result.assets[0].uri);
        setContentType(isVideo ? 'video' : 'image');
        setMediaType(isVideo ? 'video' : 'image');
      }
    } catch (error) {
      const aminoError = new AminoError(
        'Failed to pick media',
        ErrorTypes.SYSTEM_ERROR,
        500,
        { originalError: error }
      );
      setError(aminoError.message);
      Alert.alert('Error', aminoError.message);
    }
  };

  const handleMediaUpload = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to upload media');
        return undefined;
      }
      
      setUploading(true);
      const filePath = `${user.id}/${Date.now()}`;
      if (!mediaUri) {
        return undefined;
      }
      const blob = await getBlob(mediaUri);

      if (mediaType === 'image') {
        const result = await uploadImage(filePath, blob);
        setMediaUri(result.publicUrl);
        return result.publicUrl;
      } else if (mediaType === 'video') {
        const result = await uploadVideo(filePath, blob);
        setMediaUri(result.publicUrl);
        return result.publicUrl;
      }
      return undefined;
    } catch (error) {
      console.error('Error uploading media:', error);
      Alert.alert('Upload Failed', 'Failed to upload media. Please try again.');
      return undefined;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.content) return;
    
    try {
      setLoading(true);
      
      let postData: Post | null = null;
      
      if (contentType === 'text' || contentType === 'image' || contentType === 'video') {
        // Create a basic post
        postData = await createPost({
          user_id: user.id,
          content: formData.content || '',
          image_url: mediaUri,
          likes_count: 0,
          comments_count: 0
        });
      } else if (contentType === 'poll') {
        // First create the post
        postData = await createPost({
          user_id: user.id,
          content: 'Poll: ' + (formData.content || ''),
          image_url: mediaUri,
          likes_count: 0,
          comments_count: 0
        });
        
        // Then create the poll attached to the post
        if (postData) {
          // Implementation for poll creation...
        }
      }
      
      if (postData) {
        setCreatedPostId(postData.id);
        // Reset form state
        setFormData({ content: '', likes_count: 0, comments_count: 0 });
        setMediaUri(undefined);
        setContentType('text');
        // Show success
        Alert.alert('Success', 'Post created successfully');
        navigation.navigate('Home' as any);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      const error = new AminoError(
        'You must be logged in to create a post',
        ErrorTypes.AUTHENTICATION_ERROR,
        401
      );
      setError(error.message);
      Alert.alert('Error', error.message);
      return;
    }
    
    if (!formData.content || formData.content.trim() === '' && contentType === 'text') {
      const error = new AminoError(
        'Post content cannot be empty',
        ErrorTypes.VALIDATION_ERROR,
        400
      );
      setError(error.message);
      Alert.alert('Error', error.message);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let imageUrl: string | undefined = undefined;
      let videoUrl: string | undefined = undefined;
      
      if ((contentType === 'image' || contentType === 'video') && mediaUri) {
        const mediaUrl = await handleMediaUpload();
        if (contentType === 'image') {
          imageUrl = mediaUrl || undefined;
        } else {
          videoUrl = mediaUrl || undefined;
        }
      }
      
      const response = await createPost({
        user_id: user.id,
        content: contentType === 'poll' ? 'Poll: ' + (formData.content || '') : (formData.content || ''),
        image_url: imageUrl,
        likes_count: 0,
        comments_count: 0
      });
      
      const postData = 'data' in response ? response.data : response;
      const postError = 'error' in response ? response.error : null;
      
      if (postError) throw postError;
      
      if (postData && Array.isArray(postData) && postData[0]) {
        if (contentType === 'poll') {
          setCreatedPostId(postData[0].id);
          setShowPollForm(true);
          return;
        }
        
        resetForm();
        Alert.alert('Success', 'Post created successfully');
        navigation.navigate('Home' as never);
      }
    } catch (error) {
      const aminoError = new AminoError(
        'Failed to create post',
        ErrorTypes.SYSTEM_ERROR,
        500,
        { originalError: error }
      );
      setError(aminoError.message);
      Alert.alert('Error', aminoError.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ content: '', likes_count: 0, comments_count: 0 });
    setMediaUri(undefined);
    setContentType('text');
    setCreatedPostId(null);
    setError(null);
  };

  const handlePollCreated = () => {
    resetForm();
    setShowPollForm(false);
    Alert.alert('Success', 'Poll created successfully');
    navigation.navigate('Home' as never);
  };

  const handleCancelPoll = () => {
    // If user cancels poll creation, we should delete the post we created
    // This would require a deletePost function, but for simplicity we'll just reset the form
    setShowPollForm(false);
    resetForm();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Post</Text>
      
      {!showPollForm && (
        <>
          <TextInput
            label="What's on your mind?"
            value={formData.content}
            onChangeText={(text: string) => setFormData(prev => ({ ...prev, content: text }))}
            multiline
            numberOfLines={4}
            style={styles.input}
          />
          
          {mediaUri && (
            <View style={styles.mediaPreviewContainer}>
              {contentType === 'image' ? (
                <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
              ) : (
                <View style={styles.videoPreviewContainer}>
                  <MaterialCommunityIcons name="video" size={40} color={theme.colors.primary} />
                  <Text>Video selected</Text>
                </View>
              )}
              <IconButton
                icon="close"
                size={24}
                onPress={() => {
                  setMediaUri(undefined);
                  setContentType('text');
                }}
                style={styles.removeMediaButton}
              />
            </View>
          )}
          
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsTitle}>Add to your post</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
              <Chip 
                icon="image" 
                onPress={() => pickImage(false)} 
                style={styles.chip}
                selected={contentType === 'image'}
              >
                Image
              </Chip>
              <Chip 
                icon="video" 
                onPress={() => pickImage(true)} 
                style={styles.chip}
                selected={contentType === 'video'}
              >
                Video
              </Chip>
              <Chip 
                icon="poll" 
                onPress={() => setContentType('poll')} 
                style={styles.chip}
                selected={contentType === 'poll'}
              >
                Poll
              </Chip>
            </ScrollView>
          </View>
          
          <Button 
            mode="contained" 
            onPress={handleCreatePost}
            style={styles.button}
            loading={loading}
            disabled={loading || (!formData.content?.trim() && contentType === 'text')}
          >
            {contentType === 'poll' ? 'Continue to Poll' : 'Post'}
          </Button>
        </>
      )}
      
      {showPollForm && createdPostId && (
        <CreatePollForm 
          postId={createdPostId}
          onPollCreated={handlePollCreated}
          onCancel={handleCancelPoll}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    marginBottom: 30,
    marginTop: 10,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    marginRight: 10,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
    padding: 20,
  },
  input: {
    backgroundColor: theme.colors.surface,
    marginBottom: 20,
  },
  mediaPreview: {
    borderRadius: 8,
    height: 200,
    width: '100%',
  },
  mediaPreviewContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  optionsTitle: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: 10,
  },
  removeMediaButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  title: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  videoPreviewContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    height: 200,
    justifyContent: 'center',
    width: '100%',
  },
});

export default CreateScreen; 