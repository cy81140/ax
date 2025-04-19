import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, Card, Avatar, TextInput, useTheme, Divider, IconButton } from 'react-native-paper';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CommentList } from '../../components/comments/CommentList';
import { postService } from '../../services/posts';
import { commentService } from '../../services/comments';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Comment, Post } from '../../types/services';

// Define the route prop type
type PostDetailsRouteProp = RouteProp<MainStackParamList, 'PostDetails'>;

const PostDetailsScreen = () => {
  const route = useRoute<PostDetailsRouteProp>();
  const navigation = useNavigation();
  const theme = useTheme();
  const { user } = useAuth();
  
  // Extract parameters
  const { postId, commentId } = route.params;
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchPostDetails();
    fetchComments();
    if (user) {
      checkLikeStatus();
    }
  }, [postId, user]);

  const fetchPostDetails = async () => {
    try {
      const { data, error } = await postService.getPost(postId);
      if (error) {
        console.error('Error fetching post:', error);
        return;
      }
      setPost(data);
      setLikeCount(data?.likes_count || 0);
    } catch (error) {
      console.error('Error fetching post details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await commentService.getCommentsByPostId(postId);
      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }
      setComments(data || []);
      
      // If a specific comment was targeted, scroll to it
      if (commentId && data) {
        const targetComment = data.find((comment: Comment) => comment.id === commentId);
        if (targetComment) {
          // Implement scrolling to the specific comment
          // This would require a ref and scrollToIndex in a FlatList
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkLikeStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await postService.isLikedByUser(postId, user.id);
      setIsLiked(data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLikePress = async () => {
    if (!user) return;
    
    try {
      if (isLiked) {
        await postService.unlikePost(postId, user.id);
        setLikeCount((prev: number) => Math.max(0, prev - 1));
      } else {
        await postService.likePost(postId, user.id);
        setLikeCount((prev: number) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !commentText.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      const { data, error } = await commentService.createComment(postId, user.id, commentText.trim());
      if (error) {
        console.error('Error creating comment:', error);
        return;
      }
      
      // Add the new comment to the list
      if (data) {
        setComments(prev => [
          ...prev, 
          {
            ...data[0],
            user: {
              username: user.username,
              profile_picture: user.profile_picture
            },
            likes_count: 0
          }
        ]);
        setCommentText('');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Surface style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </Surface>
    );
  }

  if (!post) {
    return (
      <Surface style={styles.container}>
        <Text variant="headlineSmall" style={styles.errorText}>Post not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
          Go Back
        </Button>
      </Surface>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Surface style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Card style={styles.postCard}>
            <Card.Title
              title={post.user?.username || 'Unknown User'}
              subtitle={formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              left={(props: any) => (
                <Avatar.Image
                  {...props}
                  source={{ uri: post.user?.profile_picture || 'https://via.placeholder.com/40' }}
                  size={40}
                />
              )}
            />
            <Card.Content>
              <Text style={styles.postContent}>{post.content}</Text>
              {post.image_url && (
                <Card.Cover source={{ uri: post.image_url }} style={styles.postImage} />
              )}
              
              <View style={styles.postStats}>
                <View style={styles.postStat}>
                  <MaterialCommunityIcons
                    name="heart"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.postStatText}>
                    {likeCount} likes
                  </Text>
                </View>
                <Text style={styles.postStatText}>
                  {comments.length} comments
                </Text>
              </View>
            </Card.Content>
            
            <Divider />
            
            <Card.Actions style={styles.postActions}>
              <Button 
                icon={isLiked ? "heart" : "heart-outline"}
                mode="text"
                onPress={handleLikePress}
                textColor={isLiked ? theme.colors.error : theme.colors.onSurface}
                labelStyle={styles.actionLabel}
              >
                Like
              </Button>
              <Button 
                icon="comment-outline"
                mode="text"
                onPress={() => {}}
                labelStyle={styles.actionLabel}
              >
                Comment
              </Button>
              <Button 
                icon="share-outline"
                mode="text"
                onPress={() => {}}
                labelStyle={styles.actionLabel}
              >
                Share
              </Button>
            </Card.Actions>
          </Card>
          
          <View style={styles.commentsContainer}>
            <CommentList comments={comments} scrollable={false} />
          </View>
        </ScrollView>
        
        <View style={styles.commentInputContainer}>
          <Avatar.Image
            size={36}
            source={{ uri: user?.profile_picture || 'https://via.placeholder.com/36' }}
            style={styles.commentInputAvatar}
          />
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            value={commentText}
            onChangeText={setCommentText}
            mode="outlined"
            right={
              <TextInput.Icon 
                icon="send" 
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || submitting}
              />
            }
          />
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  actionLabel: {
    fontSize: 14,
    marginLeft: 4,
  },
  button: {
    marginTop: 16,
  },
  commentInput: {
    flex: 1,
    marginLeft: 8,
  },
  commentInputAvatar: {
    marginRight: 8,
  },
  commentInputContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopColor: '#eee',
    borderTopWidth: 1,
    flexDirection: 'row',
    padding: 8,
    width: '100%',
  },
  commentsContainer: {
    flex: 1,
    marginTop: 16,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  errorText: {
    margin: 16,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  postActions: {
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  postCard: {
    marginBottom: 16,
  },
  postContent: {
    fontSize: 16,
    marginBottom: 12,
  },
  postImage: {
    borderRadius: 8,
    height: 200,
    marginVertical: 8,
  },
  postStat: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 16,
  },
  postStats: {
    flexDirection: 'row',
    marginTop: 12,
  },
  postStatText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
});

export default PostDetailsScreen; 