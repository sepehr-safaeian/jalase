import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { resolveApiAssetUrl, getUserInitials } from '@/lib/user/profile.utils';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { ProfileMenu, SearchButton } from './ProfileMenu';

interface HomeHeaderProps {
  displayName: string;
  avatarUrl?: string | null;
  onSearch?: () => void;
}

export function HomeHeader({
  displayName,
  avatarUrl,
  onSearch,
}: HomeHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const resolvedAvatar = resolveApiAssetUrl(avatarUrl ?? null);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.topRow,
          { flexDirection: isRtl ? 'row-reverse' : 'row' },
        ]}
      >
        <View
          style={[
            styles.actions,
            { flexDirection: isRtl ? 'row-reverse' : 'row' },
          ]}
        >
          <View style={styles.avatarAnchor}>
            <Pressable
              onPress={() => setMenuOpen((open) => !open)}
              style={({ pressed }) => [
                styles.avatar,
                {
                  backgroundColor: colors.primaryTint,
                  borderColor: menuOpen ? colors.primaryMid : colors.border,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
              accessibilityLabel={t('home.profileMenu')}
              accessibilityRole="button"
            >
              {resolvedAvatar ? (
                <Image source={{ uri: resolvedAvatar }} style={styles.avatarImage} />
              ) : (
                <Text variant="ui" weight="700" style={{ color: colors.primary }}>
                  {getUserInitials(displayName)}
                </Text>
              )}
            </Pressable>

            <ProfileMenu
              visible={menuOpen}
              onClose={() => setMenuOpen(false)}
              onProfile={() => {
                setMenuOpen(false);
                router.push('/profile');
              }}
              onProjects={() => {
                setMenuOpen(false);
                router.push('/projects');
              }}
              onSettings={() => {
                setMenuOpen(false);
                router.push('/settings');
              }}
            />
          </View>

          <SearchButton onPress={() => onSearch?.()} />
        </View>
      </View>

      <View style={styles.greeting}>
        <Text
          variant="headingMd"
          weight="700"
          style={{ textAlign: isRtl ? 'right' : 'left' }}
        >
          {t('home.greeting', { name: displayName })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xl,
    marginBottom: spacing['2xl'],
    zIndex: 30,
  },
  topRow: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actions: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarAnchor: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  greeting: {
    alignItems: 'stretch',
  },
});
