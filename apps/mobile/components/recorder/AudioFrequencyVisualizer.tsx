import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const BAR_COUNT = 24;

interface AudioFrequencyVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
  size?: number;
}

/** Native: simple visualizer until Web Audio support is added on Android/iOS. */
export function AudioFrequencyVisualizer({
  isActive,
  size = 300,
}: AudioFrequencyVisualizerProps) {
  const { colors } = useTheme();
  const anims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15)),
  ).current;

  useEffect(() => {
    if (!isActive) return;

    const loops = anims.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.35 + (index % 5) * 0.08,
            duration: 420 + (index % 7) * 40,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.12,
            duration: 380 + (index % 5) * 30,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [anims, isActive]);

  const barWidth = Math.max(3, Math.floor((size * 0.55) / BAR_COUNT) - 2);
  const maxHeight = size * 0.22;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={styles.row}>
        {anims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                width: barWidth,
                backgroundColor: colors.primaryMid,
                borderRadius: radius.sm,
                transform: [
                  {
                    scaleY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.35, 1],
                    }),
                  },
                ],
                height: maxHeight,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: 3,
    height: '45%',
  },
  bar: {
    transformOrigin: 'bottom',
  },
});
