import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Card, Avatar, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Comment } from '../../types/services';
import { useAuth } from '../../contexts/AuthContext';
import { commentService } from '../../services/comments';
import { formatDistanceToNow } from 'date-fns';

interface CommentItemProps {
  comment: Comment;
  onReply?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, onReply }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes_count || 0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && comment.id) {
      checkLikeStatus();
    }
  }, [comment.id, user]);

  const checkLikeStatus = async () => {
    if (!user || !comment.id) return;
    
    try {
      const { data } = await commentService.isLikedByUser(comment.id, user.id);
      setIsLiked(data);
    } catch (error) {
      console.error('Error checking comment like status:', error);
    }
  };

  const handleLikePress = async () => {
    if (!user || !comment.id || isLoading) return;
    
    setIsLoading(true);
    try {
      if (isLiked) {
        await commentService.unlikeComment(comment.id, user.id);
        setLikeCount((prev: number) => Math.max(0, prev - 1));
      } else {
        await commentService.likeComment(comment.id, user.id);
        setLikeCount((prev: number) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling comment like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card style={styles.commentCard}>
      <Card.Content>
        <View style={styles.commentHeader}>
          <Avatar.Image
            size={40}
            source={{ uri: comment.user?.profile_picture || 'https://via.placeholder.com/40' }}
          />
          <View style={styles.commentInfo}>
            <Text style={styles.username}>{comment.user?.username || 'Unknown User'}</Text>
            <Text style={styles.timestamp}>
              {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''}
            </Text>
          </View>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
        
        <View style={styles.actionContainer}>
          <Pressable 
            style={styles.likeButton} 
            onPress={handleLikePress}
            disabled={isLoading}
          >
            <MaterialCommunityIcons
              name={isLiked ? "heart" : "heart-outline"}
              size={16}
              color={isLiked ? theme.colors.error : theme.colors.outline}
            />
            {likeCount > 0 && (
              <Text style={[styles.likeCount, isLiked && styles.likedText]}>
                {likeCount}
              </Text>
            )}
          </Pressable>
          
          {onReply && (
            <Pressable style={styles.replyButton} onPress={onReply}>
              <MaterialCommunityIcons
                name="reply-outline"
                size={16}
                color={theme.colors.outline}
              />
              <Text style={styles.actionText}>Reply</Text>
            </Pressable>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionText: {
    color: 'gray',
    fontSize: 12,
    marginLeft: 4,
  },
  commentCard: {
    marginBottom: 8,
  },
  commentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  commentInfo: {
    marginLeft: 12,
  },
  commentText: {
    fontSize: 16,
  },
  likeButton: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 16,
  },
  likeCount: {
    color: 'gray',
    fontSize: 12,
    marginLeft: 4,
  },
  likedText: {
    color: '#e91e63',
  },
  replyButton: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  username: {
    fontWeight: 'bold',
  },
}); 