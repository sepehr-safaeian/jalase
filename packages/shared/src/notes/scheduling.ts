import type { NoteSummary } from './types.js';

/** Notes whose meeting is strictly in the future (accessible immediately after creation). */
export function isUpcomingMeeting(
  meetingDate: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!meetingDate) return false;
  return new Date(meetingDate).getTime() > now.getTime();
}

export interface SplitNotesResult {
  upcoming: NoteSummary[];
  recent: NoteSummary[];
}

/** Split notes into upcoming (by meetingDate ASC) and recent (by updatedAt DESC). */
export function splitNotesBySchedule(
  notes: NoteSummary[],
  now: Date = new Date(),
): SplitNotesResult {
  const upcoming: NoteSummary[] = [];
  const recent: NoteSummary[] = [];

  for (const note of notes) {
    if (isUpcomingMeeting(note.meetingDate, now)) {
      upcoming.push(note);
    } else {
      recent.push(note);
    }
  }

  upcoming.sort(
    (a, b) =>
      new Date(a.meetingDate!).getTime() - new Date(b.meetingDate!).getTime(),
  );

  recent.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return { upcoming, recent };
}
