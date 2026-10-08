# Notes Search

## Summary

Keyword search across all of the user's notes using a two-phase strategy to control latency and server load.

## Product behavior

1. User types a query (minimum 2 characters)
2. **Phase 1:** Search meetings from the **last 30 days** (`scope=recent`)
3. **Show more:** Next page in the same range, or expand to **older meetings** (`scope=older`)
4. Each result includes a snippet and a match field (title / body / transcript)

## Searchable fields

- `title`
- `content_json`
- `content_markdown`
- `transcript_text`

## API

### `GET /api/v1/notes/search`

| Query | Type | Description |
|-------|------|-------------|
| `q` | string | Keyword (minimum 2 characters) |
| `scope` | `recent` \| `older` | Default: `recent` |
| `cursor` | string | Pagination |
| `limit` | number | Default 15, max 50 |

### Response

```json
{
  "items": [{ "id", "title", "snippet", "matchField", "meetingDate", "updatedAt", "memberCount" }],
  "hasMore": true,
  "nextCursor": "...",
  "scope": "recent",
  "query": "jira",
  "expandableToOlder": true
}
```

- `expandableToOlder=true`: End of recent pagination; the "Older meetings" button is enabled

## Mobile

- Route: `/search`
- Magnifying glass button in `HomeHeader`
- Debounce 350ms
- FlatList + "Show more" button

## Feature flag

- `notes.search` (tier: free)

## Future

- PostgreSQL full-text search (`tsvector`) for scale
- Keyword highlight in snippets
- Project / date filters
- Redis cache for frequent queries
- Rate limit per user (e.g. 30 req/min)

## Tests

- `packages/shared/src/notes/search-utils.spec.ts`
- `apps/api/src/notes/notes.service.spec.ts` (search)
