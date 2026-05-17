# node-red-contrib-youtube-watcher

A Node-RED node to monitor YouTube channel uploads via the YouTube Data API v3.

## Installation

### Via Node-RED Palette Manager

Search for `node-red-contrib-youtube-watcher` in the Palette Manager and install.

### Manual Installation

```bash
cd ~/.node-red
npm install node-red-contrib-youtube-watcher
```

Restart Node-RED after installation.

## Setup

### Getting a YouTube Data API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Library**
4. Search for and enable **YouTube Data API v3**
5. Go to **APIs & Services > Credentials**
6. Click **Create Credentials > API Key**
7. Copy the generated API key

### Node Configuration

| Property | Description |
|----------|-------------|
| **Name** | Display name for the node |
| **Channel ID** | YouTube channel ID (starts with `UC`, e.g., `UCxxxxxxxxxxxxxxxxxxxxxx`) |
| **API Key** | Your YouTube Data API v3 key (stored securely as a credential) |
| **Refresh** | Polling interval in minutes (default: 15) |
| **Max Results** | Maximum videos to fetch per poll, 1-50 (default: 8) |
| **Ignore existing videos on first run** | When checked, videos already present on first poll are marked as seen and not emitted. Prevents flooding on node restart. |

## Usage

The node has no input. It polls the YouTube Data API on the configured interval and outputs one message per new video upload.

### Output Message Format

Each message contains:

```json
{
  "upload": {
    "id": "dQw4w9WgXcQ",
    "title": "Video Title",
    "description": "Video description...",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "published": "2026-05-17T02:22:00.000Z",
    "updated": "2026-05-17T02:22:00.000Z",
    "image": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "media": [
      { "type": "thumbnail", "url": "...", "width": 1280, "height": 720 }
    ],
    "authors": [
      { "name": "Channel Name", "url": "https://www.youtube.com/channel/UCxxx" }
    ],
    "categories": [],
    "duration": "PT3M33S",
    "definition": "hd",
    "tags": ["tag1", "tag2"]
  },
  "topic": "Video Title",
  "payload": "Video description...",
  "link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "channel": "https://www.youtube.com/channel/UCxxx",
  "_msgid": "..."
}
```

### Finding a Channel ID

1. Go to the YouTube channel page
2. View the page source (Ctrl+U) or use a tool like [YouTube Channel ID Finder](https://commentpicker.com/youtube-channel-id.php)
3. Look for the channel ID starting with `UC` (e.g., `UCxxxxxxxxxxxxxxxxxxxxxx`)

Alternatively, you can derive the uploads playlist ID by changing the second character of the channel ID from `C` to `U` (e.g., `UC...` becomes `UU...`).

## API Quota

This node uses the efficient uploads playlist method, consuming only **1 API quota unit per poll**. The default daily quota is 10,000 units.

| Interval | Polls/day | Quota used/day |
|----------|-----------|----------------|
| 5 min    | 288       | 288            |
| 15 min   | 96        | 96             |
| 30 min   | 48        | 48             |
| 60 min   | 24        | 24             |

## Deduplication

The node stores seen video IDs in Node-RED context, persisting across restarts. Videos already in the context are not re-emitted.

## License

MIT
