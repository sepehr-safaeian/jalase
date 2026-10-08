import { useLocalSearchParams } from 'expo-router';
import { NoteEditorScreen } from '@/components/notes/NoteEditorScreen';

export default function NoteDetailPage() {
  const { id, new: isNewParam } = useLocalSearchParams<{ id: string; new?: string }>();

  if (!id || typeof id !== 'string') {
    return null;
  }

  return <NoteEditorScreen noteId={id} isNew={isNewParam === '1'} />;
}
