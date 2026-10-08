import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  hint?: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const { direction, textAlign } = useLayoutDirection();

  return (
    <View style={[styles.wrapper, { direction }]}>
      <View style={styles.labelRow}>
        <Text variant="body" weight="500" style={{ textAlign }}>
          {label}
        </Text>
        {hint ? (
          <Text variant="uiSm" color="muted" style={{ textAlign }}>
            {hint}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.track,
          { flexDirection: 'row', direction },
          { backgroundColor: colors.surfaceSoft, borderColor: colors.border },
        ]}
      >
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.segment,
                selected && {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderStrong,
                },
                { opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                variant="ui"
                weight={selected ? '600' : '500'}
                style={{
                  color: selected ? colors.text : colors.textMuted,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  labelRow: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  track: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 40,
  },
});
