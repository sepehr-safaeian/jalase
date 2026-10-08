import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { spacing } from '@/theme/tokens';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  const { direction, textAlign } = useLayoutDirection();

  return (
    <View style={[styles.section, { direction }]}>
      <View style={styles.header}>
        <Text
          variant="uiSm"
          weight="600"
          color="muted"
          style={[styles.title, { textAlign }]}
        >
          {title}
        </Text>
        {description ? (
          <Text
            variant="uiSm"
            color="quiet"
            style={[styles.description, { textAlign }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      <Card style={styles.card}>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  header: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  title: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  description: {
    lineHeight: 20,
  },
  card: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
});
