import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface NewNoteFabProps {
  onPress: () => void;
}

const ICON_SIZE = 16;
const ICON_RING = 30;

export function NewNoteFab({ onPress }: NewNoteFabProps) {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  const { isRtl } = useSettings();
  const insets = useSafeAreaInsets();

  const iconColor = colors.primaryText;
  const ringBg =
    scheme === 'dark' ? 'rgba(14, 15, 12, 0.18)' : 'rgba(255, 255, 255, 0.22)';
  const buttonBorder =
    scheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.28)';

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          {
            flexDirection: isRtl ? 'row-reverse' : 'row',
            backgroundColor: colors.primary,
            borderColor: buttonBorder,
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
          Platform.OS === 'web'
            ? ({ boxShadow: '0 4px 14px rgba(24, 122, 69, 0.22)' } as object)
            : null,
        ]}
        accessibilityLabel={t('home.newMeeting')}
        accessibilityRole="button"
        accessibilityHint={t('home.newMeetingHint')}
      >
        <View style={[styles.iconRing, { backgroundColor: ringBg }]}>
          <Feather name="plus" size={ICON_SIZE} color={iconColor} />
        </View>

        <Text
          variant="uiSm"
          weight="600"
          style={{ color: iconColor, letterSpacing: 0.2 }}
        >
          {t('home.newMeeting')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.base,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 46,
    minWidth: 132,
  },
  iconRing: {
    width: ICON_RING,
    height: ICON_RING,
    borderRadius: ICON_RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
