# AGENTS.md - Project Notes for AI Assistants

## Project Overview

**node-red-contrib-youtube-watcher** - A Node-RED node set to monitor YouTube channel uploads via the YouTube Data API v3.

## Tools & Commands

- **Node.js**: Available on PATH (Node 18+)
- **npm**: Package management
- **Test command**: `npm test` (runs mocha on `test/**/*_spec.js`)
- **Git**: Version control

## Architecture

### API Strategy (1 quota unit per poll)

1. First run: `channels.list` (part=`contentDetails`, id=channelId) to get the uploads playlist ID
2. Each poll: `playlistItems.list` (part=`snippet,contentDetails`, playlistId=uploadsPlaylistId, maxResults=8)
3. Deduplication via node context (persistent Set of seen video IDs)

### Output Message Format

```json
{
  "upload": { "id", "title", "description", "url", "published", "updated", "image", "media", "authors", "categories", "duration", "definition", "tags" },
  "topic": "upload.title",
  "payload": "upload.description",
  "link": "upload.url",
  "channel": "https://www.youtube.com/channel/UC...",
  "_msgid": "RED.util.generateMessageId()"
}
```

### Key Decisions

- **No `content` field**: YouTube videos don't have text content like RSS articles
- **`authors`**: Only channel info (YouTube Data API doesn't expose collaborators)
- **API key**: Stored as Node-RED credential (encrypted)
- **`ignoreFirst`**: Prevents flooding on restart by marking existing videos as seen
- **No Shorts/Live filtering**: YouTube API doesn't have a direct "isShort" flag; duration parsing available but not used for filtering
- **Native `fetch`**: Used instead of external HTTP libraries (Node 18+)

## Vibe Check Usage

- Use `vibe_check` as a collaborative debugging step when stuck or before committing changes
- Always include the complete user prompt with each `vibe_check` call
- Specify current phase (planning/implementation/review)
- Use `vibe_learn` to record mistakes and preferences

## Session Memory

- User prefers "cabalistic" number 8 for defaults
- MIT license preferred (unlike feedparser's restrictive license)
- Inspired by `node-red/node-red-nodes` social/feedparser but original implementation
- Node naming follows `node-red-contrib-*` convention, node type matches repo suffix
