import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface FeatureRowProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  text: string;
}

export function FeatureRow({ icon, text }: FeatureRowProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryTint }]}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text variant="body" color="secondary" style={styles.text}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing.base,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    textAlign: 'right',
    lineHeight: 24,
  },
});
