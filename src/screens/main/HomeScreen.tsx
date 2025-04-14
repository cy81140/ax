import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Avatar, Button, Chip, Divider, useTheme, Surface, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { getPosts } from '../../services/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AvatarImageProps } from '../../types/components';
import { HomeStackScreenProps } from '../../navigation/types';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveView } from '../../components/ui/ResponsiveView';
import { formatDistanceToNow } from 'date-fns';

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
  const theme = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { isWeb, isDesktop, width } = useResponsive();

  const loadPosts = useCallback(async (offset = 0) => {
    setLoading(offset === 0);
    setLoadingMore(offset > 0);
    try {
      const { data, error } = await getPosts(10, offset);
      
      if (error) throw error;
      
      if (data) {
        const formattedPosts = data.map((p: any) => ({
          ...p,
          comments: typeof p.comments === 'object' && p.comments !== null ? p.comments.count : (p.comments ?? 0)
        }));

        if (offset === 0) {
          setPosts(formattedPosts as Post[]);
        } else {
          setPosts(prev => [...prev, ...(formattedPosts as Post[])]);
        }
        
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
    if (!loading && !loadingMore && hasMore) {
      loadPosts(posts.length);
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => {
    let timeAgo = 'Just now';
    try {
      timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    } catch (e) { console.error("Failed to parse date:", item.created_at); }

    return (
      <Card 
        style={styles.postCard}
        onPress={() => navigation.navigate('PostDetails', { postId: item.id })}
      >
        <Card.Title
          title={item.users.username}
          titleVariant="titleMedium"
          subtitle={timeAgo}
          subtitleVariant="bodySmall"
          left={(props: any) => (
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
          <Text variant="bodyMedium" style={styles.postContent}>{item.content}</Text>
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
            {item.comments} Comments
          </Button>
          <Button 
            icon="share-variant-outline"
            onPress={() => console.log('Share post')}
          >
            Share
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <Surface style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" animating={true} color={theme.colors.primary} />
      </Surface>
    );
  }

  return (
    <ResponsiveView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      webStyle={styles.webContainer}
      desktopStyle={styles.desktopContainer}
    >
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          isDesktop && styles.desktopListContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" animating={true} color={theme.colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Surface style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
            <MaterialCommunityIcons 
              name="post-outline" 
              size={64} 
              color={theme.colors.primary} 
            />
            <Text variant="titleMedium" style={styles.emptyText}>No posts yet</Text>
            <Text variant="bodyMedium">Be the first to create a post!</Text>
          </Surface>
        }
      />
    </ResponsiveView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  postActions: {
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  postCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  postContent: {
    marginBottom: 12,
  },
  postImage: {
    marginTop: 12,
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
});

export default HomeScreen; 