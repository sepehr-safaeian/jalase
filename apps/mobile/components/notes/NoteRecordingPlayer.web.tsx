import { useMemo } from 'react';
import { MeetingAudioPlayer } from '@/components/notes/MeetingAudioPlayer';
import { resolveApiAssetUrl } from '@/lib/user/profile.utils';

interface NoteRecordingPlayerProps {
  recordingAudioUrl: string;
}

export function NoteRecordingPlayer({ recordingAudioUrl }: NoteRecordingPlayerProps) {
  const src = useMemo(
    () => resolveApiAssetUrl(recordingAudioUrl),
    [recordingAudioUrl],
  );

  if (!src) {
    return null;
  }

  return <MeetingAudioPlayer src={src} />;
}
