import { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import type { TranscriptTurn } from '@jalase/shared';
import {
  parseNoteContent,
  serializeNoteContent,
  stripTranscriptSection,
} from '@/lib/notes/note-content';
import { injectWebFonts } from '@/theme/inject-web-fonts';
import { resolveFontFamily } from '@/theme/font-family';
import { useSettings } from '@/theme/ThemeProvider';
import { LiveTranscriptBlock } from './LiveTranscriptBlock';
import './tiptap-editor.css';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
  liveTranscript?: string;
  liveTurns?: TranscriptTurn[];
  isLiveRecording?: boolean;
  isTranscriptPending?: boolean;
  isRecording?: boolean;
}

export function TiptapEditor({
  value,
  onChange,
  autoFocus = false,
  placeholder,
  liveTranscript = '',
  liveTurns = [],
  isLiveRecording = false,
  isTranscriptPending = false,
  isRecording = false,
}: TiptapEditorProps) {
  const { t } = useTranslation();
  const { isRtl } = useSettings();
  const skipNextUpdate = useRef(false);
  const resolvedPlaceholder = placeholder ?? t('notes.editorPlaceholder');
  const headingPlaceholder = t('notes.headingPlaceholder');

  const editorValue = useMemo(() => {
    if (!isLiveRecording) {
      return value;
    }
    const doc = stripTranscriptSection(parseNoteContent(value));
    return serializeNoteContent(doc);
  }, [isLiveRecording, value]);

  useEffect(() => {
    injectWebFonts();
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: true,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return headingPlaceholder;
          }
          return resolvedPlaceholder;
        },
        showOnlyWhenEditable: true,
        includeChildren: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'jalase-task-item',
        },
      }),
      Typography,
    ],
    content: parseNoteContent(editorValue),
    editorProps: {
      attributes: {
        class: 'jalase-tiptap',
        dir: isRtl ? 'rtl' : 'ltr',
        spellcheck: 'true',
        style: `font-family: ${resolveFontFamily('400')};`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (skipNextUpdate.current) {
        skipNextUpdate.current = false;
        return;
      }
      onChange(serializeNoteContent(ed.getJSON()));
    },
    autofocus: autoFocus ? 'end' : false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;

    const incoming = editorValue.trim();
    const current = serializeNoteContent(editor.getJSON());
    if (incoming === current) return;

    skipNextUpdate.current = true;
    editor.commands.setContent(parseNoteContent(editorValue), {
      emitUpdate: false,
    });
  }, [editor, editorValue]);

  useEffect(() => {
    if (!isLiveRecording) return;
    const el = document.querySelector('.jalase-tiptap-scroll');
    if (el) {
      el.scrollTop = 0;
    }
  }, [isLiveRecording, liveTranscript]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return <View style={styles.shell} />;
  }

  return (
    <ScrollView
      style={styles.shell}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      // @ts-expect-error web className
      className="jalase-tiptap-scroll"
    >
      <LiveTranscriptBlock
        targetText={liveTranscript}
        turns={liveTurns}
        isRecording={isRecording}
        isWaiting={isTranscriptPending}
      />
      <EditorContent editor={editor} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 48,
  },
});
