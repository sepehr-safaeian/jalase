import { describe, expect, it } from 'vitest';
import type { NoteSummary } from './types.js';
import { isUpcomingMeeting, splitNotesBySchedule } from './scheduling.js';

function makeNote(
  id: string,
  meetingDate: string | null,
  updatedAt: string,
): NoteSummary {
  return {
    id,
    title: `note-${id}`,
    projectId: null,
    projectName: null,
    meetingDate,
    memberCount: 0,
    archivedAt: null,
    deletedAt: null,
    createdAt: updatedAt,
    updatedAt,
  };
}

describe('scheduling', () => {
  it('isUpcomingMeeting returns true only for future meetingDate', () => {
    const now = new Date('2026-08-31T10:00:00.000Z');
    expect(isUpcomingMeeting('2026-09-01T10:00:00.000Z', now)).toBe(true);
    expect(isUpcomingMeeting('2026-08-31T09:00:00.000Z', now)).toBe(false);
    expect(isUpcomingMeeting(null, now)).toBe(false);
  });

  it('splitNotesBySchedule separates and sorts upcoming/recent', () => {
    const now = new Date('2026-08-31T10:00:00.000Z');
    const notes = [
      makeNote('recent-old', '2026-08-30T10:00:00.000Z', '2026-08-29T10:00:00.000Z'),
      makeNote('upcoming-late', '2026-09-02T10:00:00.000Z', '2026-08-28T10:00:00.000Z'),
      makeNote('recent-new', '2026-08-31T09:00:00.000Z', '2026-08-31T09:30:00.000Z'),
      makeNote('upcoming-soon', '2026-09-01T10:00:00.000Z', '2026-08-27T10:00:00.000Z'),
    ];

    const { upcoming, recent } = splitNotesBySchedule(notes, now);

    expect(upcoming.map((note) => note.id)).toEqual([
      'upcoming-soon',
      'upcoming-late',
    ]);
    expect(recent.map((note) => note.id)).toEqual(['recent-new', 'recent-old']);
  });
});
