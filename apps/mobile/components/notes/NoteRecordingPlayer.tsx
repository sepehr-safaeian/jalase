import { MeetingAudioPlayer } from '@/components/notes/MeetingAudioPlayer';
import { resolveApiAssetUrl } from '@/lib/user/profile.utils';

interface NoteRecordingPlayerProps {
  recordingAudioUrl: string;
}

export function NoteRecordingPlayer({ recordingAudioUrl }: NoteRecordingPlayerProps) {
  const src = resolveApiAssetUrl(recordingAudioUrl);

  if (!src) {
    return null;
  }

  return <MeetingAudioPlayer src={src} />;
}
