import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Searchbar, List, useTheme } from 'react-native-paper';
import { searchService } from '../../services/search';
import { SearchResult } from '../../types/services';

export const SearchScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setLoading(true);
      try {
        const data = await searchService.search(query);
        setResults(data.map(item => ({
          ...item,
          type: 'username' in item ? 'user' : 'content' in item ? 'post' : 'comment'
        })));
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setResults([]);
    }
  };

  const renderItem = ({ item }: { item: SearchResult }) => {
    if (item.type === 'user') {
      return (
        <List.Item
          title={item.username || ''}
          description={item.users?.bio || ''}
          left={(props: { color: string; style: any }) => <List.Icon {...props} icon="account" />}
        />
      );
    } else if (item.type === 'post') {
      return (
        <List.Item
          title={item.content || ''}
          description={new Date(item.created_at).toLocaleString()}
          left={(props: { color: string; style: any }) => <List.Icon {...props} icon="post" />}
        />
      );
    } else {
      return (
        <List.Item
          title={item.text || ''}
          description={new Date(item.created_at).toLocaleString()}
          left={(props: { color: string; style: any }) => <List.Icon {...props} icon="comment" />}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBar: {
    margin: 16,
  },
  list: {
    flex: 1,
  },
}); 