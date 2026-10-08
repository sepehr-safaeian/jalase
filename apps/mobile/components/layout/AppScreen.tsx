import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLayoutDirection } from '@/hooks/useLayoutDirection';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, spacing } from '@/theme/tokens';

interface AppScreenProps extends ViewProps {
  keyboard?: boolean;
  footer?: ReactNode;
}

export function AppScreen({
  keyboard = false,
  footer,
  style,
  children,
  ...props
}: AppScreenProps) {
  const { colors } = useTheme();
  const { direction } = useLayoutDirection();

  const body = (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={[styles.content, style]} {...props}>
        {children}
      </View>
    </ScrollView>
  );

  const wrapped = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surface, direction }]}>
      <View style={styles.flex}>
        {wrapped}
        {footer ? (
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {footer}
          </View>
        ) : null}
      </View>
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
  scroll: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.base,
  },
});
