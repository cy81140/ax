import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Card, Text, useTheme, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { getResponsiveFontSize } from '../../styles/responsive';
import { Post } from '../../types/services';
import { PostActions } from './PostActions';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onSharePress?: () => void;
  isLiked?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLikePress,
  onCommentPress,
  onSharePress,
  isLiked = false,
}) => {
  const theme = useTheme();
  const { isDesktop, isWeb, width } = useResponsive();
  
  // Format the date
  const formattedDate = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  // Handle user data - adjust based on your Post type structure
  const username = post.user?.username || "User";
  const profilePicture = post.user?.profile_picture || "https://via.placeholder.com/50";

  return (
    <Card 
      style={[
        styles.card, 
        isDesktop && styles.desktopCard,
        isWeb && styles.webCard
      ]}
      onPress={onPress}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.header}>
          <Avatar.Image 
            size={40} 
            source={{ uri: profilePicture }} 
          />
          <View style={styles.userInfo}>
            <Text variant="titleMedium" style={styles.username}>
              {username}
            </Text>
            <Text variant="bodySmall" style={styles.date}>
              {formattedDate}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.content, isDesktop && styles.desktopContent]}>
          {post.content}
        </Text>
        
        {post.image_url && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: post.image_url }} 
              style={[
                styles.image,
                isDesktop && { height: 350 }
              ]} 
              resizeMode="cover"
            />
          </View>
        )}
        
        <View style={styles.stats}>
          <View style={styles.stat}>
            <MaterialCommunityIcons 
              name="thumb-up" 
              size={16} 
              color={theme.colors.primary} 
            />
            <Text style={styles.statText}>
              {post.likes_count || 0}
            </Text>
          </View>
          
          <View style={styles.stat}>
            <MaterialCommunityIcons 
              name="comment" 
              size={16} 
              color={theme.colors.primary} 
            />
            <Text style={styles.statText}>
              {post.comments_count || 0}
            </Text>
          </View>
        </View>
      </Card.Content>
      
      <Card.Actions style={styles.actions}>
        <View style={styles.actionsContainer}>
          <Pressable 
            style={styles.action} 
            onPress={onLikePress}
          >
            <MaterialCommunityIcons
              name={isLiked ? "thumb-up" : "thumb-up-outline"}
              size={24}
              color={isLiked ? theme.colors.primary : theme.colors.onSurface}
            />
            <Text style={[styles.actionText, isLiked && styles.activeAction]}>Like</Text>
          </Pressable>
          
          <Pressable 
            style={styles.action} 
            onPress={onCommentPress}
          >
            <MaterialCommunityIcons
              name="comment-outline"
              size={24}
              color={theme.colors.onSurface}
            />
            <Text style={styles.actionText}>Comment</Text>
          </Pressable>
          
          <Pressable 
            style={styles.action} 
            onPress={onSharePress}
          >
            <MaterialCommunityIcons
              name="share-outline"
              size={24}
              color={theme.colors.onSurface}
            />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
        </View>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionText: {
    color: '#666',
    fontSize: getResponsiveFontSize(14),
    marginLeft: 4,
  },
  actions: {
    borderTopColor: '#f0f0f0',
    borderTopWidth: 1,
    padding: 0,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  activeAction: {
    color: '#4A90E2',
  },
  card: {
    marginHorizontal: 0,
    marginVertical: 8,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  content: {
    fontSize: getResponsiveFontSize(16),
    lineHeight: 22,
    marginBottom: 12,
  },
  date: {
    color: '#666',
    fontSize: getResponsiveFontSize(12),
  },
  desktopCard: {
    alignSelf: 'center',
    maxWidth: 800,
    width: '100%',
  },
  desktopContent: {
    fontSize: getResponsiveFontSize(18),
    lineHeight: 26,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  image: {
    backgroundColor: '#f0f0f0',
    height: 250,
    width: '100%',
  },
  imageContainer: {
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
  },
  stat: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 16,
  },
  statText: {
    color: '#666',
    fontSize: getResponsiveFontSize(14),
    marginLeft: 4,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },
  webCard: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
}); 