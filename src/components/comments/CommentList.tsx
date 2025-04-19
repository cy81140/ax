import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Comment } from '../../types/services';
import { CommentItem } from './CommentItem';

export interface CommentListProps {
  comments: Comment[];
  onCommentAdded?: () => void;
  scrollable?: boolean;
}

export const CommentList = ({ comments, onCommentAdded, scrollable = true }: CommentListProps) => {
  const theme = useTheme();

  const renderComment = (item: Comment, index: number) => (
    <CommentItem key={item.id || index} comment={item} />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comments</Text>
      {scrollable ? (
        <FlatList
          data={comments}
          renderItem={({ item }) => renderComment(item, 0)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.listContent}>
          {comments.map((item, index) => renderComment(item, index))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
}); 