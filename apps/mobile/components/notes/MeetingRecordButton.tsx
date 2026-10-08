import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useTranslation } from 'react-i18next';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface MeetingRecordButtonProps {
  onPress: () => void;
}

export function MeetingRecordButton({ onPress }: MeetingRecordButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();

  return (
    <View style={[styles.wrap, { pointerEvents: 'box-none' }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('notes.recordMeeting')}
        style={({ pressed }) => [
          styles.button,
          {
            flexDirection: isRtl ? 'row-reverse' : 'row',
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.88 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <Feather name="mic" size={18} color={colors.primary} />
        <Text variant="uiSm" weight="600" style={{ color: colors.text }}>
          {t('notes.recordMeeting')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.lg,
    alignItems: 'center',
    zIndex: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
