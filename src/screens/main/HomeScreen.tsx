import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Pressable, Platform, Animated as RNAnimated, TouchableOpacity, Alert, StatusBar } from 'react-native';
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
  FAB,
  Searchbar
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
  processColor,
  FadeIn,
  SlideInRight,
  FadeInDown
} from 'react-native-reanimated';
import { LottieWrapper } from '../../components/animations/LottieWrapper';
import { postService } from '../../services/posts';

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
    <Card style={[styles.postCard, styles.cardShadow, { backgroundColor: theme.colors.surface }]}>
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
  
  // Generate a color based on username for avatar background
  const generateColor = (username: string) => {
    const charCode = username.charCodeAt(0);
    const hue = (charCode * 15) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };
  
  const avatarColor = generateColor(item.users.username);
  
  return (
    <Animated.View 
      style={[styles.postCardContainer, animatedStyles]}
      entering={FadeInDown.delay(index * 100).duration(400)}
    >
      <Surface style={[styles.postCardSurface, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card 
          style={[styles.postCard, styles.cardShadow, { backgroundColor: theme.colors.surface }]}
          onPress={() => {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'PostDetails',
                params: { postId: item.id }
              })
            );
          }}
          mode="elevated"
        >
          <Card.Title
            title={item.users.username}
            titleVariant="titleMedium"
            titleStyle={styles.postUsername}
            subtitle={timeAgo}
            subtitleVariant="bodySmall"
            left={(props: any) => (
              item.users.profile_picture ? (
                <Avatar.Image
                  {...props}
                  source={{ uri: item.users.profile_picture }}
                  size={42}
                />
              ) : (
                <LinearGradient
                  colors={[avatarColor, `${avatarColor}99`]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.avatarGradient}
                >
                  <Avatar.Text 
                    {...props}
                    label={item.users.username.charAt(0).toUpperCase()}
                    size={42}
                    style={styles.avatarText}
                    labelStyle={{color: '#fff'}}
                  />
                </LinearGradient>
              )
            )}
            right={(props: { size: number }) => (
              <IconButton
                {...props}
                icon="dots-vertical"
                iconColor={theme.colors.onSurfaceVariant}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  // Show post options menu
                  Alert.alert(
                    'Post Options',
                    'What would you like to do with this post?',
                    [
                      { text: 'Report', onPress: () => Alert.alert('Report', 'Reporting will be implemented soon') },
                      { text: 'Share', onPress: () => Alert.alert('Share', 'Sharing will be implemented soon') },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
              />
            )}
          />
          <Card.Content>
            <Text variant="bodyMedium" style={styles.postContent}>{item.content}</Text>
            {item.image_url && (
              <Animated.View entering={FadeIn.delay(300).duration(500)}>
                <Card.Cover 
                  source={{ uri: item.image_url }} 
                  style={styles.postImage} 
                />
              </Animated.View>
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
              style={({ pressed }) => [
                styles.postAction, 
                isLiked && styles.likedPostAction,
                pressed && styles.pressedPostAction
              ]}
              onPressIn={handleLikePressIn}
              onPressOut={handleLikePressOut}
              android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true }}
              accessibilityRole="button"
              accessibilityLabel={isLiked ? "Unlike post" : "Like post"}
              accessibilityHint={isLiked ? "Double tap to unlike this post" : "Double tap to like this post"}
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
              style={({ pressed }) => [
                styles.postAction,
                pressed && styles.pressedPostAction
              ]}
              onPress={() => {
                // Use dispatch for more reliable navigation
                navigation.dispatch(
                  CommonActions.navigate({
                    name: 'PostDetails',
                    params: { postId: item.id }
                  })
                );
              }}
              android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true }}
              accessibilityRole="button"
              accessibilityLabel="View comments"
              accessibilityHint="Double tap to view post details and comments"
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={24}
                color={theme.colors.onSurface}
              />
              <Text style={[styles.postActionText, { color: theme.colors.onSurface }]}>
                Comment
              </Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) => [
                styles.postAction,
                pressed && styles.pressedPostAction
              ]}
              onPress={() => {
                // Implement proper share functionality
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                // This would typically use the Share API
                Alert.alert('Share', 'Sharing functionality will be implemented soon');
              }}
              android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true }}
              accessibilityRole="button"
              accessibilityLabel="Share post"
              accessibilityHint="Double tap to share this post"
            >
              <MaterialCommunityIcons
                name="share-outline"
                size={24}
                color={theme.colors.onSurface}
              />
              <Text style={[styles.postActionText, { color: theme.colors.onSurface }]}>
                Share
              </Text>
            </Pressable>
          </View>
        </Card>
      </Surface>
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
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  
  // Create ref for scroll animation using React Native's Animated
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  
  // Calculate animation values for header
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  const headerElevation = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 3],
    extrapolate: 'clamp',
  });

  const loadPosts = useCallback(async (offset = 0) => {
    setLoading(offset === 0);
    setLoadingMore(offset > 0);
    try {
      // In a real app, you might have different endpoints for 'forYou' vs 'following'
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
  }, [activeTab]); // Added activeTab as dependency so posts reload when tab changes

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

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Optimistically update the UI
    setLikedPosts(prev => {
      const newState = { ...prev };
      newState[postId] = !prev[postId];
      return newState;
    });

    try {
      // Get the current like state
      const isCurrentlyLiked = likedPosts[postId] || false;
      
      // If not liked, like it; otherwise unlike it
      if (!isCurrentlyLiked) {
        await postService.likePost(postId, user.id);
      } else {
        await postService.unlikePost(postId, user.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Revert the UI state in case of error
      setLikedPosts(prev => {
        const newState = { ...prev };
        newState[postId] = !prev[postId];
        return newState;
      });
      
      // Show error to user
      Alert.alert('Error', 'Unable to update like status');
    }
  };

  const renderAppHeader = () => {
    return (
      <RNAnimated.View style={{
        opacity: headerOpacity,
        elevation: headerElevation,
        zIndex: 100,
      }}>
        <Animated.View entering={FadeIn.duration(300)}>
          <LinearGradient
            colors={['#5D3FD3', '#7355DD']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.headerSurface}
          >
            <Text style={styles.headerTitle}>Feed</Text>
            <View style={styles.headerActions}>
              <IconButton
                icon="bell-outline"
                size={24}
                onPress={() => {
                  navigation.dispatch(
                    CommonActions.navigate('Notifications')
                  );
                }}
                iconColor="#ffffff"
                style={styles.headerIcon}
              />
              <IconButton
                icon="message-outline"
                size={24}
                onPress={() => {
                  navigation.dispatch(
                    CommonActions.navigate('Chat')
                  );
                }}
                iconColor="#ffffff"
                style={styles.headerIcon}
              />
            </View>
          </LinearGradient>
        </Animated.View>
      </RNAnimated.View>
    );
  };

  const renderFeedTabs = () => {
    return (
      <Animated.View 
        entering={FadeInDown.delay(100).duration(300)}
        style={[styles.tabContainer, { backgroundColor: theme.colors.background }]}
      >
        <View style={[styles.tabButtonsContainer, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'forYou' && styles.activeTabButton,
              { backgroundColor: theme.colors.background }
            ]}
            onPress={() => {
              if (activeTab !== 'forYou') {
                setActiveTab('forYou');
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }
            }}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel="For You feed"
            accessibilityState={{ selected: activeTab === 'forYou' }}
          >
            <Text style={[
              styles.tabButtonText,
              { color: theme.colors.onSurfaceVariant },
              activeTab === 'forYou' && [styles.activeTabButtonText, { color: theme.colors.primary }]
            ]}>
              For You
            </Text>
            {activeTab === 'forYou' && (
              <View style={[styles.activeTabIndicator, { backgroundColor: theme.colors.primary }]} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'following' && styles.activeTabButton,
              { backgroundColor: theme.colors.background }
            ]}
            onPress={() => {
              if (activeTab !== 'following') {
                setActiveTab('following');
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }
            }}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel="Following feed"
            accessibilityState={{ selected: activeTab === 'following' }}
          >
            <Text style={[
              styles.tabButtonText,
              { color: theme.colors.onSurfaceVariant },
              activeTab === 'following' && [styles.activeTabButtonText, { color: theme.colors.primary }]
            ]}>
              Following
            </Text>
            {activeTab === 'following' && (
              <View style={[styles.activeTabIndicator, { backgroundColor: theme.colors.primary }]} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderStoryItem = ({ item }: { item: Story }) => {
    return (
      <Pressable 
        style={({ pressed }) => [
          styles.storyContainer,
          pressed && styles.pressedStory
        ]}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          // Navigation to story view would go here
          Alert.alert('Story', `Viewing ${item.username}'s story`);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${item.username}'s story`}
        accessibilityHint={`Double tap to view ${item.username}'s story`}
      >
        <View style={[
          styles.storyRing, 
          { 
            borderColor: item.viewed 
              ? theme.colors.surfaceVariant 
              : 'transparent' 
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
          style={[
            styles.storyUsername, 
            { 
              color: theme.colors.onSurface,
              fontWeight: item.viewed ? 'normal' : 'bold'
            }
          ]} 
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.username}
        </Text>
      </Pressable>
    );
  };

  const renderStories = () => {
    return (
      <Animated.View 
        style={[styles.storiesContainer, { backgroundColor: theme.colors.background }]}
        entering={FadeInDown.duration(400)}
      >
        <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
          <Text style={styles.sectionTitle}>Stories</Text>
          <TouchableOpacity 
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              // Navigate to all stories
              Alert.alert('Stories', 'View all stories will be implemented soon');
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="View all stories"
          >
            <Text style={styles.sectionAction}>View all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={mockStories}
          renderItem={renderStoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.storiesList, { backgroundColor: theme.colors.background }]}
        />
        <Divider style={styles.storiesDivider} />
      </Animated.View>
    );
  };

  // Customize the refresh control
  const renderRefreshControl = () => {
    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        colors={[theme.colors.primary.toString()]}
        tintColor={theme.colors.primary.toString()}
      />
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

  // Render skeleton loaders when loading
  if (loading && posts.length === 0) {
    return (
      <ResponsiveView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        webStyle={styles.webContainer}
        desktopStyle={styles.desktopContainer}
      >
        <StatusBar backgroundColor="#5D3FD3" barStyle="light-content" />
        {renderAppHeader()}
        <Animated.View 
          entering={SlideInRight.delay(200).duration(400)}
          style={[styles.searchbarContainer, { backgroundColor: theme.colors.background }]}
        >
          <Searchbar
            placeholder="Search posts..."
            onChangeText={() => {}} // Placeholder - implement search functionality later
            value=""
            style={styles.searchbar}
            iconColor={theme.colors.primary}
            clearIcon="close-circle"
          />
        </Animated.View>
        {renderFeedTabs()}
        {renderStories()}
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <FlatList
            data={[1, 2, 3]}
            renderItem={() => <PostSkeleton />}
            keyExtractor={(_, index) => `skeleton-${index}`}
            contentContainerStyle={[styles.listContent, { backgroundColor: theme.colors.background }]}
          />
          <LottieWrapper
            source={require('../../../assets/animations/map-loading.json')}
            icon="loading"
            style={styles.loadingAnimation}
          />
        </View>
      </ResponsiveView>
    );
  }

  return (
    <ResponsiveView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      webStyle={styles.webContainer}
      desktopStyle={styles.desktopContainer}
    >
      <StatusBar backgroundColor="#5D3FD3" barStyle="light-content" />
      {renderAppHeader()}
      
      <Animated.View 
        entering={SlideInRight.delay(200).duration(400)}
        style={[styles.searchbarContainer, { backgroundColor: theme.colors.background }]}
      >
        <Searchbar
          placeholder="Search posts..."
          onChangeText={() => {}} // Placeholder - implement search functionality later
          value=""
          style={styles.searchbar}
          iconColor={theme.colors.primary}
          clearIcon="close-circle"
        />
      </Animated.View>
      
      {renderFeedTabs()}
      
      <RNAnimated.FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          isDesktop && styles.desktopListContent,
          { backgroundColor: theme.colors.background }
        ]}
        refreshControl={renderRefreshControl()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderStories}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" animating={true} color={theme.colors.primary} />
              <Text style={styles.footerLoaderText}>Loading more posts...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={[styles.center, { paddingTop: 50, backgroundColor: theme.colors.background }]}>
              <LottieWrapper
                source={require('../../../assets/animations/empty-state.json')}
                icon="post-outline"
                style={styles.emptyAnimation}
                colorFilters={[
                  {
                    keypath: "**",
                    color: theme.dark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"
                  },
                ]}
              />
              <Text variant="headlineSmall" style={[styles.emptyText, { marginTop: 16 }]}>No posts yet</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
                {activeTab === 'forYou' 
                  ? 'Be the first to create a post or follow some users to see their posts here'
                  : 'You are not following anyone yet. Start following people to see their posts here'}
              </Text>
              <Button
                mode="contained"
                onPress={() => {
                  navigation.dispatch(
                    CommonActions.navigate('Create')
                  );
                }}
                style={[styles.emptyButton, { marginTop: 16 }]}
                icon="plus"
                contentStyle={styles.emptyButtonContent}
              >
                Create a post
              </Button>
            </View>
          ) : null
        }
        scrollEventThrottle={16}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        showsVerticalScrollIndicator={false}
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
        animated={true}
      />
    </ResponsiveView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSurface: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    paddingBottom: 12,
    paddingTop: 12,
    position: 'relative',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerIcon: {
    margin: 0,
  },
  headerActions: {
    flexDirection: 'row',
    position: 'absolute',
    right: 8,
  },
  searchbarContainer: {
    marginBottom: 4,
    zIndex: 99,
  },
  searchbar: {
    borderRadius: 12,
    elevation: 2,
    margin: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  tabContainer: {
    marginBottom: 8,
  },
  tabButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
    position: 'relative',
  },
  activeTabButton: {
    // Any additional styling for active tab
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabButtonText: {
    fontWeight: 'bold',
  },
  activeTabIndicator: {
    borderRadius: 1.5,
    bottom: 0,
    height: 3,
    position: 'absolute',
    width: '50%',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionAction: {
    color: '#6200ee',
    fontSize: 14,
    fontWeight: '500',
  },
  storiesContainer: {
    marginVertical: 8,
  },
  storiesList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  storiesDivider: {
    height: 0.5,
    marginHorizontal: 12,
    marginTop: 8,
    opacity: 0.3,
  },
  storyContainer: {
    alignItems: 'center',
    marginHorizontal: 4,
    width: 70,
  },
  storyRing: {
    alignItems: 'center',
    borderRadius: 33,
    height: 66,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 66,
  },
  storyGradient: {
    alignItems: 'center',
    borderRadius: 33,
    height: '100%',
    justifyContent: 'center',
    padding: 2,
    width: '100%',
  },
  storyAvatar: {
    backgroundColor: 'transparent',
  },
  storyUsername: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    width: 65,
  },
  pressedStory: {
    opacity: 0.7,
  },
  center: {
    alignItems: 'center', 
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  emptyButton: {
    borderRadius: 30,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  emptyButtonContent: {
    height: 48,
    paddingHorizontal: 8,
  },
  footerLoader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  footerLoaderText: {
    marginLeft: 8,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingAnimation: {
    bottom: 16,
    height: 120,
    position: 'absolute',
    right: 16,
    width: 120,
    zIndex: 2,
  },
  emptyAnimation: {
    height: 200,
    width: 200,
  },
  listContent: {
    paddingBottom: 16,
  },
  postCardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  postCardSurface: {
    borderRadius: 16,
    overflow: 'hidden',
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
  avatarGradient: {
    alignItems: 'center',
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: {
    backgroundColor: 'transparent',
  },
  postUsername: {
    fontWeight: 'bold',
  },
  postContent: {
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    borderRadius: 12,
    marginTop: 8,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  postStat: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  postStatText: {
    marginLeft: 6,
    opacity: 0.8,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  postAction: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    // Add subtle hover effect with transition
    ...Platform.select({
      web: {
        transition: 'background-color 0.2s ease',
        ':hover': {
          backgroundColor: 'rgba(0,0,0,0.05)',
        },
      },
    }),
  },
  likedPostAction: {
    backgroundColor: 'rgba(103, 80, 164, 0.08)', // Light primary color background
  },
  pressedPostAction: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  postActionText: {
    fontWeight: '500',
    marginLeft: 6,
  },
  fab: {
    borderRadius: 30,
    bottom: 0,
    margin: 16,
    position: 'absolute',
    right: 0,
  },
  webContainer: {
    paddingHorizontal: '5%',
  },
  desktopContainer: {
    alignSelf: 'center',
    maxWidth: 1200,
    paddingHorizontal: '10%',
    width: '100%'
  },
  desktopListContent: {
    paddingHorizontal: 20,
  },
  // Skeleton styles
  skeletonHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 16,
  },
  skeletonAvatar: {
    borderRadius: 21,
    height: 42,
    marginRight: 12,
    width: 42,
  },
  skeletonUsername: {
    borderRadius: 4,
    height: 14,
    marginBottom: 6,
    width: 120,
  },
  skeletonTime: {
    borderRadius: 4,
    height: 10,
    width: 80,
  },
  skeletonContent: {
    borderRadius: 4,
    height: 80,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  skeletonImage: {
    borderRadius: 12,
    height: 200,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  skeletonActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  skeletonAction: {
    borderRadius: 16,
    height: 32,
    width: 80,
  },
  webLoadingContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default HomeScreen; 