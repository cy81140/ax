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

type CreateScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'CreatePost'>;

interface PostFormData {
  content: string;
  image_url?: string;
}

const CreateScreen = () => {
  const navigation = useNavigation<CreateScreenNavigationProp>();
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PostFormData>({
    content: '',
  });
  const [contentType, setContentType] = useState<'text' | 'image' | 'video' | 'poll'>('text');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [showPollForm, setShowPollForm] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const uploadMedia = async () => {
    if (!mediaUri || !user) {
      throw new AminoError(
        'Media URI and user are required',
        ErrorTypes.VALIDATION_ERROR,
        400
      );
    }

    try {
      const uriParts = mediaUri.split('.');
      const fileExtension = uriParts[uriParts.length - 1];
      
      const filePath = `${user.id}/${Date.now()}.${fileExtension}`;
      
      // Convert uri to blob
      const response = await fetch(mediaUri);
      const blob = await response.blob();
      
      if (contentType === 'image') {
        const { data, error } = await uploadImage(filePath, blob);
        if (error) throw error;
        return data?.publicUrl;
      } else if (contentType === 'video') {
        const { data, error } = await uploadVideo(filePath, blob);
        if (error) throw error;
        return data?.publicUrl;
      }
    } catch (error) {
      const aminoError = new AminoError(
        'Failed to upload media',
        ErrorTypes.SYSTEM_ERROR,
        500,
        { originalError: error }
      );
      setError(aminoError.message);
      Alert.alert('Error', aminoError.message);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const postData = await postService.createPost({
        ...formData,
        user_id: user.id,
      });
      
      if (postData) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error creating post:', error);
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
    
    if (formData.content.trim() === '' && contentType === 'text') {
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
        const mediaUrl = await uploadMedia();
        if (contentType === 'image') {
          imageUrl = mediaUrl || undefined;
        } else {
          videoUrl = mediaUrl || undefined;
        }
      }
      
      const { data: postData, error: postError } = await createPost(
        user.id,
        contentType === 'poll' ? 'Poll: ' + formData.content : formData.content,
        imageUrl,
        videoUrl
      );
      
      if (postError) throw postError;
      
      if (postData && postData[0]) {
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
    setFormData({ content: '' });
    setMediaUri(null);
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
            onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
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
                  setMediaUri(null);
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
            disabled={loading || (!formData.content.trim() && contentType === 'text')}
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