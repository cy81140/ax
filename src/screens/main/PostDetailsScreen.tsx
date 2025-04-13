import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Text, TextInput, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { Post, Comment } from '../../types/services';
import { postService } from '../../services/post';
import { getCommentsByPostId } from '../../services/database';
import { MainStackScreenProps } from '../../types/navigation';
import { PostActions } from '../../components/posts/PostActions';

type Props = MainStackScreenProps<'PostDetails'>;

export const PostDetailsScreen: React.FC<Props> = ({ route }) => {
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.error}>
          {error || 'Post not found'}
        </Text>
      </View>
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
    <View style={styles.container}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
}); 