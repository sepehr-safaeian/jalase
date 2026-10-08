import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import type { AppLocale, FontSizePreference, ThemePreference } from '@jalase/shared';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { SegmentedControl } from '@/components/settings/SegmentedControl';
import { SettingsCheckboxRow } from '@/components/settings/SettingsCheckboxRow';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { useAuth } from '@/context/AuthContext';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useSettings } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { user, updateSettings } = useAuth();
  const { isLoading, isAuthenticated } = useRequireAuth({ requireProfile: true });
  const {
    themePreference,
    fontSize,
    locale,
    setThemePreference,
    setFontSize,
    setLocale,
    colors,
  } = useSettings();
  const { direction, textAlign: align } = useLayoutDirection();
  const [consentSaving, setConsentSaving] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  const fontSizeOptions: { value: FontSizePreference; label: string }[] = [
    { value: 'large', label: t('settings.fontLarge') },
    { value: 'medium', label: t('settings.fontMedium') },
    { value: 'small', label: t('settings.fontSmall') },
  ];

  const languageOptions: { value: AppLocale; label: string }[] = [
    { value: 'en', label: t('settings.languageEn') },
    { value: 'fa', label: t('settings.languageFa') },
  ];

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  async function handleConsentToggle(checked: boolean) {
    setConsentSaving(true);
    setConsentError(null);

    try {
      await updateSettings({ aiDataSharingConsent: checked });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('settings.saveFailed');
      setConsentError(message);
    } finally {
      setConsentSaving(false);
    }
  }

  async function handleLocaleChange(next: AppLocale) {
    const needsRestart = await setLocale(next);
    if (needsRestart && Platform.OS !== 'web') {
      Alert.alert(t('common.appName'), t('common.restartRequired'));
    }
  }

  return (
    <Screen scroll>
      <AppHeader title={t('settings.title')} />

      <View style={[styles.intro, { direction }]}>
        <Text variant="headingSm" weight="700" style={{ textAlign: align }}>
          {t('settings.introTitle')}
        </Text>
        <Text
          variant="body"
          color="secondary"
          style={{ textAlign: align, lineHeight: 24 }}
        >
          {t('settings.introBody')}
        </Text>
      </View>

      <View style={[styles.sections, { direction }]}>
        <SettingsSection
          title={t('settings.appearance')}
          description={t('settings.appearanceHint')}
        >
          <SegmentedControl
            label={t('settings.theme')}
            value={themePreference}
            options={themeOptions}
            onChange={(value) => void setThemePreference(value)}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SegmentedControl
            label={t('settings.fontSize')}
            hint={t('settings.fontSizeHint')}
            value={fontSize}
            options={fontSizeOptions}
            onChange={(value) => void setFontSize(value)}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SegmentedControl
            label={t('settings.language')}
            hint={t('settings.languageHint')}
            value={locale}
            options={languageOptions}
            onChange={(value) => void handleLocaleChange(value)}
          />
        </SettingsSection>

        <SettingsSection
          title={t('settings.privacy')}
          description={t('settings.privacyHint')}
        >
          <SettingsCheckboxRow
            label={t('settings.aiConsent')}
            description={t('settings.aiConsentDescription')}
            checked={user.aiDataSharingConsent}
            disabled={consentSaving}
            onToggle={(checked) => void handleConsentToggle(checked)}
          />

          {consentError ? (
            <Text
              variant="uiSm"
              color="error"
              style={{ textAlign: align, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm }}
            >
              {consentError}
            </Text>
          ) : null}
        </SettingsSection>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  sections: {
    gap: spacing['2xl'],
    paddingBottom: spacing.section,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.sm,
  },
});
