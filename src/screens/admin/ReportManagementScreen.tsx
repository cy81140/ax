import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  ActivityIndicator, 
  Divider, 
  Dialog, 
  Portal, 
  TextInput 
} from 'react-native-paper';
import { theme } from '../../constants/theme';
import { 
  getUnresolvedReports, 
  resolveReport, 
  banUser, 
  deletePost 
} from '../../services/moderation';
import { useAuth } from '../../hooks/useAuth';
import { Report } from '../../services/moderation';
import { formatDistanceToNow } from 'date-fns';

interface ReportWithUsers extends Report {
  reporter: {
    username: string;
    profile_picture: string | null;
  };
  reported_user: {
    username: string;
    profile_picture: string | null;
  };
}

const ReportManagementScreen = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportWithUsers | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDialogVisible, setBanDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await getUnresolvedReports();
      
      if (error) throw error;
      
      if (data) {
        setReports(data as ReportWithUsers[]);
      }
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Unable to load reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleResolve = async () => {
    if (!user || !selectedReport) return;
    
    setProcessingAction(true);
    try {
      const { error } = await resolveReport(
        selectedReport.id,
        user.id,
        resolveNotes || undefined
      );
      
      if (error) throw error;
      
      // Remove the resolved report from the list
      setReports(prev => prev.filter(r => r.id !== selectedReport.id));
      setDialogVisible(false);
      setResolveNotes('');
      setSelectedReport(null);
    } catch (err) {
      console.error('Error resolving report:', err);
      Alert.alert('Error', 'Failed to resolve report. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleBanUser = async () => {
    if (!user || !selectedReport) return;
    
    setProcessingAction(true);
    try {
      // Ban the user
      const banResult = await banUser(
        selectedReport.reported_id,
        user.id,
        banReason || 'Violated community guidelines'
      );

      // Check if banResult is an object and has an error property
      if (banResult && typeof banResult === 'object' && 'error' in banResult && banResult.error) {
        throw banResult.error;
      }

      // Also resolve the report
      const resolveResult = await resolveReport(
        selectedReport.id,
        user.id,
        `User banned. Reason: ${banReason || 'Violated community guidelines'}`
      );
      // Check resolve result for errors
      if (resolveResult && typeof resolveResult === 'object' && 'error' in resolveResult && resolveResult.error) {
        throw resolveResult.error;
      }

      // Remove the resolved report from the list
      setReports(prev => prev.filter(r => r.id !== selectedReport.id));
      setBanDialogVisible(false);
      setBanReason('');
      setSelectedReport(null);
      
      Alert.alert('Success', 'User has been banned.');
    } catch (err) {
      console.error('Error banning user:', err);
      Alert.alert('Error', 'Failed to ban user. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeletePost = async () => {
    if (!user || !selectedReport || selectedReport.report_type !== 'post') return;
    
    setProcessingAction(true);
    try {
      // Delete the post
      const deleteResult = await deletePost(
        selectedReport.reported_id,
        user.id,
        deleteReason || 'Violated community guidelines'
      );

      // Check if deleteResult is an object and has an error property
      if (deleteResult && typeof deleteResult === 'object' && 'error' in deleteResult && deleteResult.error) {
        throw deleteResult.error;
      }

      // Also resolve the report
      const resolveResult = await resolveReport(
        selectedReport.id,
        user.id,
        `Post deleted. Reason: ${deleteReason || 'Violated community guidelines'}`
      );
      // Check resolve result for errors
      if (resolveResult && typeof resolveResult === 'object' && 'error' in resolveResult && resolveResult.error) {
        throw resolveResult.error;
      }

      // Remove the resolved report from the list
      setReports(prev => prev.filter(r => r.id !== selectedReport.id));
      setDeleteDialogVisible(false);
      setDeleteReason('');
      setSelectedReport(null);
      
      Alert.alert('Success', 'Post has been deleted.');
    } catch (err) {
      console.error('Error deleting post:', err);
      Alert.alert('Error', 'Failed to delete post. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const renderReportItem = ({ item }: { item: ReportWithUsers }) => {
    const getReportTypeText = () => {
      switch (item.report_type) {
        case 'user':
          return 'User';
        case 'post':
          return 'Post';
        case 'comment':
          return 'Comment';
        case 'message':
          return 'Message';
        default:
          return 'Content';
      }
    };

    return (
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text style={styles.reportHeader}>
            Report #{item.id.substring(0, 8)} • {getReportTypeText()}
          </Text>
          <Text style={styles.reportDate}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
          
          <Divider style={styles.divider} />
          
          <View style={styles.reportDetails}>
            <Text style={styles.reportLabel}>Reported by:</Text>
            <Text style={styles.reportValue}>{item.reporter.username}</Text>
          </View>
          
          <View style={styles.reportDetails}>
            <Text style={styles.reportLabel}>Reported {getReportTypeText()}:</Text>
            <Text style={styles.reportValue}>
              {item.report_type === 'user' 
                ? item.reported_user.username 
                : `ID: ${item.reported_id}`}
            </Text>
          </View>
          
          <View style={styles.reportDetails}>
            <Text style={styles.reportLabel}>Reason:</Text>
            <Text style={styles.reportValue}>{item.reason}</Text>
          </View>
          
          {item.additional_info && (
            <View style={styles.reportDetails}>
              <Text style={styles.reportLabel}>Additional Info:</Text>
              <Text style={styles.reportValue}>{item.additional_info}</Text>
            </View>
          )}
          
          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              onPress={() => {
                setSelectedReport(item);
                setDialogVisible(true);
              }}
            >
              Resolve
            </Button>
            
            {item.report_type === 'user' && (
              <Button 
                mode="contained" 
                buttonColor={theme.colors.error}
                onPress={() => {
                  setSelectedReport(item);
                  setBanDialogVisible(true);
                }}
              >
                Ban User
              </Button>
            )}
            
            {item.report_type === 'post' && (
              <Button 
                mode="contained"
                buttonColor={theme.colors.error}
                onPress={() => {
                  setSelectedReport(item);
                  setDeleteDialogVisible(true);
                }}
              >
                Delete Post
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Resolve dialog
  const renderResolveDialog = () => (
    <Portal>
      <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
        <Dialog.Title>Resolve Report</Dialog.Title>
        <Dialog.Content>
          <Text>Add resolution notes (optional):</Text>
          <TextInput
            style={styles.dialogInput}
            multiline
            numberOfLines={3}
            value={resolveNotes}
            onChangeText={setResolveNotes}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
          <Button 
            onPress={handleResolve} 
            loading={processingAction}
            disabled={processingAction}
          >
            Resolve
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  // Ban user dialog
  const renderBanDialog = () => (
    <Portal>
      <Dialog visible={banDialogVisible} onDismiss={() => setBanDialogVisible(false)}>
        <Dialog.Title>Ban User</Dialog.Title>
        <Dialog.Content>
          <Text>This action will ban the user from using the platform. Please provide a reason:</Text>
          <TextInput
            style={styles.dialogInput}
            multiline
            numberOfLines={3}
            value={banReason}
            onChangeText={setBanReason}
            placeholder="Violated community guidelines..."
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setBanDialogVisible(false)}>Cancel</Button>
          <Button 
            onPress={handleBanUser} 
            loading={processingAction}
            disabled={processingAction}
            textColor={theme.colors.error}
          >
            Ban User
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  // Delete post dialog
  const renderDeleteDialog = () => (
    <Portal>
      <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
        <Dialog.Title>Delete Post</Dialog.Title>
        <Dialog.Content>
          <Text>This action will permanently delete the post. Please provide a reason:</Text>
          <TextInput
            style={styles.dialogInput}
            multiline
            numberOfLines={3}
            value={deleteReason}
            onChangeText={setDeleteReason}
            placeholder="Violated community guidelines..."
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
          <Button 
            onPress={handleDeletePost} 
            loading={processingAction}
            disabled={processingAction}
            textColor={theme.colors.error}
          >
            Delete Post
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Management</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReportItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No outstanding reports</Text>
            <Text>All reports have been resolved!</Text>
          </View>
        }
      />
      
      {renderResolveDialog()}
      {renderBanDialog()}
      {renderDeleteDialog()}
    </View>
  );
};

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
    padding: 16,
  },
  dialogInput: {
    backgroundColor: theme.colors.surfaceVariant,
    marginTop: 8,
  },
  divider: {
    marginVertical: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 4,
    marginBottom: 10,
    padding: 10,
  },
  errorText: {
    color: '#c62828',
  },
  listContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.primary,
    marginTop: 8,
  },
  reportDate: {
    color: theme.colors.outline,
    fontSize: 12,
    marginTop: 4,
  },
  reportDetails: {
    marginBottom: 8,
  },
  reportHeader: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reportValue: {
    fontSize: 14,
    marginTop: 2,
  },
  title: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default ReportManagementScreen; 