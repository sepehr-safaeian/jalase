import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/notes/BottomSheet';
import { formatNumber } from '@/lib/format-date';
import {
  clampDay,
  formatScheduleDateField,
  formatScheduleTimeField,
  formatUpcomingScheduleLabel,
  getDefaultScheduleParts,
  isScheduleInFuture,
  scheduleToDate,
  type MeetingScheduleParts,
} from '@/lib/schedule-date';
import { useSettings } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { DatePickerSheet } from './DatePickerSheet';
import { ScheduleField } from './ScheduleField';
import { TimePickerSheet } from './TimePickerSheet';

interface ScheduleMeetingSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (meetingDateIso: string) => void;
  loading?: boolean;
}

type PickerMode = 'none' | 'date' | 'time';

export function ScheduleMeetingSheet({
  visible,
  onClose,
  onConfirm,
  loading = false,
}: ScheduleMeetingSheetProps) {
  const { t } = useTranslation();
  const { isRtl } = useSettings();
  const textAlign = isRtl ? 'right' : 'left';
  const [parts, setParts] = useState<MeetingScheduleParts>(() =>
    getDefaultScheduleParts(),
  );
  const [error, setError] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>('none');

  useEffect(() => {
    if (visible) {
      setParts(getDefaultScheduleParts());
      setError(null);
      setPickerMode('none');
    }
  }, [visible]);

  const scheduleParts = useMemo(
    (): MeetingScheduleParts => ({
      ...parts,
      date: clampDay(parts.date),
    }),
    [parts],
  );

  const previewIso = useMemo(
    () => scheduleToDate(scheduleParts).toISOString(),
    [scheduleParts],
  );
  const previewLabel = formatUpcomingScheduleLabel(previewIso);
  const dateFieldValue = formatScheduleDateField(
    scheduleParts.date.day,
    scheduleParts.date.month,
  );
  const timeFieldValue = formatScheduleTimeField(
    scheduleParts.hour,
    scheduleParts.minute,
  );
  const yearHint = formatNumber(scheduleParts.date.year);

  const handleConfirm = () => {
    if (!isScheduleInFuture(scheduleParts)) {
      setError(t('meetings.mustBeFuture'));
      return;
    }
    onConfirm(previewIso);
  };

  return (
    <>
      <BottomSheet
        visible={visible}
        title={t('meetings.scheduleTitle')}
        onClose={onClose}
      >
        <View style={styles.content}>
          <View style={styles.preview}>
            <Text variant="uiSm" color="muted" weight="600" style={{ textAlign }}>
              {t('meetings.selectedTime')}
            </Text>
            <Text variant="headingSm" weight="700" style={{ textAlign }}>
              {previewLabel}
            </Text>
            <Text variant="uiSm" color="quiet" style={{ textAlign }}>
              {t('meetings.yearHint', { year: yearHint })}
            </Text>
          </View>

          <ScheduleField
            label={t('meetings.date')}
            value={dateFieldValue}
            onPress={() => setPickerMode('date')}
            accessibilityLabel={t('meetings.pickDate')}
          />

          <ScheduleField
            label={t('meetings.time')}
            value={timeFieldValue}
            onPress={() => setPickerMode('time')}
            accessibilityLabel={t('meetings.pickTime')}
          />

          {error ? (
            <Text variant="uiSm" color="error" style={{ textAlign }}>
              {error}
            </Text>
          ) : null}

          <Button
            label={t('meetings.createMeeting')}
            onPress={handleConfirm}
            loading={loading}
            style={styles.submit}
          />
        </View>
      </BottomSheet>

      <DatePickerSheet
        visible={visible && pickerMode === 'date'}
        value={scheduleParts.date}
        onClose={() => setPickerMode('none')}
        onConfirm={(next) => {
          setError(null);
          setParts((prev) => ({ ...prev, date: clampDay(next) }));
          setPickerMode('none');
        }}
      />

      <TimePickerSheet
        visible={visible && pickerMode === 'time'}
        value={{ hour: scheduleParts.hour, minute: scheduleParts.minute }}
        onClose={() => setPickerMode('none')}
        onConfirm={(next) => {
          setError(null);
          setParts((prev) => ({ ...prev, hour: next.hour, minute: next.minute }));
          setPickerMode('none');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.base,
    paddingBottom: spacing.sm,
  },
  preview: {
    gap: spacing.xs,
    alignItems: 'stretch',
  },
  submit: {
    marginTop: spacing.xs,
  },
});
