import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings, useTheme } from '@/theme/ThemeProvider';
import { resolveFontFamily } from '@/theme/font-family';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

/**
 * Native fallback: Tiptap is only available on web.
 * Plain text is stored so it can be converted to JSON on web later.
 */
export function TiptapEditor({
  value,
  onChange,
  autoFocus = false,
  placeholder,
}: TiptapEditorProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRtl } = useSettings();

  return (
    <View style={styles.shell}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? t('notes.editorPlaceholder')}
        placeholderTextColor={colors.textQuiet}
        multiline
        autoFocus={autoFocus}
        textAlignVertical="top"
        style={[
          styles.input,
          {
            color: colors.textBody,
            fontFamily: resolveFontFamily('400'),
            textAlign: isRtl ? 'right' : 'left',
            writingDirection: isRtl ? 'rtl' : 'ltr',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    minHeight: 360,
    fontSize: 17,
    lineHeight: 30,
    padding: 0,
    backgroundColor: 'transparent',
  },
});
