import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { getOnboardingSlides } from '@/components/onboarding/onboarding-content';
import { OnboardingSlideView } from '@/components/onboarding/OnboardingSlideView';
import { PageIndicator } from '@/components/onboarding/PageIndicator';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const onboardingSlides = useMemo(() => getOnboardingSlides(t), [t]);

  const slide = onboardingSlides[activeIndex];
  const isLastSlide = activeIndex === onboardingSlides.length - 1;

  function goNext() {
    if (isLastSlide) {
      // English-first: email OTP is the default sign-in path
      router.push('/login/email');
      return;
    }
    setActiveIndex((current) => current + 1);
  }

  function goToIndex(index: number) {
    setActiveIndex(index);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
      <View style={styles.body}>
        <Animated.View
          key={slide.id}
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={[styles.slideHost, { width }]}
        >
          <OnboardingSlideView
            slide={slide}
            width={width}
            isActive
          />
        </Animated.View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <PageIndicator
          count={onboardingSlides.length}
          activeIndex={activeIndex}
          onSelect={goToIndex}
        />

        <Button
          label={isLastSlide ? (slide.ctaLabel ?? t('onboarding.getStarted')) : t('onboarding.next')}
          variant={isLastSlide ? 'primary' : 'secondary'}
          onPress={goNext}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  body: {
    flex: 1,
    overflow: 'hidden',
  },
  slideHost: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.base,
  },
  cta: {
    width: '100%',
  },
});
