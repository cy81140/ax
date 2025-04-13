import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Switch, Text, IconButton, Divider } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../../hooks/useAuth';
import { createPoll } from '../../services/polls';
import { theme } from '../../constants/theme';

interface CreatePollFormProps {
  postId: string;
  onPollCreated: () => void;
  onCancel: () => void;
}

const CreatePollForm = ({ postId, onPollCreated, onCancel }: CreatePollFormProps) => {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return; // Minimum 2 options required
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleOptionChange = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const validateForm = () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return false;
    }

    // Check if we have at least 2 non-empty options
    const validOptions = options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      setError('Please enter at least 2 options');
      return false;
    }

    // Check if end date is in the future
    if (hasEndDate && endDate <= new Date()) {
      setError('End date must be in the future');
      return false;
    }

    return true;
  };

  const handleCreatePoll = async () => {
    if (!user) return;
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Filter out empty options
      const validOptions = options.filter(opt => opt.trim().length > 0);
      
      const { data, error: pollError } = await createPoll(
        user.id,
        postId,
        question,
        validOptions,
        isMultipleChoice,
        hasEndDate ? endDate : null
      );

      if (pollError) throw pollError;
      
      // Poll created successfully
      onPollCreated();
    } catch (err) {
      console.error('Error creating poll:', err);
      setError('Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create a Poll</Text>
      
      <TextInput
        label="Question"
        value={question}
        onChangeText={setQuestion}
        mode="outlined"
        style={styles.input}
        placeholder="Ask a question..."
      />
      
      <Text style={styles.subtitle}>Options</Text>
      
      {options.map((option, index) => (
        <View key={index} style={styles.optionRow}>
          <TextInput
            label={`Option ${index + 1}`}
            value={option}
            onChangeText={(text: string) => handleOptionChange(text, index)}
            mode="outlined"
            style={styles.optionInput}
            placeholder={`Enter option ${index + 1}`}
          />
          {options.length > 2 && (
            <IconButton
              icon="close"
              size={20}
              onPress={() => handleRemoveOption(index)}
            />
          )}
        </View>
      ))}
      
      <Button 
        mode="text" 
        onPress={handleAddOption}
        icon="plus"
        style={styles.addButton}
      >
        Add Option
      </Button>
      
      <Divider style={styles.divider} />
      
      <View style={styles.switchRow}>
        <Text>Allow multiple selections</Text>
        <Switch
          value={isMultipleChoice}
          onValueChange={setIsMultipleChoice}
          color={theme.colors.primary}
        />
      </View>
      
      <View style={styles.switchRow}>
        <Text>Set end date</Text>
        <Switch
          value={hasEndDate}
          onValueChange={setHasEndDate}
          color={theme.colors.primary}
        />
      </View>
      
      {hasEndDate && (
        <View style={styles.datePickerContainer}>
          <Button 
            mode="outlined" 
            onPress={() => setShowDatePicker(true)}
            icon="calendar"
            style={styles.dateButton}
          >
            {endDate.toLocaleDateString()}
          </Button>
          
          {showDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="datetime"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <View style={styles.buttonRow}>
        <Button 
          mode="outlined" 
          onPress={onCancel}
          style={styles.button}
        >
          Cancel
        </Button>
        <Button 
          mode="contained" 
          onPress={handleCreatePoll}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Create Poll
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  addButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  container: {
    padding: 16,
  },
  dateButton: {
    alignSelf: 'flex-start',
  },
  datePickerContainer: {
    marginBottom: 16,
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  errorText: {
    color: theme.colors.error,
    marginVertical: 8,
  },
  input: {
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default CreatePollForm; 