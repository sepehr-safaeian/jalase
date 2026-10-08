import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { formatDateTime } from '@/lib/format-date';
import { useSettings } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { BottomSheet } from './BottomSheet';

interface NoteDateSheetProps {
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  meetingDate: string | null;
  onClose: () => void;
}

function DateBlock({ label, value }: { label: string; value: string }) {
  const { isRtl } = useSettings();

  return (
    <View style={[styles.block, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
      <Text variant="uiSm" color="quiet">
        {label}
      </Text>
      <Text variant="body" weight="500">
        {value}
      </Text>
    </View>
  );
}

export function NoteDateSheet({
  visible,
  createdAt,
  updatedAt,
  meetingDate,
  onClose,
}: NoteDateSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet visible={visible} title={t('notes.dateSheetHeader')} onClose={onClose}>
      <View style={styles.list}>
        <DateBlock label={t('notes.dateSheetTitle')} value={formatDateTime(meetingDate)} />
        <DateBlock label={t('notes.dateCreated')} value={formatDateTime(createdAt)} />
        <DateBlock label={t('notes.dateUpdated')} value={formatDateTime(updatedAt)} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  block: {
    gap: spacing.xs,
  },
});
