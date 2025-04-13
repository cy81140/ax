import React, { useState } from 'react';
import { View, Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Text, TextInput, RadioButton, Title } from 'react-native-paper';
import { theme } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { submitReport, ReportType } from '../services/moderation';
import { useAuth } from '../hooks/useAuth';

interface ReportModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  reportedId: string;
  reportType: ReportType;
  contentPreview?: string;
}

const reportReasons = {
  user: [
    'Harassment or bullying',
    'Impersonation',
    'Inappropriate content',
    'Spam',
    'Other',
  ],
  post: [
    'Hate speech',
    'Harassment or bullying',
    'Misinformation',
    'Inappropriate content',
    'Spam',
    'Copyright violation',
    'Other',
  ],
  comment: [
    'Hate speech',
    'Harassment or bullying',
    'Inappropriate content',
    'Spam',
    'Other',
  ],
  message: [
    'Harassment or bullying',
    'Inappropriate content',
    'Spam',
    'Other',
  ],
};

const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onDismiss,
  onSuccess,
  reportedId,
  reportType,
  contentPreview,
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to report content.');
      return;
    }

    if (!reason) {
      setError('Please select a reason for reporting.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const { error } = await submitReport(
        user.id,
        reportedId,
        reportType,
        reason,
        additionalInfo || undefined
      );

      if (error) throw error;

      setSubmitting(false);
      onSuccess();
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('Failed to submit report. Please try again.');
      setSubmitting(false);
    }
  };

  const getReportTypeLabel = () => {
    switch (reportType) {
      case 'user':
        return 'user';
      case 'post':
        return 'post';
      case 'comment':
        return 'comment';
      case 'message':
        return 'message';
      default:
        return 'content';
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Title>Report {getReportTypeLabel()}</Title>
            <TouchableOpacity onPress={onDismiss}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {contentPreview && (
            <View style={styles.contentPreview}>
              <Text style={styles.contentPreviewLabel}>You are reporting:</Text>
              <Text style={styles.contentPreviewText} numberOfLines={3}>
                {contentPreview}
              </Text>
            </View>
          )}

          <ScrollView style={styles.scrollView}>
            <Text style={styles.sectionTitle}>Why are you reporting this {getReportTypeLabel()}?</Text>

            <RadioButton.Group onValueChange={(value: string) => setReason(value)} value={reason}>
              {reportReasons[reportType].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.reasonItem}
                  onPress={() => setReason(item)}
                >
                  <RadioButton value={item} />
                  <Text>{item}</Text>
                </TouchableOpacity>
              ))}
            </RadioButton.Group>

            <Text style={styles.sectionTitle}>Additional information (optional)</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              placeholder="Please provide any additional details that will help us understand the issue..."
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={styles.button}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.button}
                loading={submitting}
                disabled={submitting || !reason}
              >
                Submit Report
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  scrollView: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    marginLeft: 8,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 8,
  },
  contentPreview: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  contentPreviewLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contentPreviewText: {
    fontStyle: 'italic',
  },
});

export default ReportModal; 