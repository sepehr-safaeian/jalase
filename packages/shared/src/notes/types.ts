import type { RecordingStatus } from './recording.js';
import type { MeetingAiExtractions } from './meeting-extractions.js';
import type { SpeakerNameMappings, SpeakerProfile } from './speaker-mappings.js';
import type { TranscriptTurn } from './transcript-segments.js';

export interface NoteMember {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
}

export type { RecordingStatus } from './recording.js';

export interface NoteSummary {
  id: string;
  title: string;
  projectId: string | null;
  projectName: string | null;
  meetingDate: string | null;
  memberCount: number;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDetail extends NoteSummary {
  /** Tiptap document JSON (serialized string) */
  contentJson: string;
  /** @deprecated legacy markdown notes */
  contentMarkdown?: string;
  transcriptText: string;
  transcriptTurns?: TranscriptTurn[];
  recordingStatus: RecordingStatus;
  recordingStartedAt: string | null;
  /** URL فایل صوتی ضبط‌شده (پخش در انتهای یادداشت) */
  recordingAudioUrl?: string | null;
  members: NoteMember[];
  /** speakerId → نام واقعی */
  speakerMappings?: SpeakerNameMappings;
  /** گوینندگان شناسایی‌شده در رونوشت */
  speakers?: SpeakerProfile[];
  /** استخراج‌های AI انجام‌شده (kind → ISO timestamp) */
  aiExtractions?: MeetingAiExtractions;
}

export type { SpeakerNameMappings, SpeakerProfile } from './speaker-mappings.js';
export type {
  MeetingExtractionKind,
  MeetingAiExtractions,
} from './meeting-extractions.js';

export interface CreateNoteRequest {
  title?: string;
  contentJson?: string;
  contentMarkdown?: string;
  projectId?: string | null;
  meetingDate?: string | null;
}

export interface UpdateNoteRequest {
  title?: string;
  contentJson?: string;
  contentMarkdown?: string;
  projectId?: string | null;
  meetingDate?: string | null;
}

export interface AddNoteMemberRequest {
  displayName: string;
  email: string;
}

export interface UpdateSpeakerMappingsRequest {
  mappings: SpeakerNameMappings;
}
