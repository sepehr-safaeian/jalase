import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FeatureRow } from '@/components/onboarding/FeatureRow';
import { UndrawIllustration } from '@/components/onboarding/UndrawIllustration';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { OnboardingSlide } from '@/components/onboarding/onboarding-content';
import type { IllustrationKey } from '@/assets/illustrations/registry';
import { spacing } from '@/theme/tokens';

interface OnboardingSlideViewProps {
  slide: OnboardingSlide;
  width: number;
  isActive: boolean;
}

function Illustration({ name }: { name: IllustrationKey }) {
  return (
    <View style={styles.illustrationWrap}>
      <UndrawIllustration name={name} />
    </View>
  );
}

export function OnboardingSlideView({
  slide,
  width,
  isActive,
}: OnboardingSlideViewProps) {
  const { colors } = useTheme();
  const contentWidth = width - spacing.xl * 2;

  return (
    <ScrollView
      style={[styles.slide, { width }]}
      contentContainerStyle={styles.slideContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {slide.type === 'hero' ? (
        <View style={[styles.heroBody, { width: contentWidth }]}>
          <Text variant="uiSm" color="quiet" style={styles.brand}>
            جلسه
          </Text>
          <Text variant="headingLg" weight="700" style={styles.heroHeadline}>
            {slide.headline}
          </Text>
        </View>
      ) : (
        <View style={{ width: contentWidth }}>
          {slide.illustration ? (
            <Illustration name={slide.illustration} />
          ) : slide.phase ? (
            <Illustration name={slide.phase.illustration} />
          ) : null}

          <View style={styles.copy}>
            {slide.type === 'phase' && slide.phase ? (
              <>
                <View style={[styles.phaseBadge, { backgroundColor: colors.primaryTint }]}>
                  <Text variant="uiSm" weight="600" style={{ color: colors.primary }}>
                    {slide.phase.label}
                  </Text>
                </View>
                <Text variant="headingSm" weight="700" style={styles.title}>
                  {slide.phase.title}
                </Text>
                <Text variant="body" color="secondary" style={styles.body}>
                  {slide.phase.body}
                </Text>
              </>
            ) : (
              <>
                {slide.title ? (
                  <Text variant="headingSm" weight="700" style={styles.title}>
                    {slide.title}
                  </Text>
                ) : null}
                {slide.subtitle ? (
                  <Text variant="body" color="secondary" style={styles.body}>
                    {slide.subtitle}
                  </Text>
                ) : null}
                {slide.features ? (
                  <View style={styles.features}>
                    {slide.features.map((feature, index) => (
                      <Animated.View
                        key={feature.text}
                        entering={
                          isActive
                            ? FadeInDown.delay(index * 60).duration(220)
                            : undefined
                        }
                      >
                        <FeatureRow icon={feature.icon} text={feature.text} />
                      </Animated.View>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  slideContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    alignItems: 'stretch',
  },
  heroBody: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.base,
    minHeight: 420,
    alignSelf: 'center',
  },
  brand: {
    textAlign: 'right',
    letterSpacing: 1,
    width: '100%',
  },
  heroHeadline: {
    textAlign: 'right',
    lineHeight: 56,
    width: '100%',
  },
  illustrationWrap: {
    width: '100%',
    height: 220,
    marginBottom: spacing.xl,
  },
  copy: {
    gap: spacing.base,
    width: '100%',
  },
  phaseBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
  },
  title: {
    textAlign: 'right',
    lineHeight: 28,
    width: '100%',
  },
  body: {
    textAlign: 'right',
    lineHeight: 24,
    width: '100%',
  },
  features: {
    marginTop: spacing.sm,
    gap: spacing.base,
    width: '100%',
  },
});
