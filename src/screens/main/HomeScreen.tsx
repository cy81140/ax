import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Pressable, Platform, Animated as RNAnimated } from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  IconButton, 
  Divider, 
  useTheme, 
  Surface, 
  ActivityIndicator,
  Button,
  FAB
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { getPosts } from '../../services/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeStackScreenProps } from '../../navigation/types';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveView } from '../../components/ui/ResponsiveView';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CommonActions } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  Easing,
  createAnimatedPropAdapter,
  processColor
} from 'react-native-reanimated';

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
  likes_count?: number;
}

interface Story {
  id: string;
  username: string;
  profilePic: string;
  viewed: boolean;
}

type Props = HomeStackScreenProps<'Feed'>;

const HEADER_HEIGHT = 60;
const STORY_HEIGHT = 100;

// Animation constants
const LIKE_ANIMATION_DURATION = 300;

// Create mock stories data
const mockStories: Story[] = [
  { id: '1', username: 'Your Story', profilePic: 'https://randomuser.me/api/portraits/men/32.jpg', viewed: false },
  { id: '2', username: 'john_doe', profilePic: 'https://randomuser.me/api/portraits/men/43.jpg', viewed: false },
  { id: '3', username: 'sarah_j', profilePic: 'https://randomuser.me/api/portraits/women/63.jpg', viewed: false },
  { id: '4', username: 'mike_t', profilePic: 'https://randomuser.me/api/portraits/men/91.jpg', viewed: true },
  { id: '5', username: 'lisa_m', profilePic: 'https://randomuser.me/api/portraits/women/17.jpg', viewed: true },
  { id: '6', username: 'robert_p', profilePic: 'https://randomuser.me/api/portraits/men/28.jpg', viewed: true },
];

// Skeleton loader component for posts
const PostSkeleton = () => {
  const theme = useTheme();
  const backgroundColor = theme.dark 
    ? 'rgba(255, 255, 255, 0.08)' 
    : 'rgba(0, 0, 0, 0.06)';
  
  return (
    <Card style={[styles.postCard, styles.cardShadow]}>
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeletonAvatar, { backgroundColor }]} />
        <View>
          <View style={[styles.skeletonUsername, { backgroundColor }]} />
          <View style={[styles.skeletonTime, { backgroundColor }]} />
        </View>
      </View>
      <View style={[styles.skeletonContent, { backgroundColor }]} />
      <View style={[styles.skeletonImage, { backgroundColor }]} />
      <View style={styles.skeletonActions}>
        <View style={[styles.skeletonAction, { backgroundColor }]} />
        <View style={[styles.skeletonAction, { backgroundColor }]} />
        <View style={[styles.skeletonAction, { backgroundColor }]} />
      </View>
    </Card>
  );
};

