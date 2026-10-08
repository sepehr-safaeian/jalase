import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/notes/BottomSheet';
import { WheelPicker, PICKER_HEIGHT } from '@/components/ui/WheelPicker';
import { formatHourLabel, formatNumber } from '@/lib/format-date';
import { buildHourOptions, buildMinuteOptions } from '@/lib/schedule-date';
import { useSettings } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

interface TimePickerSheetProps {
  visible: boolean;
  value: { hour: number; minute: number };
  onClose: () => void;
  onConfirm: (value: { hour: number; minute: number }) => void;
}

export function TimePickerSheet({
  visible,
  value,
  onClose,
  onConfirm,
}: TimePickerSheetProps) {
  const { t } = useTranslation();
  const { locale } = useSettings();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  const hourOptions = useMemo(() => buildHourOptions(), []);
  const minuteOptions = useMemo(() => buildMinuteOptions(5), []);

  return (
    <BottomSheet
      visible={visible}
      title={t('meetings.pickTimeTitle')}
      onClose={onClose}
    >
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text variant="uiSm" color="muted" weight="600" style={styles.columnLabel}>
              {t('meetings.hourLabel')}
            </Text>
            <WheelPicker
              items={hourOptions}
              value={draft.hour}
              onValueChange={(hour) => setDraft((prev) => ({ ...prev, hour }))}
              formatLabel={(hour) => formatHourLabel(hour, locale)}
            />
          </View>
          <View style={styles.separator}>
            <Text variant="headingSm" weight="700">
              :
            </Text>
          </View>
          <View style={styles.column}>
            <Text variant="uiSm" color="muted" weight="600" style={styles.columnLabel}>
              {t('meetings.minuteLabel')}
            </Text>
            <WheelPicker
              items={minuteOptions}
              value={draft.minute}
              onValueChange={(minute) => setDraft((prev) => ({ ...prev, minute }))}
              formatLabel={(minute) => formatNumber(minute, 2)}
            />
          </View>
        </View>

        <Button label={t('common.confirm')} onPress={() => onConfirm(draft)} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.base,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    // Clock reads hour:minute left to right in every locale
    direction: 'ltr',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: spacing.sm,
    height: PICKER_HEIGHT + 28,
  },
  column: {
    width: 120,
    flexShrink: 0,
  },
  separator: {
    width: 20,
    height: PICKER_HEIGHT + 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 28,
  },
  columnLabel: {
    textAlign: 'center',
    marginBottom: spacing.xs,
    height: 20,
  },
});
