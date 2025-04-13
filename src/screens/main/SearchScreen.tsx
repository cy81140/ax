import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Searchbar, Text, List, Avatar, Divider, ActivityIndicator } from 'react-native-paper';
import { theme } from '../../constants/theme';
import { AvatarTextProps, ListIconProps } from '../../types/components';
import { search, SearchResult } from '../../services/search';
import debounce from 'lodash.debounce';

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a debounced search function to avoid too many API calls
  const debouncedSearch = React.useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data, error } = await search(query);
        
        if (error) throw error;
        
        setResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
        setError('Error searching. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  // Effect to trigger search when query changes
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    debouncedSearch(searchQuery);
    
    // Cleanup function to cancel debounce on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
  };

  const renderItem = ({ item }: { item: SearchResult }) => {
    if (item.type === 'user') {
      return (
        <List.Item
          title={item.username}
          description={item.bio || 'No bio available'}
          left={(props: AvatarTextProps) => (
            item.profile_picture ? (
              <Avatar.Image 
                {...props} 
                size={40} 
                source={{ uri: item.profile_picture }} 
              />
            ) : (
              <Avatar.Text 
                {...props} 
                size={40} 
                label={item.username.charAt(0).toUpperCase()} 
              />
            )
          )}
          onPress={() => console.log(`Navigate to user profile ${item.id}`)}
        />
      );
    } else {
      // It's a post
      return (
        <List.Item
          title={item.content.length > 50 ? `${item.content.substring(0, 50)}...` : item.content}
          description={`Posted by @${item.user.username}`}
          left={(props: ListIconProps) => (
            item.image_url ? (
              <Image 
                source={{ uri: item.image_url }} 
                style={{ width: 40, height: 40, borderRadius: 4 }} 
              />
            ) : (
              <List.Icon {...props} icon="text-box-outline" />
            )
          )}
          onPress={() => console.log(`Navigate to post ${item.id}`)}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Searchbar
        placeholder="Search users and posts"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => `${item.type}-${item.id}`}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <Divider />}
          ListEmptyComponent={
            searchQuery.length >= 2 ? (
              <View style={styles.emptyContainer}>
                <Text>No results found</Text>
              </View>
            ) : searchQuery.length > 0 ? (
              <View style={styles.emptyContainer}>
                <Text>Enter at least 2 characters to search</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text>Start typing to search for users and posts</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.colors.primary,
  },
  searchbar: {
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.primary,
  },
  errorContainer: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  errorText: {
    color: '#c62828',
  },
});

export default SearchScreen; 