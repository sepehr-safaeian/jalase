# Project Management

## Summary

From the profile menu (avatar at the top of home), the user opens **Projects**, creates projects, swipes to delete or edit, and taps a project to see that project's meeting list.

## User flow

```
Home → Avatar → Projects → Project list
                              ├ swipe left: delete
                              ├ swipe right: edit
                              └ tap: details + project meetings
```

## Data model

Existing `projects` table:

| Field | Description |
|-------|-------------|
| `name` | Project name (2-120 characters) |
| `color` | Optional hex |
| `archived_at` | Soft archive |

Notes link to projects via `notes.project_id` (`ON DELETE SET NULL`).

## API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/projects` | List projects |
| POST | `/api/v1/projects` | Create |
| GET | `/api/v1/projects/:id` | Details + `noteCount` |
| PATCH | `/api/v1/projects/:id` | Edit name/color |
| DELETE | `/api/v1/projects/:id` | Delete |
| GET | `/api/v1/projects/:id/meetings` | Project meetings (cursor pagination) |

## Client

- `ProfileMenu`: "Projects" option
- `ProjectsScreen`: list + FAB + swipe
- `ProjectDetailScreen`: project meetings
- `ProjectEditSheet`: create/edit with brand color palette
- `NoteProjectSheet`: assign project to meeting (editor)

## Feature flag

`notes.projects` in `packages/shared` (tier: personal)

## Tests

- `notes.service.spec.ts`: `listProjectMeetings`
