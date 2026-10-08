import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface IconButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  children: ReactNode;
  active?: boolean;
}

function IconButton({ onPress, accessibilityLabel, children, active }: IconButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: colors.surface,
          borderColor: active ? colors.primaryMid : colors.border,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  onProfile: () => void;
  onProjects: () => void;
  onSettings: () => void;
}

export function ProfileMenu({
  visible,
  onClose,
  onProfile,
  onProjects,
  onSettings,
}: ProfileMenuProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={[styles.backdropFill, { backgroundColor: 'rgba(14, 15, 12, 0.12)' }]}
        />
      </Pressable>

      <View
        style={[
          styles.menuHost,
          { alignItems: isRtl ? 'flex-end' : 'flex-start' },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          style={[
            styles.menu,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <MenuRow
            label={t('home.profile')}
            onPress={onProfile}
            isRtl={isRtl}
          />
          <MenuRow
            label={t('home.projects')}
            onPress={onProjects}
            isRtl={isRtl}
          />
          <MenuRow
            label={t('home.settings')}
            onPress={onSettings}
            isRtl={isRtl}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

function MenuRow({
  label,
  onPress,
  isRtl,
}: {
  label: string;
  onPress: () => void;
  isRtl: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        {
          flexDirection: isRtl ? 'row-reverse' : 'row',
          opacity: pressed ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text
        variant="body"
        weight="500"
        style={{ textAlign: isRtl ? 'right' : 'left', flex: 1 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SearchButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <IconButton onPress={onPress} accessibilityLabel={t('common.search')}>
      <Feather name="search" size={20} color={colors.textMuted} />
    </IconButton>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    flex: 1,
  },
  menuHost: {
    position: 'absolute',
    top: spacing['3xl'] + spacing.xl,
    right: spacing.xl,
    left: spacing.xl,
  },
  menu: {
    minWidth: 240,
    maxWidth: 280,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  menuRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
