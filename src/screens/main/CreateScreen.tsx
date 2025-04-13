import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Image } from 'react-native';
import { Text, TextInput, Button, Chip, Portal, Dialog, IconButton } from 'react-native-paper';
import { theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { createPost, uploadImage, uploadVideo } from '../../services/database';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CreatePollForm } from '../../components/polls';

const CreateScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState<'text' | 'image' | 'video' | 'poll'>('text');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [showPollForm, setShowPollForm] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);

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
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const uploadMedia = async () => {
    if (!mediaUri || !user) return null;

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
      console.error('Error uploading media:', error);
      Alert.alert('Error', 'Failed to upload media');
    }
    
    return null;
  };

  const handleCreatePost = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }
    
    if (content.trim() === '' && contentType === 'text') {
      Alert.alert('Error', 'Post content cannot be empty');
      return;
    }
    
    setLoading(true);
    
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
      
      // Create the post with appropriate content
      // For polls, we'll use the question as content in the CreatePollForm
      const { data: postData, error: postError } = await createPost(
        user.id,
        contentType === 'poll' ? 'Poll: ' + content : content, // Add prefix for poll posts
        imageUrl,
        videoUrl
      );
      
      if (postError) throw postError;
      
      if (postData && postData[0]) {
        // If contentType is poll, show the poll form with this post id
        if (contentType === 'poll') {
          setCreatedPostId(postData[0].id);
          setShowPollForm(true);
          return; // Don't reset the form yet or navigate away
        }
        
        // Reset the form after successful submission
        resetForm();
        
        // Navigate back to the home screen
        Alert.alert('Success', 'Post created successfully');
        navigation.navigate('Home' as never);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setMediaUri(null);
    setContentType('text');
    setCreatedPostId(null);
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
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={5}
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
            disabled={loading || (content.trim() === '' && contentType === 'text')}
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.colors.primary,
  },
  input: {
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
  },
  mediaPreviewContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  videoPreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 16,
    marginBottom: 10,
    color: theme.colors.text,
  },
  optionsScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  chip: {
    marginRight: 10,
    backgroundColor: theme.colors.surface,
  },
  button: {
    marginTop: 10,
    marginBottom: 30,
    backgroundColor: theme.colors.primary,
  },
});

export default CreateScreen; 