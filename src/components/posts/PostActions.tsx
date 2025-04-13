import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { Post } from '../../types/services';

interface PostActionsProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  isLiked: boolean;
}

export const PostActions: React.FC<PostActionsProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  isLiked,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <IconButton
        icon={isLiked ? 'heart' : 'heart-outline'}
        iconColor={isLiked ? theme.colors.error : theme.colors.onSurface}
        onPress={onLike}
      />
      <IconButton
        icon="comment-outline"
        iconColor={theme.colors.onSurface}
        onPress={onComment}
      />
      <IconButton
        icon="share-variant-outline"
        iconColor={theme.colors.onSurface}
        onPress={onShare}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
}); 