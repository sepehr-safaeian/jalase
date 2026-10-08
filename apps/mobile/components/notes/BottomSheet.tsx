import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface BottomSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ visible, title, onClose, children }: BottomSheetProps) {
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Animated.View
            entering={FadeIn.duration(160)}
            style={[styles.backdropFill, { backgroundColor: 'rgba(14, 15, 12, 0.2)' }]}
          />
        </Pressable>

        <Animated.View
          entering={SlideInDown.duration(240)}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, spacing.base),
            },
          ]}
        >
          <Pressable onPress={() => undefined} style={styles.sheetInner}>
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
            </View>
            <Text
              variant="headingSm"
              weight="700"
              style={[styles.title, { textAlign: isRtl ? 'right' : 'left' }]}
            >
              {title}
            </Text>
            <View style={styles.body}>{children}</View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    maxHeight: '85%',
  },
  sheetInner: {
    width: '100%',
  },
  handleRow: {
    alignItems: 'center',
    paddingBottom: spacing.base,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
  },
  title: {
    marginBottom: spacing.lg,
  },
  body: {
    gap: spacing.lg,
    overflow: 'hidden',
  },
});
