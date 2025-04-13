import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, FlatList } from 'react-native';
import { Text, Card, Avatar, Button, TextInput, IconButton } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<HomeStackParamList, 'PostDetails'>;

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    username: string;
    profile_picture: string | null;
  };
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  user: {
    username: string;
    profile_picture: string | null;
  };
  likes: number;
  comments: number;
}

const PostDetailsScreen = ({ route, navigation }: Props) => {
  const { postId } = route.params;
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [postId]);

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(username, profile_picture),
          likes:post_likes(count)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      if (data) {
        setPost({
          ...data,
          likes: data.likes[0].count,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(username, profile_picture)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setComments(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPost(), loadComments()]);
    setRefreshing(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            user_id: user?.id,
            content: newComment,
          },
        ]);

      if (error) throw error;

      setNewComment('');
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;

    try {
      const { error } = await supabase
        .from('post_likes')
        .upsert(
          {
            post_id: postId,
            user_id: user?.id,
          },
          {
            onConflict: 'post_id,user_id',
          }
        );

      if (error) throw error;

      await loadPost();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like post');
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <Card style={styles.commentCard}>
      <Card.Content>
        <View style={styles.commentHeader}>
          <Avatar.Image
            size={40}
            source={item.user.profile_picture ? { uri: item.user.profile_picture } : undefined}
          />
          <View style={styles.commentUserInfo}>
            <Text style={styles.commentUsername}>{item.user.username}</Text>
            <Text style={styles.commentDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Text style={styles.commentContent}>{item.content}</Text>
      </Card.Content>
    </Card>
  );

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Card style={styles.postCard}>
          <Card.Content>
            <View style={styles.postHeader}>
              <Avatar.Image
                size={50}
                source={post.user.profile_picture ? { uri: post.user.profile_picture } : undefined}
              />
              <View style={styles.postUserInfo}>
                <Text style={styles.postUsername}>{post.user.username}</Text>
                <Text style={styles.postDate}>
                  {new Date(post.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {post.image_url && (
              <Image
                source={{ uri: post.image_url }}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}
          </Card.Content>

          <Card.Actions>
            <Button
              icon="heart"
              onPress={handleLike}
              textColor={theme.colors.primary}
            >
              {post.likes}
            </Button>
            <Button
              icon="comment"
              textColor={theme.colors.primary}
            >
              {post.comments}
            </Button>
          </Card.Actions>
        </Card>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </View>
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          style={styles.commentInput}
        />
        <IconButton
          icon="send"
          size={24}
          onPress={handleAddComment}
          disabled={!newComment.trim() || loading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  postCard: {
    margin: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postUserInfo: {
    marginLeft: 10,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postDate: {
    fontSize: 12,
    color: theme.colors.onSurface,
  },
  postContent: {
    fontSize: 16,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  commentsSection: {
    padding: 10,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  commentCard: {
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  commentUserInfo: {
    marginLeft: 10,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentDate: {
    fontSize: 12,
    color: theme.colors.onSurface,
  },
  commentContent: {
    fontSize: 14,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
  },
  commentInput: {
    flex: 1,
    marginRight: 10,
  },
});

export default PostDetailsScreen; 