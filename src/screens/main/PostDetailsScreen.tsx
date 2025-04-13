import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, ActivityIndicator, Card } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { Post, Comment } from '../../types/services';
import { postService } from '../../services/post';
import { getCommentsByPostId } from '../../services/database';
import { HomeStackScreenProps } from '../../navigation/types';
import { PostActions } from '../../components/posts/PostActions';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveView } from '../../components/ui/ResponsiveView';
import { getResponsiveSpacing } from '../../styles/responsive';

type Props = HomeStackScreenProps<'PostDetails'>;

export const PostDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { postId } = route.params;
  const theme = useTheme();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const { isDesktop, isWeb } = useResponsive();

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const post = await postService.getPost(postId);
      setPost(post);
      const isLiked = await postService.isLiked(postId, user?.id || '');
      setIsLiked(isLiked);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await getCommentsByPostId(postId);
      if (response.data) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      setSubmitting(true);
      await postService.createComment({
        post_id: postId,
        user_id: user.id,
        text: newComment.trim(),
      });
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!user || !post) return;

    try {
      if (isLiked) {
        await postService.unlikePost(post.id, user.id);
      } else {
        await postService.likePost(post.id, user.id);
      }
      setIsLiked(!isLiked);
      await fetchPost();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShare = () => {
    // Implement share functionality
  };

  if (loading) {
    return (
      <ResponsiveView 
        style={styles.container}
        desktopStyle={styles.desktopContainer}
        webStyle={styles.webContainer}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ResponsiveView>
    );
  }

  if (error || !post) {
    return (
      <ResponsiveView 
        style={styles.container}
        desktopStyle={styles.desktopContainer}
        webStyle={styles.webContainer}
      >
        <View style={styles.errorContainer}>
          <Text>Post not found or an error occurred.</Text>
        </View>
      </ResponsiveView>
    );
  }

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <Text variant="labelSmall" style={styles.username}>
        {item.user?.username}
      </Text>
      <Text variant="bodyMedium">{item.text}</Text>
      <Text variant="labelSmall" style={styles.timestamp}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <ResponsiveView 
      style={styles.container}
      desktopStyle={styles.desktopContainer}
      webStyle={styles.webContainer}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={isDesktop ? styles.desktopContentContainer : null}
      >
        <Card style={styles.postCard}>
          <View style={styles.postContainer}>
            <Text variant="labelSmall" style={styles.username}>
              {post.user?.username}
            </Text>
            <Text variant="bodyLarge" style={styles.content}>
              {post.content}
            </Text>
            {post.image_url && (
              <Image 
                source={{ uri: post.image_url }} 
                style={styles.image} 
                resizeMode="cover"
              />
            )}
            <Text variant="labelSmall" style={styles.timestamp}>
              {new Date(post.created_at).toLocaleDateString()}
            </Text>
            <PostActions
              post={post}
              onLike={handleLike}
              onComment={() => {}}
              onShare={handleShare}
              isLiked={isLiked}
            />
          </View>
        </Card>
        
        <View style={[styles.commentsSection, isDesktop && styles.desktopCommentsSection]}>
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            style={styles.commentsList}
            ListHeaderComponent={
              <View style={styles.commentInputContainer}>
                <TextInput
                  mode="outlined"
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Write a comment..."
                  style={styles.commentInput}
                  maxLength={500}
                  multiline
                  disabled={submitting}
                />
                <Button
                  mode="contained"
                  onPress={handleComment}
                  disabled={!newComment.trim() || submitting}
                  loading={submitting}
                  style={styles.commentButton}
                >
                  Post
                </Button>
              </View>
            }
          />
        </View>
      </ScrollView>
    </ResponsiveView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  desktopContainer: {
    paddingHorizontal: '15%',
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  webContainer: {
    paddingHorizontal: '5%',
  },
  desktopContentContainer: {
    paddingHorizontal: 20,
  },
  desktopCommentsSection: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  postContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  username: {
    color: '#666',
    marginBottom: 4,
  },
  content: {
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  timestamp: {
    color: '#666',
    marginBottom: 8,
  },
  commentsList: {
    flex: 1,
  },
  commentInputContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  commentInput: {
    marginBottom: 8,
  },
  commentButton: {
    alignSelf: 'flex-end',
  },
  commentContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  postCard: {
    marginBottom: 20,
  },
  commentsSection: {
    padding: 16,
  },
}); 