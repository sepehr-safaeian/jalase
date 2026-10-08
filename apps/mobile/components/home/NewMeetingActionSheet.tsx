import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { BottomSheet } from '@/components/notes/BottomSheet';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export type NewMeetingChoice = 'now' | 'schedule';

interface NewMeetingActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (choice: NewMeetingChoice) => void;
}

const OPTIONS: Array<{
  key: NewMeetingChoice;
  titleKey: string;
  subtitleKey: string;
  icon: string;
}> = [
  {
    key: 'now',
    titleKey: 'meetings.optionNowTitle',
    subtitleKey: 'meetings.optionNowSubtitle',
    icon: '●',
  },
  {
    key: 'schedule',
    titleKey: 'meetings.optionLaterTitle',
    subtitleKey: 'meetings.optionLaterSubtitle',
    icon: '◷',
  },
];

export function NewMeetingActionSheet({
  visible,
  onClose,
  onSelect,
}: NewMeetingActionSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const textAlign = isRtl ? 'right' : 'left';

  return (
    <BottomSheet
      visible={visible}
      title={t('meetings.newMeetingSheetTitle')}
      onClose={onClose}
    >
      <View style={styles.list}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            style={({ pressed }) => [
              styles.option,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                backgroundColor: colors.surface,
                borderColor: colors.border,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t(option.titleKey)}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: colors.primaryTint,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text variant="body" weight="700" style={{ color: colors.primary }}>
                {option.icon}
              </Text>
            </View>
            <View style={styles.copy}>
              <Text variant="body" weight="700" style={{ textAlign }}>
                {t(option.titleKey)}
              </Text>
              <Text
                variant="uiSm"
                color="muted"
                style={[styles.subtitle, { textAlign }]}
              >
                {t(option.subtitleKey)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  option: {
    alignItems: 'center',
    gap: spacing.base,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 72,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    alignItems: 'stretch',
  },
  subtitle: {
    lineHeight: 20,
  },
});
