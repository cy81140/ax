import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Card, Avatar, Button, Chip, Divider } from 'react-native-paper';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { getPosts } from '../../services/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AvatarImageProps } from '../../types/components';
import { HomeStackScreenProps } from '../../navigation/types';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveView } from '../../components/ui/ResponsiveView';

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

type Props = HomeStackScreenProps<'Feed'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { isWeb, isDesktop, width } = useResponsive();

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
      <Card 
        style={styles.postCard}
        onPress={() => navigation.navigate('PostDetails', { postId: item.id })}
      >
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
            onPress={() => navigation.navigate('PostDetails', { postId: item.id })}
          >
            {typeof item.comments === 'object' ? (item.comments as any).count : item.comments} Comments
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

  return (
    <ResponsiveView 
      style={styles.container}
      webStyle={styles.webContainer}
      desktopStyle={styles.desktopContainer}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            isDesktop && styles.desktopListContent
          ]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
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
      )}
    </ResponsiveView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  footerLoader: {
    alignItems: 'center',
    padding: 16,
  },
  header: {
    padding: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  postActions: {
    justifyContent: 'space-between',
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
    borderRadius: 8,
    marginTop: 8,
  },
  separator: {
    height: 8,
  },
  title: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  webContainer: {
    paddingHorizontal: '5%',
  },
  desktopContainer: {
    paddingHorizontal: '10%',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%'
  },
  desktopListContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen; 