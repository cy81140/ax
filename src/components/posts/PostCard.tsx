import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Card, Text, Button, Avatar, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { likePost, unlikePost } from '../../services/database';
import { PollCard } from '../polls';
import { getPollByPostId } from '../../services/polls';

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    image_url?: string;
    video_url?: string;
    created_at: string;
    username: string;
    profile_picture?: string;
    likes_count: number;
    comments_count: number;
    user_liked: boolean;
  };
  onCommentPress?: () => void;
}

const PostCard = ({ post, onCommentPress }: PostCardProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.user_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [loading, setLoading] = useState(false);
  const [hasPoll, setHasPoll] = useState(false);
  const [pollData, setPollData] = useState<any>(null);
  const [loadingPoll, setLoadingPoll] = useState(true);

  useEffect(() => {
    // Check if this post has a poll
    const checkForPoll = async () => {
      try {
        setLoadingPoll(true);
        const { data, error } = await getPollByPostId(post.id, user?.id);
        
        if (error) throw error;
        
        if (data) {
          setHasPoll(true);
          setPollData(data);
        }
      } catch (err) {
        console.error('Error checking for poll:', err);
      } finally {
        setLoadingPoll(false);
      }
    };
    
    checkForPoll();
  }, [post.id, user?.id]);

  const handleLike = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (liked) {
        await unlikePost(post.id, user.id);
        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await likePost(post.id, user.id);
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePollVoted = () => {
    // Refresh poll data after voting
    if (user) {
      getPollByPostId(post.id, user.id).then(({ data }) => {
        if (data) {
          setPollData(data);
        }
      });
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Avatar.Image
            size={40}
            source={
              post.profile_picture
                ? { uri: post.profile_picture }
                : require('../../assets/default-avatar.png')
            }
          />
          <View style={styles.headerText}>
            <Text style={styles.username}>{post.username}</Text>
            <Text style={styles.timestamp}>
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </Text>
          </View>
        </View>

        <Text style={styles.content}>{post.content}</Text>

        {post.image_url && (
          <Image source={{ uri: post.image_url }} style={styles.image} />
        )}

        {post.video_url && (
          <View style={styles.videoContainer}>
            <MaterialCommunityIcons name="play-circle" size={50} color="white" />
            <Text style={styles.videoText}>Tap to play video</Text>
          </View>
        )}
        
        {hasPoll && pollData && !loadingPoll && (
          <View style={styles.pollContainer}>
            <PollCard poll={pollData} onVoted={handlePollVoted} />
          </View>
        )}
        
        {loadingPoll && hasPoll && (
          <View style={styles.loadingPoll}>
            <Text>Loading poll...</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
          </Text>
          <Text style={styles.statsText}>
            {post.comments_count} {post.comments_count === 1 ? 'Comment' : 'Comments'}
          </Text>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.actionRow}>
          <Button
            icon={liked ? 'heart' : 'heart-outline'}
            mode="text"
            onPress={handleLike}
            loading={loading}
            disabled={loading}
            labelStyle={liked ? styles.likedText : styles.actionText}
          >
            Like
          </Button>
          
          <Button
            icon="comment-outline"
            mode="text"
            onPress={onCommentPress}
            labelStyle={styles.actionText}
          >
            Comment
          </Button>
          
          <Button
            icon="share-outline"
            mode="text"
            onPress={() => console.log('Share pressed')}
            labelStyle={styles.actionText}
          >
            Share
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    marginLeft: 12,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.outline,
  },
  content: {
    fontSize: 16,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 8,
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: 'white',
    marginTop: 8,
  },
  pollContainer: {
    marginTop: 8,
  },
  loadingPoll: {
    padding: 16,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statsText: {
    fontSize: 12,
    color: theme.colors.outline,
  },
  divider: {
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionText: {
    fontSize: 12,
  },
  likedText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
});

export default PostCard; 