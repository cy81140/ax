import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, ActivityIndicator, Card, Surface, Divider, List, Avatar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { Post, Comment } from '../../types/services';
import { postService } from '../../services/post';
import { getCommentsByPostId } from '../../services/database';
import { HomeStackScreenProps } from '../../navigation/types';
import { PostActions } from '../../components/posts/PostActions';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveView } from '../../components/ui/ResponsiveView';
import { getResponsiveSpacing } from '../../styles/responsive';
import { formatDistanceToNow } from 'date-fns';

type ListItemProps = { color: string; style?: any };

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
      setLoading(true);
      setError(null);
      const fetchedPost = await postService.getPost(postId);
      setPost(fetchedPost);
      if (user && fetchedPost) {
        const likedStatus = await postService.isLiked(fetchedPost.id, user.id);
        setIsLiked(likedStatus);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setError(null);
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
      setError(null);
      await postService.createComment({
        post_id: postId,
        user_id: user.id,
        text: newComment.trim(),
      });
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      setError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!user || !post) return;

    const originalLikedState = isLiked;
    setIsLiked(!originalLikedState);

    try {
      if (originalLikedState) {
        await postService.unlikePost(post.id, user.id);
      } else {
        await postService.likePost(post.id, user.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setIsLiked(originalLikedState);
      setError('Failed to update like status.');
    }
  };

  const handleShare = () => {
    console.log('Share action triggered');
  };

  if (loading) {
    return (
      <Surface style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" animating={true} color={theme.colors.primary} />
      </Surface>
    );
  }

  if (error || !post) {
    return (
      <Surface style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium" style={{ color: theme.colors.error }}>
          {error || 'Post not found.'}
        </Text>
        <Button onPress={fetchPost} style={{ marginTop: 16 }}>Retry</Button>
      </Surface>
    );
  }

  const postTimeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  const renderComment = ({ item }: { item: Comment }) => {
    const commentTimeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    return (
      <List.Item
        title={item.user?.username || 'Unknown User'}
        description={item.text}
        titleStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
        descriptionStyle={{ color: theme.colors.onSurface }}
        descriptionNumberOfLines={10}
        left={(props: ListItemProps) => (
          item.user?.profile_picture
          ? <Avatar.Image {...props} source={{ uri: item.user.profile_picture }} size={32} style={styles.commentAvatar} />
          : <Avatar.Icon {...props} icon="account" size={32} style={styles.commentAvatar} />
        )}
        style={styles.commentContainer}
      />
    );
  };

  return (
    <ResponsiveView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      desktopStyle={styles.desktopContainer}
      webStyle={styles.webContainer}
    >
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        style={styles.listStyle}
        contentContainerStyle={isDesktop ? styles.desktopContentContainer : styles.mobileContentContainer}
        ListHeaderComponent={(
          <Card style={styles.postCard}>
            <Card.Title
              title={post.user?.username}
              titleVariant="titleMedium"
              subtitle={postTimeAgo}
              subtitleVariant="bodySmall"
              left={(props: any) => (
                post.user?.profile_picture
                ? <Avatar.Image {...props} source={{ uri: post.user.profile_picture }} size={40} />
                : <Avatar.Icon {...props} icon="account" size={40} />
              )}
            />
            <Card.Content>
              <Text variant="bodyLarge" style={styles.content}>
                {post.content}
              </Text>
              {post.image_url && (
                <Card.Cover
                  source={{ uri: post.image_url }}
                  style={styles.image}
                />
              )}
            </Card.Content>
            <PostActions
              post={post}
              onLike={handleLike}
              onComment={() => { }}
              onShare={handleShare}
              isLiked={isLiked}
            />
            <Divider style={styles.divider} />
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
                compact
                onPress={handleComment}
                disabled={!newComment.trim() || submitting}
                loading={submitting}
                style={styles.commentButton}
                icon="send"
              >
                Post
              </Button>
            </View>
            <Text variant="titleMedium" style={styles.commentsHeader}>Comments</Text>
          </Card>
        )}
        ListEmptyComponent={(
          !loading ? (
            <View style={styles.emptyCommentsContainer}>
              <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>No comments yet.</Text>
            </View>
          ) : null
        )}
      />
    </ResponsiveView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listStyle: {
    flex: 1,
  },
  mobileContentContainer: {
    paddingBottom: 32,
  },
  desktopContainer: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  webContainer: {
  },
  desktopContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  postCard: {
    marginBottom: 8,
  },
  content: {
    marginBottom: 12,
  },
  image: {
    marginTop: 12,
  },
  commentsHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  commentContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  commentAvatar: {
    marginRight: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commentInput: {
    flex: 1,
    marginRight: 8,
  },
  commentButton: {
  },
  emptyCommentsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  divider: {
    marginTop: 8,
  }
});

export default PostDetailsScreen; 