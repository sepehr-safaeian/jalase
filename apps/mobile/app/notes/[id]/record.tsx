import { useLocalSearchParams } from 'expo-router';
import { MeetingRecorderScreen } from '@/components/recorder/MeetingRecorderScreen';

export default function NoteRecordPage() {
  const { id, new: isNewParam } = useLocalSearchParams<{ id: string; new?: string }>();

  if (!id || typeof id !== 'string') {
    return null;
  }

  return <MeetingRecorderScreen noteId={id} isNew={isNewParam === '1'} />;
}
