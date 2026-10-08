# Notes

## Product summary

Note = meeting. Each note is a Tiptap space (Notion-like) with editable metadata:

| Metadata | Behavior |
|----------|----------|
| **Date** | Shows created date, last edited, meeting date |
| **Members** | List + quick add (name + email) |
| **Project** | Pick from the user's projects or create a new project |

## Data model

- **Project:** name, color, archive, owner
- **Note:** title, `contentJson` (Tiptap document), project, meeting date, members, `archivedAt`, `deletedAt`
- **NoteMember:** name, email (unique per note)

### Archive and delete

| Action | Behavior |
|--------|----------|
| **Archive** | Sets `archivedAt`, hidden from main list, restorable |
| **Delete** | Sets `deletedAt` (soft delete), hidden from all lists |

## API

| Method | Path |
|--------|------|
| GET/POST | `/api/v1/notes` |
| GET/PATCH/DELETE | `/api/v1/notes/:id` |
| POST | `/api/v1/notes/:id/archive` |
| POST | `/api/v1/notes/:id/unarchive` |
| POST/DELETE | `/api/v1/notes/:id/members` |
| GET/POST | `/api/v1/projects` |
| PATCH/DELETE | `/api/v1/projects/:id` |
| POST | `/api/v1/projects/:id/archive` |

Query on `GET /notes`: `includeArchived=true` to include archived notes (next phase: archive UI)

## Mobile

- `/notes/new` - create and redirect to editor
- `/notes/[id]` - Tiptap v3 editor (Notion-like), canvas background
- Home - note list from API
- **Swipe** on meeting card (left): delete with light red background and strong red text; full swipe = automatic delete

## Feature flag

- `personal`: personal note and project CRUD
- `team`: member sharing (next phase)
- `enterprise`: (next phase)

## Tests

- `notes.service.spec.ts` (unit)
- Editor: autosave debounce 700ms
