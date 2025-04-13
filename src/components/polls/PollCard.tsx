import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, RadioButton, Checkbox, Button, ProgressBar, Caption } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { Poll, getPollResults, votePoll } from '../../services/polls';
import { theme } from '../../constants/theme';

interface PollCardProps {
  poll: Poll;
  onVoted?: () => void;
}

interface PollResult {
  option_id: string;
  text: string;
  votes: number;
  percentage: number;
}

const PollCard = ({ poll, onVoted }: PollCardProps) => {
  const { user } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(poll.user_voted || false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PollResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isMultipleChoice = poll.is_multiple_choice;
  const isPollActive = !poll.ends_at || new Date(poll.ends_at) > new Date();

  useEffect(() => {
    // If the user has already voted, fetch results immediately
    if (hasVoted) {
      fetchResults();
    }
  }, [hasVoted]);

  const fetchResults = async () => {
    try {
      const { data, error } = await getPollResults(poll.id);
      if (error) throw error;
      
      if (data) {
        const totalVotes = data.total_votes;
        setTotalVotes(totalVotes);
        
        // Calculate percentages and transform to match our interface
        const resultsWithPercentage: PollResult[] = data.options.map(option => ({
          option_id: option.option_id,
          text: option.option_text, // Map option_text to text
          votes: option.votes,
          percentage: totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
        }));
        
        setResults(resultsWithPercentage);
      }
    } catch (err) {
      console.error('Error fetching poll results:', err);
      setError('Failed to load poll results');
    }
  };

  const handleVote = async () => {
    if (!user || selectedOptions.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // For single-choice polls
      if (!isMultipleChoice) {
        const { error } = await votePoll(user.id, poll.id, selectedOptions[0]);
        if (error) throw error;
      } 
      // For multiple-choice polls
      else {
        // Vote on each selected option
        for (const optionId of selectedOptions) {
          const { error } = await votePoll(user.id, poll.id, optionId);
          if (error) throw error;
        }
      }
      
      setHasVoted(true);
      if (onVoted) onVoted();
      
      // Fetch results after voting
      await fetchResults();
    } catch (err) {
      console.error('Error voting on poll:', err);
      setError('Failed to cast your vote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    if (isMultipleChoice) {
      // For multiple choice, toggle the selection
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    } else {
      // For single choice, replace the selection
      setSelectedOptions([optionId]);
    }
  };

  // Render poll options for voting
  const renderVotingOptions = () => (
    <View style={styles.optionsContainer}>
      {poll.options.map(option => (
        <View key={option.id} style={styles.optionRow}>
          {isMultipleChoice ? (
            <Checkbox
              status={selectedOptions.includes(option.id) ? 'checked' : 'unchecked'}
              onPress={() => handleOptionSelect(option.id)}
              disabled={hasVoted || !isPollActive}
            />
          ) : (
            <RadioButton
              value={option.id}
              status={selectedOptions.includes(option.id) ? 'checked' : 'unchecked'}
              onPress={() => handleOptionSelect(option.id)}
              disabled={hasVoted || !isPollActive}
            />
          )}
          <Text style={styles.optionText}>{option.option_text}</Text>
        </View>
      ))}
      
      {isPollActive && !hasVoted && (
        <Button 
          mode="contained" 
          onPress={handleVote}
          loading={loading}
          disabled={loading || selectedOptions.length === 0}
          style={styles.voteButton}
        >
          Vote
        </Button>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  // Render poll results
  const renderResults = () => (
    <View style={styles.resultsContainer}>
      {results.map(result => (
        <View key={result.option_id} style={styles.resultRow}>
          <View style={styles.resultLabelRow}>
            <Text style={styles.optionText}>{result.text}</Text>
            <Text style={styles.voteCount}>
              {result.votes} {result.votes === 1 ? 'vote' : 'votes'} ({result.percentage.toFixed(1)}%)
            </Text>
          </View>
          <ProgressBar 
            progress={result.percentage / 100} 
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>
      ))}
      
      <Caption style={styles.totalVotes}>
        {totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}
      </Caption>
      
      {!isPollActive && (
        <Text style={styles.pollEndedText}>This poll has ended</Text>
      )}
    </View>
  );

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.question}>{poll.question}</Text>
        
        {/* Show voting options if user hasn't voted yet, otherwise show results */}
        {hasVoted ? renderResults() : renderVotingOptions()}
        
        {/* If they voted, show a button to view details/comments */}
        {hasVoted && (
          <Button 
            mode="text" 
            onPress={fetchResults}
            disabled={loading}
            style={styles.refreshButton}
          >
            Refresh Results
          </Button>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 8,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 4,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  optionsContainer: {
    marginTop: 8,
  },
  pollEndedText: {
    color: theme.colors.error,
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
  },
  progressBar: {
    borderRadius: 5,
    height: 10,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  refreshButton: {
    marginTop: 16,
  },
  resultLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultRow: {
    marginVertical: 8,
  },
  resultsContainer: {
    marginTop: 8,
  },
  totalVotes: {
    marginTop: 16,
    textAlign: 'center',
  },
  voteButton: {
    alignSelf: 'flex-end',
    marginTop: 16,
  },
  voteCount: {
    color: theme.colors.outline,
    fontSize: 14,
  },
});

export default PollCard; 