import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/notes/BottomSheet';
import { WheelPicker, PICKER_HEIGHT } from '@/components/ui/WheelPicker';
import { formatMonthName, formatNumber } from '@/lib/format-date';
import {
  buildDayOptions,
  buildMonthOptions,
  buildYearOptions,
  clampDay,
  getCurrentYear,
  type GregorianDateParts,
} from '@/lib/schedule-date';
import { useSettings } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

interface DatePickerSheetProps {
  visible: boolean;
  value: GregorianDateParts;
  onClose: () => void;
  onConfirm: (value: GregorianDateParts) => void;
}

export function DatePickerSheet({
  visible,
  value,
  onClose,
  onConfirm,
}: DatePickerSheetProps) {
  const { t } = useTranslation();
  const { isRtl, locale } = useSettings();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  const yearOptions = useMemo(() => buildYearOptions(getCurrentYear()), []);
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const dayOptions = useMemo(
    () => buildDayOptions(draft.year, draft.month),
    [draft.year, draft.month],
  );

  const updateDraft = (patch: Partial<GregorianDateParts>) => {
    setDraft((prev) => clampDay({ ...prev, ...patch }));
  };

  const dayColumn = (
    <View style={styles.columnDay} key="day">
      <Text variant="uiSm" color="muted" weight="600" style={styles.columnLabel}>
        {t('meetings.dayLabel')}
      </Text>
      <WheelPicker
        items={dayOptions}
        value={draft.day}
        onValueChange={(day) => updateDraft({ day })}
        formatLabel={(day) => formatNumber(day)}
      />
    </View>
  );

  const monthColumn = (
    <View style={styles.columnMonth} key="month">
      <Text variant="uiSm" color="muted" weight="600" style={styles.columnLabel}>
        {t('meetings.monthLabel')}
      </Text>
      <WheelPicker
        items={monthOptions}
        value={draft.month}
        onValueChange={(month) => updateDraft({ month })}
        formatLabel={(month) => formatMonthName(month, 'long', locale)}
      />
    </View>
  );

  const yearColumn = (
    <View style={styles.columnYear} key="year">
      <Text variant="uiSm" color="muted" weight="600" style={styles.columnLabel}>
        {t('meetings.yearLabel')}
      </Text>
      <WheelPicker
        items={yearOptions}
        value={draft.year}
        onValueChange={(year) => updateDraft({ year })}
        formatLabel={(year) => formatNumber(year)}
      />
    </View>
  );

  // English reads month, day, year left to right; Persian reads
  // day, month, year right to left (row-reverse in RTL).
  const columns = isRtl
    ? [dayColumn, monthColumn, yearColumn]
    : [monthColumn, dayColumn, yearColumn];

  return (
    <BottomSheet
      visible={visible}
      title={t('meetings.pickDateTitle')}
      onClose={onClose}
    >
      <View style={styles.content}>
        <View
          style={[styles.row, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
        >
          {columns}
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
    gap: spacing.sm,
    height: PICKER_HEIGHT + 28,
  },
  columnDay: {
    width: 80,
    flexShrink: 0,
  },
  columnMonth: {
    flex: 1,
    minWidth: 120,
  },
  columnYear: {
    width: 88,
    flexShrink: 0,
  },
  columnLabel: {
    textAlign: 'center',
    marginBottom: spacing.xs,
    height: 20,
  },
});
