# Scheduled Meetings

## Summary

From the dashboard, users can create a **new meeting** in two ways:

- **Start now**: The note opens immediately (`meetingDate = now`)
- **Schedule for later**: Pick a Jalali calendar date plus hour/minute, then create a note with a future `meetingDate`

Scheduled notes are **accessible from the moment they are created** and appear in the **Upcoming meetings** section.

## Data model

We use the existing `notes.meeting_date` field. There is no separate Meeting entity (note = meeting).

| Mode | `meeting_date` | UI section |
|------|----------------|------------|
| Start now | Creation time | Recent meetings |
| Future | Selected time (> now) | Upcoming meetings |

## API

### `POST /api/v1/notes`

```json
{
  "title": "New meeting",
  "contentJson": "",
  "meetingDate": "2026-09-01T14:30:00.000Z"
}
```

- Without `meetingDate`: defaults to `now`
- With `meetingDate`: must be **in the future**, otherwise `400`

### `PATCH /api/v1/notes/:id`

- Updating `meetingDate` uses the same future-date validation

### `GET /api/v1/notes`

- Unchanged; the client splits results with `splitNotesBySchedule` from `@jalase/shared`

## Client (mobile)

- FAB: "New meeting"
- `NewMeetingActionSheet`: choose how to create
- `ScheduleMeetingSheet`: Jalali wheel picker (year/month/day + hour/minute)
- `HomeScreen`: "Upcoming meetings" section only when items exist

## Future (preparation)

- Push reminder before `meetingDate` (no GMS)
- Cron to move items from upcoming to recent after the scheduled time passes
- API filter `?scope=upcoming` for scale
- DB index on `(user_id, meeting_date)` in production migration
- Recurring meetings (separate entity)

## Feature flag

Currently **personal** tier, no separate flag. A flag will be added later for enterprise calendar sync.

## Tests

- `packages/shared/src/notes/scheduling.spec.ts`
- `apps/api/src/notes/notes.service.spec.ts` (validation + create scheduled)
