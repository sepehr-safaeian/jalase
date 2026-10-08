import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

interface PageIndicatorProps {
  count: number;
  activeIndex: number;
  onSelect?: (index: number) => void;
}

export function PageIndicator({
  count,
  activeIndex,
  onSelect,
}: PageIndicatorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;
        const dotStyle = [
          styles.dot,
          {
            backgroundColor: isActive ? colors.primary : colors.borderStrong,
            width: isActive ? 20 : 8,
          },
        ];

        if (!onSelect) {
          return <View key={index} style={dotStyle} />;
        }

        return (
          <Pressable
            key={index}
            onPress={() => onSelect(index)}
            hitSlop={8}
            style={({ pressed }) => [dotStyle, { opacity: pressed ? 0.7 : 1 }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