// Post component with animations
const AnimatedPost = ({ item, index, navigation, onLike, isLiked }: { 
  item: Post, 
  index: number, 
  navigation: any,
  onLike: (id: string) => void,
  isLiked: boolean
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  let timeAgo = 'Just now';
  try {
    timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
  } catch (e) { 
    console.error("Failed to parse date:", item.created_at); 
  }

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const likeIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: isLiked ? withSpring(1.2, { damping: 10 }) : withSpring(1) }],
    };
  });

  const handleLikePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handleLikePressOut = () => {
    scale.value = withTiming(1, { duration: 200 });
    onLike(item.id);
  };
  
  return (
    <Animated.View style={[styles.postCardContainer, animatedStyles]}>
      <Card 
        style={[styles.postCard, styles.cardShadow]}
        onPress={() => navigation.navigate('PostDetails', { postId: item.id })}
        mode="elevated"
      >
        <Card.Title
          title={item.users.username}
          titleVariant="titleMedium"
          titleStyle={styles.postUsername}
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
              size={42}
            />
          )}
          right={(props: { size: number }) => (
            <IconButton
              {...props}
              icon="dots-vertical"
              iconColor={theme.colors.onSurfaceVariant}
              onPress={() => console.log('Post options')}
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
        
        <View style={styles.postStats}>
          <View style={styles.postStat}>
            <MaterialCommunityIcons
              name="heart"
              size={16}
              color={theme.colors.primary}
            />
            <Text variant="bodySmall" style={styles.postStatText}>
              {item.likes_count || 0} likes
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.postStatText}>
            {item.comments} comments
          </Text>
        </View>
        
        <Divider />
        
        <View style={styles.postActions}>
          <Pressable 
            style={styles.postAction}
            onPressIn={handleLikePressIn}
            onPressOut={handleLikePressOut}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true }}
          >
            <Animated.View style={likeIconStyle}>
              <MaterialCommunityIcons
                name={isLiked ? "heart" : "heart-outline"}
                size={24}
                color={isLiked ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            </Animated.View>
            <Text style={[
              styles.postActionText, 
              { color: isLiked ? theme.colors.primary : theme.colors.onSurfaceVariant }
            ]}>
              Like
            </Text>
          </Pressable>
          
          <Pressable 
            style={styles.postAction}
            onPress={() => navigation.navigate('PostDetails', { postId: item.id })}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true }}
          >
            <MaterialCommunityIcons
              name="comment-outline"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.postActionText, { color: theme.colors.onSurfaceVariant }]}>
              Comment
            </Text>
          </Pressable>
          
          <Pressable 
            style={styles.postAction}
            onPress={() => console.log('Share post')}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true }}
          >
            <MaterialCommunityIcons
              name="share-outline"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.postActionText, { color: theme.colors.onSurfaceVariant }]}>
              Share
            </Text>
          </Pressable>
        </View>
      </Card>
    </Animated.View>
  );
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const { isWeb, isDesktop, width } = useResponsive();
  
  // Create ref for scroll animation using React Native's Animated
  const scrollY = useRef(new RNAnimated.Value(0)).current;

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

  const handleLikePost = (postId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const renderStoryItem = ({ item }: { item: Story }) => {
    return (
      <Pressable style={styles.storyContainer}>
        <View style={[
          styles.storyRing, 
          { 
            borderColor: item.viewed 
              ? theme.colors.surfaceVariant 
              : theme.colors.primary 
          }
        ]}>
          <LinearGradient
            colors={item.viewed 
              ? [theme.colors.surfaceVariant, theme.colors.surfaceVariant] 
              : ['#833ab4', '#fd1d1d', '#fcb045']}
            style={styles.storyGradient}
          >
            <Avatar.Image 
              source={{ uri: item.profilePic }} 
              size={60} 
              style={styles.storyAvatar}
            />
          </LinearGradient>
        </View>
        <Text 
          style={[styles.storyUsername, { color: theme.colors.onSurface }]} 
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.username}
        </Text>
      </Pressable>
    );
  };

  const renderPostItem = ({ item, index }: { item: Post, index: number }) => {
    return (
      <AnimatedPost 
        item={item} 
        index={index} 
        navigation={navigation} 
        onLike={handleLikePost}
        isLiked={likedPosts[item.id] || false}
      />
    );
  };

  const renderAppHeader = () => {
    return (
      <Surface style={[styles.header, { backgroundColor: theme.colors.background }]} elevation={1}>
        <Text variant="headlineMedium" style={styles.appTitle}>Feed</Text>
        <View style={styles.headerActions}>
          <IconButton
            icon="bell-outline"
            size={24}
            onPress={() => {
              navigation.dispatch(
                CommonActions.navigate('Notifications')
              );
            }}
            iconColor={theme.colors.onSurface}
          />
          <IconButton
            icon="message-outline"
            size={24}
            onPress={() => {
              navigation.dispatch(
                CommonActions.navigate('Chat')
              );
            }}
            iconColor={theme.colors.onSurface}
          />
        </View>
      </Surface>
    );
  };

  const renderStories = () => {
    return (
      <View style={styles.storiesContainer}>
        <FlatList
          data={mockStories}
          renderItem={renderStoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesList}
        />
      </View>
    );
  };

  // Render skeleton loaders when loading
  if (loading && posts.length === 0) {
    return (
      <ResponsiveView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        webStyle={styles.webContainer}
        desktopStyle={styles.desktopContainer}
      >
        {renderAppHeader()}
        {renderStories()}
        <FlatList
          data={[1, 2, 3]}
          renderItem={() => <PostSkeleton />}
          keyExtractor={(_, index) => `skeleton-${index}`}
          contentContainerStyle={styles.listContent}
        />
      </ResponsiveView>
    );
  }

  return (
    <ResponsiveView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      webStyle={styles.webContainer}
      desktopStyle={styles.desktopContainer}
    >
      {renderAppHeader()}
      
      <RNAnimated.FlatList
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
        ListHeaderComponent={renderStories}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" animating={true} color={theme.colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <Surface style={[styles.emptyContainer, styles.cardShadow, { backgroundColor: theme.colors.background }]}>
              <MaterialCommunityIcons 
                name="post-outline" 
                size={80} 
                color={theme.colors.primary} 
              />
              <Text variant="headlineSmall" style={styles.emptyText}>No posts yet</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Be the first to create a post or follow some users to see their posts here
              </Text>
              <Button
                mode="contained"
                onPress={() => {
                  navigation.dispatch(
                    CommonActions.navigate('Create')
                  );
                }}
                style={styles.emptyButton}
                icon="plus"
              >
                Create a post
              </Button>
            </Surface>
          ) : null
        }
        scrollEventThrottle={16}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      />
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          navigation.dispatch(
            CommonActions.navigate('Create')
          );
        }}
        color={theme.colors.onPrimary}
      />
    </ResponsiveView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  appTitle: {
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storiesContainer: {
    height: STORY_HEIGHT,
    marginVertical: 8,
  },
  storiesList: {
    paddingHorizontal: 12,
  },
  storyContainer: {
    width: 70,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  storyRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storyGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    backgroundColor: 'transparent',
  },
  storyUsername: {
    marginTop: 4,
    fontSize: 11,
    width: 65,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    margin: 24,
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptyButton: {
    marginTop: 24,
    paddingHorizontal: 16,
    borderRadius: 30,
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  postCardContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  postCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }
    }),
  },
  postUsername: {
    fontWeight: 'bold',
  },
  postContent: {
    marginBottom: 12,
    lineHeight: 22,
  },
  postImage: {
    marginTop: 8,
    borderRadius: 12,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    marginLeft: 6,
    opacity: 0.8,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    flex: 1,
  },
  postActionText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 30,
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
  // Skeleton styles
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  skeletonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  skeletonUsername: {
    height: 14,
    width: 120,
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonTime: {
    height: 10,
    width: 80,
    borderRadius: 4,
  },
  skeletonContent: {
    height: 80,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 4,
  },
  skeletonImage: {
    height: 200,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  skeletonActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  skeletonAction: {
    height: 32,
    width: 80,
    borderRadius: 16,
  },
});

export default HomeScreen; 