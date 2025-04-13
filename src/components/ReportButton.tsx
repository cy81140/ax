import React, { useState } from 'react';
import { IconButton } from 'react-native-paper';
import { StyleProp, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';
import ReportModal from './ReportModal';
import { ReportType } from '../services/moderation';

interface ReportButtonProps {
  reportedId: string;
  reportType: ReportType;
  contentPreview?: string;
  style?: StyleProp<ViewStyle>;
  size?: number;
  iconColor?: string;
}

const ReportButton: React.FC<ReportButtonProps> = ({
  reportedId,
  reportType,
  contentPreview,
  style,
  size = 20,
  iconColor = theme.colors.outline,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleReportSuccess = () => {
    setModalVisible(false);
  };

  return (
    <>
      <IconButton
        icon="flag"
        iconColor={iconColor}
        size={size}
        onPress={() => setModalVisible(true)}
        style={style}
      />
      
      <ReportModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onSuccess={handleReportSuccess}
        reportedId={reportedId}
        reportType={reportType}
        contentPreview={contentPreview}
      />
    </>
  );
};

export default ReportButton; 