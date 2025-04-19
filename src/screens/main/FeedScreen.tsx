import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Avatar, Button, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Define the navigation prop type
type FeedScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

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

const FeedScreen = () => {
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (offset = 0) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!posts_user_id_fkey(username, profile_picture),
          likes:post_likes(count)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + 9);

      if (error) throw error;

      if (data) {
        const formattedPosts = data.map(post => ({
          ...post,
          likes: post.likes[0].count,
        }));

        if (offset === 0) {
          setPosts(formattedPosts);
        } else {
          setPosts(prev => [...prev, ...formattedPosts]);
        }

        setHasMore(data.length === 10);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts().finally(() => setRefreshing(false));
  }, [loadPosts]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadPosts(posts.length);
    }
  }, [loadingMore, hasMore, posts.length, loadPosts]);

  const handleLike = async (postId: string) => {
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

      // Update local state
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, likes: post.likes + 1 }
            : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <Card style={styles.postCard}>
      <Card.Content>
        <View style={styles.postHeader}>
          <Avatar.Image
            size={40}
            source={item.user.profile_picture ? { uri: item.user.profile_picture } : undefined}
          />
          <View style={styles.postUserInfo}>
            <Text style={styles.postUsername}>{item.user.username}</Text>
            <Text style={styles.postDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Text style={styles.postContent}>{item.content}</Text>

        {item.image_url && (
          <Card.Cover source={{ uri: item.image_url }} style={styles.postImage} />
        )}
      </Card.Content>

      <Card.Actions>
        <Button
          icon="heart"
          onPress={() => handleLike(item.id)}
          textColor={theme.colors.primary}
        >
          {item.likes}
        </Button>
        <Button
          icon="comment"
          onPress={() => navigation.navigate('PostDetails', { postId: item.id })}
          textColor={theme.colors.primary}
        >
          {item.comments}
        </Button>
      </Card.Actions>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footerLoader} color={theme.colors.primary} />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  footerLoader: {
    marginVertical: 20,
  },
  listContent: {
    padding: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  postCard: {
    marginBottom: 10,
  },
  postContent: {
    fontSize: 16,
    marginBottom: 10,
  },
  postDate: {
    color: theme.colors.onSurface,
    fontSize: 12,
  },
  postHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  postImage: {
    marginTop: 10,
  },
  postUserInfo: {
    marginLeft: 10,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FeedScreen; 