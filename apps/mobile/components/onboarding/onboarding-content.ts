import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { TFunction } from 'i18next';
import type { IllustrationKey } from '@/assets/illustrations/registry';

export type OnboardingSlideType =
  | 'hero'
  | 'features'
  | 'intro'
  | 'phase'
  | 'cta';

export interface OnboardingFeature {
  icon: ComponentProps<typeof Ionicons>['name'];
  text: string;
}

export interface OnboardingPhase {
  label: string;
  title: string;
  body: string;
  illustration: IllustrationKey;
}

export interface OnboardingSlide {
  id: string;
  type: OnboardingSlideType;
  headline?: string;
  title?: string;
  subtitle?: string;
  features?: OnboardingFeature[];
  phase?: OnboardingPhase;
  illustration?: IllustrationKey;
  ctaLabel?: string;
}

/** Build localized onboarding slides from the active translation function */
export function getOnboardingSlides(t: TFunction): OnboardingSlide[] {
  return [
    {
      id: 'hero',
      type: 'hero',
      headline: t('onboarding.heroHeadline'),
    },
    {
      id: 'features',
      type: 'features',
      title: t('onboarding.featuresTitle'),
      illustration: 'features',
      features: [
        {
          icon: 'mic-outline',
          text: t('onboarding.featureMic'),
        },
        {
          icon: 'shield-checkmark-outline',
          text: t('onboarding.featurePrivacy'),
        },
        {
          icon: 'videocam-outline',
          text: t('onboarding.featureConnect'),
        },
      ],
    },
    {
      id: 'how-help',
      type: 'intro',
      title: t('onboarding.howHelpTitle'),
      illustration: 'how-help',
    },
    {
      id: 'before',
      type: 'phase',
      phase: {
        label: t('onboarding.beforeLabel'),
        title: t('onboarding.beforeTitle'),
        body: t('onboarding.beforeBody'),
        illustration: 'before',
      },
    },
    {
      id: 'during',
      type: 'phase',
      phase: {
        label: t('onboarding.duringLabel'),
        title: t('onboarding.duringTitle'),
        body: t('onboarding.duringBody'),
        illustration: 'during',
      },
    },
    {
      id: 'after',
      type: 'phase',
      phase: {
        label: t('onboarding.afterLabel'),
        title: t('onboarding.afterTitle'),
        body: t('onboarding.afterBody'),
        illustration: 'after',
      },
    },
    {
      id: 'start',
      type: 'cta',
      title: t('onboarding.ctaTitle'),
      subtitle: t('onboarding.ctaSubtitle'),
      illustration: 'start',
      ctaLabel: t('onboarding.getStarted'),
    },
  ];
}
