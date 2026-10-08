import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppScreen } from '@/components/layout/AppScreen';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, isProfileComplete } = useAuth();
  const { isLoading, isAuthenticated } = useRequireAuth();
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  useEffect(() => {
    ringOpacity.value = withSequence(
      withTiming(0.35, { duration: 500, easing: Easing.out(Easing.cubic) }),
      withTiming(0.15, { duration: 900 }),
    );
    ringScale.value = withTiming(1.35, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });
  }, [ringOpacity, ringScale]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const timer = setTimeout(() => {
      if (isProfileComplete) {
        router.replace('/dashboard');
        return;
      }
      router.replace('/auth/complete-profile');
    }, 2600);

    return () => clearTimeout(timer);
  }, [isProfileComplete, isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const greetingName = user?.displayName?.trim();

  return (
    <AppScreen style={styles.screen}>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.ring,
            { backgroundColor: colors.primaryTint },
            ringStyle,
          ]}
        />
        <Animated.View entering={FadeIn.duration(700)} style={styles.content}>
          <Text variant="headingLg" weight="700" style={styles.title}>
            {greetingName
              ? t('auth.welcomeHello', { name: greetingName })
              : t('auth.welcomeBack')}
          </Text>
          <Animated.View entering={FadeInDown.delay(350).duration(650)}>
            <Text variant="body" color="secondary" style={styles.subtitle}>
              {greetingName ? t('auth.welcomeGlad') : t('auth.welcomeNew')}
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  content: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 26,
  },
});
