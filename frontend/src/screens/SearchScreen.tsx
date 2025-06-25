import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SafeIcon } from '../components/SafeIcon';
import { useChatStore } from '../store/chatStore';
import { searchService, SearchResult, SearchOptions } from '../services/SearchService';
import { SkeletonLoader, EmptyState } from '../components/LoadingOverlay';

interface SearchScreenProps {
  navigation: any;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { conversations, messages } = useChatStore();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    searchInMessages: true,
    searchInTitles: true,
    sortBy: 'relevance' as 'relevance' | 'date',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  useEffect(() => {
    // 加载搜索历史
    const history = searchService.getSearchHistory();
    setSearchHistory(history);
  }, []);

  const handleSearch = useCallback(async (searchQuery: string = query) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const searchOptions: SearchOptions = {
        query: searchQuery.trim(),
        searchInMessages: filters.searchInMessages,
        searchInTitles: filters.searchInTitles,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: 100,
      };

      const searchResults = await searchService.search(
        conversations,
        messages,
        searchOptions
      );

      setResults(searchResults);
      
      // 添加到搜索历史
      searchService.addToHistory(searchQuery.trim());
      setSearchHistory(searchService.getSearchHistory());
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert(t('common.error'), 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, conversations, messages, t]);

  const handleQueryChange = useCallback(async (text: string) => {
    setQuery(text);

    if (text.trim().length > 1) {
      setShowSuggestions(true);
      try {
        const newSuggestions = await searchService.getSearchSuggestions(
          conversations,
          messages,
          text.trim(),
          5
        );
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Suggestions error:', error);
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [conversations, messages]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  }, [handleSearch]);

  const handleHistoryPress = useCallback((historyItem: string) => {
    setQuery(historyItem);
    handleSearch(historyItem);
  }, [handleSearch]);

  const handleResultPress = useCallback((result: SearchResult) => {
    if (result.type === 'conversation') {
      navigation.navigate('Chat', { conversationId: result.conversationId });
    } else {
      // 跳转到消息所在的对话
      navigation.navigate('Chat', { 
        conversationId: result.conversationId,
        highlightMessageId: result.id 
      });
    }
  }, [navigation]);

  const renderSearchResult = useCallback(({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleResultPress(item)}
    >
      <View style={styles.resultHeader}>
        <SafeIcon 
          name={item.type === 'conversation' ? 'chatbubbles-outline' : 'chatbubble-outline'} 
          size={16} 
          color="#007AFF" 
        />
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.conversationTitle}
        </Text>
        <Text style={styles.resultType}>
          {item.type === 'conversation' ? 'Title' : 'Message'}
        </Text>
      </View>
      
      <Text style={styles.resultSnippet} numberOfLines={3}>
        {item.snippet}
      </Text>
      
      <View style={styles.resultFooter}>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        <Text style={styles.relevanceScore}>
          {Math.round(item.relevanceScore * 100)}% match
        </Text>
      </View>
    </TouchableOpacity>
  ), [handleResultPress]);

  const renderSuggestion = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <SafeIcon name="search-outline" size={16} color="#8E8E93" />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  ), [handleSuggestionPress]);

  const renderHistoryItem = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistoryPress(item)}
    >
      <SafeIcon name="time-outline" size={16} color="#8E8E93" />
      <Text style={styles.historyText}>{item}</Text>
    </TouchableOpacity>
  ), [handleHistoryPress]);

  const renderEmptyState = () => {
    if (query.trim() && !isSearching && results.length === 0) {
      return (
        <EmptyState
          icon="search-outline"
          title="No results found"
          description={`No conversations or messages found for "${query}"`}
        />
      );
    }

    if (!query.trim() && searchHistory.length === 0) {
      return (
        <EmptyState
          icon="search-outline"
          title="Search conversations"
          description="Search through your chat history and conversation titles"
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <SafeIcon name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <View style={styles.searchInputContainer}>
          <SafeIcon name="search-outline" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <SafeIcon name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 筛选选项 */}
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            filters.searchInMessages && styles.filterButtonActive
          ]}
          onPress={() => setFilters(prev => ({ 
            ...prev, 
            searchInMessages: !prev.searchInMessages 
          }))}
        >
          <Text style={[
            styles.filterButtonText,
            filters.searchInMessages && styles.filterButtonTextActive
          ]}>
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.filterButton,
            filters.searchInTitles && styles.filterButtonActive
          ]}
          onPress={() => setFilters(prev => ({ 
            ...prev, 
            searchInTitles: !prev.searchInTitles 
          }))}
        >
          <Text style={[
            styles.filterButtonText,
            filters.searchInTitles && styles.filterButtonTextActive
          ]}>
            Titles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => {
            const newSortBy = filters.sortBy === 'relevance' ? 'date' : 'relevance';
            setFilters(prev => ({ ...prev, sortBy: newSortBy }));
          }}
        >
          <SafeIcon 
            name={filters.sortBy === 'relevance' ? 'star-outline' : 'time-outline'} 
            size={16} 
            color="#007AFF" 
          />
          <Text style={styles.sortButtonText}>
            {filters.sortBy === 'relevance' ? 'Relevance' : 'Date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 搜索结果或建议 */}
      <View style={styles.content}>
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `suggestion-${index}`}
            style={styles.suggestionsList}
          />
        )}

        {!isSearching && !showSuggestions && query.trim() && results.length > 0 && (
          <FlatList
            data={results}
            renderItem={renderSearchResult}
            keyExtractor={item => `${item.type}-${item.id}`}
            showsVerticalScrollIndicator={false}
          />
        )}

        {!query.trim() && searchHistory.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <FlatList
              data={searchHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item, index) => `history-${index}`}
            />
          </View>
        )}

        {renderEmptyState()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#8E8E93',
  },
  resultItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  resultType: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resultSnippet: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    marginBottom: 8,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  relevanceScore: {
    fontSize: 12,
    color: '#007AFF',
  },
  suggestionsList: {
    backgroundColor: '#fff',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  suggestionText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  historyText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
});