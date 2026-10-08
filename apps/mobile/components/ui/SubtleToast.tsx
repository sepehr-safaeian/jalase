import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface SubtleToastProps {
  message: string | null;
  onHidden?: () => void;
  durationMs?: number;
}

export function SubtleToast({
  message,
  onHidden,
  durationMs = 2200,
}: SubtleToastProps) {
  const { colors } = useTheme();
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;

    setDisplayMessage(message);

    const timer = setTimeout(() => {
      setDisplayMessage(null);
      onHidden?.();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [message, durationMs, onHidden]);

  if (!displayMessage) return null;

  return (
    <View style={styles.host} pointerEvents="none">
      <Animated.View
        entering={FadeIn.duration(280)}
        exiting={FadeOut.duration(280)}
        style={[
          styles.toast,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text variant="uiSm" color="muted" style={styles.label}>
          {displayMessage}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: 108,
    alignItems: 'center',
    zIndex: 20,
  },
  toast: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 320,
  },
  label: {
    textAlign: 'center',
  },
});
