import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Avatar, useTheme } from 'react-native-paper';
import { Comment } from '../../types/services';

interface CommentListProps {
  comments: Comment[];
  onCommentAdded?: () => void;
}

export const CommentList: React.FC<CommentListProps> = ({ comments, onCommentAdded }) => {
  const theme = useTheme();

  const renderComment = ({ item }: { item: Comment }) => (
    <Card style={styles.commentCard}>
      <Card.Content>
        <View style={styles.commentHeader}>
          <Avatar.Image
            size={40}
            source={{ uri: item.user?.profile_picture || 'https://via.placeholder.com/40' }}
          />
          <View style={styles.commentInfo}>
            <Text style={styles.username}>{item.user?.username || 'Unknown User'}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comments</Text>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  commentCard: {
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentInfo: {
    marginLeft: 12,
  },
  username: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
}); 