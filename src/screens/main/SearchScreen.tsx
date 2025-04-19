import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ListRenderItemInfo } from 'react-native';
import { Searchbar, List, useTheme, Surface, Appbar, ActivityIndicator, Text, Avatar } from 'react-native-paper';
import { searchService } from '../../services/search';
import { SearchResult } from '../../types/services';
import { useNavigation } from '@react-navigation/native';
import { MaterialBottomTabNavigationProp } from '@react-navigation/material-bottom-tabs';
import { MainTabParamList } from '../../types/navigation';
import { debounce } from 'lodash';
import { formatDistanceToNow } from 'date-fns';

type ListItemProps = { color: string; style?: any };

export const SearchScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<MaterialBottomTabNavigationProp<MainTabParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim()) {
        setLoading(true);
        setHasSearched(true);
        try {
          const data = await searchService.search(query);
          setResults(data.map((item: any) => ({
            ...item,
            type: item.type || ('username' in item ? 'user' : 'content' in item ? 'post' : 'comment')
          })));
        } catch (error) {
          console.error('Error searching:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setLoading(false);
        setHasSearched(false);
      }
    }, 500),
    []
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const navigateToUser = (userId: string) => {
    console.log("Navigate to user:", userId);
  };
  const navigateToPost = (postId: string) => {
    console.log("Navigate to post:", postId);
  };
  const navigateToComment = (commentId: string) => {
    console.log("Navigate to comment/post:", commentId);
  };

  const renderItem = ({ item }: ListRenderItemInfo<SearchResult>) => {
    const onPress = () => {
      if (item.type === 'user' && item.id) navigateToUser(item.id);
      else if (item.type === 'post' && item.id) navigateToPost(item.id);
      else if (item.type === 'comment' && item.id) navigateToComment(item.id);
    };

    if (item.type === 'user') {
      return (
        <List.Item
          title={item.username || 'Unknown User'}
          description={item.users?.bio || 'User Profile'}
          onPress={onPress}
          left={(props: ListItemProps) => (
            item.users?.profile_picture
            ? <Avatar.Image {...props} source={{ uri: item.users.profile_picture }} size={40} />
            : <Avatar.Icon {...props} icon="account" size={40} />
          )}
        />
      );
    } else if (item.type === 'post') {
      return (
        <List.Item
          title={item.content || 'Post Content'}
          description={`Post by ${item.users?.username || '...'} - ${formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}`}
          onPress={onPress}
          left={(props: ListItemProps) => <List.Icon {...props} icon="file-document-outline" />}
        />
      );
    } else {
      return (
        <List.Item
          title={item.text || 'Comment Text'}
          description={`Comment by ${item.users?.username || '...'} - ${formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}`}
          onPress={onPress}
          left={(props: ListItemProps) => <List.Icon {...props} icon="comment-processing-outline" />}
        />
      );
    }
  };

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Searchbar
          placeholder="Search users, posts..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchBar}
          loading={loading}
        />
      </Appbar.Header>

      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || `search-${index}`}
        style={styles.list}
        contentContainerStyle={results.length === 0 ? styles.listEmptyContainer : null}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !loading && hasSearched ? (
             <View style={styles.emptyComponent}>
                <Text variant="titleMedium">No results found</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Try searching for something else.</Text>
             </View>
          ) : null
        }
      />
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyComponent: {
      alignItems: 'center',
      padding: 32,
  },
  list: {
    flex: 1,
  },
  listEmptyContainer: {
      alignItems: 'center',
      flexGrow: 1,
      justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
  }
}); 