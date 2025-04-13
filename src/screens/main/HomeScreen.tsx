import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Card, Avatar, Button, Chip, Divider } from 'react-native-paper';
import { theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { getPosts } from '../../services/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AvatarImageProps } from '../../types/components';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  users: {
    username: string;
    profile_picture: string | null;
  };
  comments: number;
}

const HomeScreen = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (offset = 0) => {
    try {
      const { data, error } = await getPosts(10, offset);
      
      if (error) throw error;
      
      if (data) {
        if (offset === 0) {
          setPosts(data as Post[]);
        } else {
          setPosts(prev => [...prev, ...(data as Post[])]);
        }
        
        // If we got fewer results than requested, there are no more posts
        setHasMore(data.length === 10);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadPosts(posts.length);
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => {
    const timeAgo = new Date(item.created_at).toLocaleDateString();
    
    return (
      <Card style={styles.postCard}>
        <Card.Title
          title={item.users.username}
          subtitle={timeAgo}
          left={(props: AvatarImageProps) => (
            <Avatar.Image
              {...props}
              source={
                item.users.profile_picture
                  ? { uri: item.users.profile_picture }
                  : require('../../../assets/default-avatar.png')
              }
              size={40}
            />
          )}
        />
        <Card.Content>
          <Text style={styles.postContent}>{item.content}</Text>
          {item.image_url && (
            <Card.Cover 
              source={{ uri: item.image_url }} 
              style={styles.postImage} 
            />
          )}
        </Card.Content>
        <Card.Actions style={styles.postActions}>
          <Button 
            icon="heart-outline" 
            onPress={() => console.log('Like post')}
          >
            Like
          </Button>
          <Button 
            icon="comment-outline" 
            onPress={() => console.log('Open comments')}
          >
            {item.comments} Comments
          </Button>
          <Button 
            icon="share-outline" 
            onPress={() => console.log('Share post')}
          >
            Share
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPostItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Home Feed</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="post-outline" 
              size={64} 
              color={theme.colors.primary} 
            />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text>Be the first to create a post!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  postCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  postContent: {
    fontSize: 16,
    marginBottom: 12,
  },
  postImage: {
    marginTop: 8,
    borderRadius: 8,
  },
  postActions: {
    justifyContent: 'space-between',
  },
  separator: {
    height: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
});

export default HomeScreen; 