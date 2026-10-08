import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, spacing } from '@/theme/tokens';

interface ScreenProps extends ViewProps {
  scroll?: boolean;
  keyboard?: boolean;
  centered?: boolean;
}

export function Screen({
  scroll = false,
  keyboard = false,
  centered = false,
  style,
  children,
  ...props
}: ScreenProps) {
  const { colors } = useTheme();
  const { direction } = useLayoutDirection();

  const content = (
    <View
      style={[
        styles.content,
        { direction },
        centered && styles.centered,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, centered && styles.centered]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

  const wrapped = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas, direction }]}>
      {wrapped}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.section,
    gap: spacing.elementGap,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    justifyContent: 'center',
  },
});
