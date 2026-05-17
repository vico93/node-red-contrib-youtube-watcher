module.exports = function (RED) {
    "use strict";

    function parseDuration(duration) {
        if (!duration) return 0;
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    }

    function YouTubeWatchNode(n) {
        RED.nodes.createNode(this, n);
        const node = this;

        node.channelId = n.channelId;
        if (n.interval > 35790) {
            node.warn("Invalid interval value");
        }
        node.interval = (parseInt(n.interval) || 15) * 60000;
        node.maxResults = Math.min(Math.max(parseInt(n.maxResults) || 8, 1), 50);
        node.ignoreFirst = n.ignoreFirst || false;
        node.doneFirst = false;
        node.uploadsPlaylistId = null;
        node.interval_id = null;

        const context = node.context();
        let seen = context.get("seen") || {};

        function saveSeen() {
            context.set("seen", seen);
        }

        async function getUploadsPlaylistId() {
            const apiKey = node.credentials?.apiKey;
            const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(node.channelId)}&key=${encodeURIComponent(apiKey)}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`channels.list failed: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            if (!data.items || data.items.length === 0) {
                throw new Error(`Channel not found: ${node.channelId}`);
            }
            const uploadsPlaylistId = data.items[0].contentDetails.relatedPlaylists.uploads;
            return uploadsPlaylistId;
        }

        async function getPlaylistItems(playlistId) {
            const apiKey = node.credentials?.apiKey;
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(playlistId)}&maxResults=${node.maxResults}&key=${encodeURIComponent(apiKey)}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`playlistItems.list failed: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data.items || [];
        }

        function buildMessage(item) {
            const snippet = item.snippet;
            const contentDetails = item.contentDetails || {};
            const videoId = snippet.resourceId.videoId;
            const channelUrl = `https://www.youtube.com/channel/${snippet.channelId}`;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

            const thumbnails = snippet.thumbnails || {};
            const thumb = thumbnails.maxres || thumbnails.high || thumbnails.medium || thumbnails.default || {};

            const media = [];
            for (const [key, t] of Object.entries(thumbnails)) {
                media.push({ type: "thumbnail", url: t.url, width: t.width, height: t.height });
            }

            const published = snippet.publishedAt ? new Date(snippet.publishedAt).toISOString() : null;

            const upload = {
                id: videoId,
                title: snippet.title,
                description: snippet.description,
                url: videoUrl,
                published: published,
                updated: published,
                image: thumb.url || null,
                media: media,
                authors: [{ name: snippet.channelTitle, url: channelUrl }],
                categories: [],
                duration: contentDetails.videoDuration || null,
                definition: contentDetails.videoDefinition || null,
                tags: snippet.tags || []
            };

            const msg = {
                upload: upload,
                topic: upload.title,
                payload: upload.description,
                link: upload.url,
                channel: channelUrl
            };

            return msg;
        }

        async function fetchAndSend() {
            if (!node.channelId || node.channelId === "") {
                node.status({ fill: "red", shape: "dot", text: "No channel ID" });
                node.error("No channel ID configured");
                return;
            }

            const apiKey = node.credentials?.apiKey;
            if (!apiKey) {
                node.status({ fill: "red", shape: "dot", text: "No API key" });
                node.error("No API key configured");
                return;
            }

            try {
                if (!node.uploadsPlaylistId) {
                    node.uploadsPlaylistId = await getUploadsPlaylistId();
                }

                const items = await getPlaylistItems(node.uploadsPlaylistId);
                let sentCount = 0;

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const videoId = item.snippet.resourceId.videoId;

                    if (!(videoId in seen)) {
                        seen[videoId] = Date.now();

                        if (node.ignoreFirst === true && node.doneFirst === false) {
                            continue;
                        }

                        const msg = buildMessage(item);
                        node.send(msg);
                        sentCount++;
                    }
                }

                saveSeen();
                node.status({ fill: "green", shape: "dot", text: sentCount > 0 ? `${sentCount} new video(s)` : "" });
            } catch (err) {
                node.status({ fill: "red", shape: "dot", text: err.message });
                node.error(err.message, err);
            }
        }

        node.interval_id = setInterval(function () {
            node.doneFirst = true;
            fetchAndSend();
        }, node.interval);

        setTimeout(fetchAndSend, 2000);

        node.on("close", function () {
            if (node.interval_id != null) {
                clearInterval(node.interval_id);
            }
        });
    }

    RED.nodes.registerType("youtube-watch", YouTubeWatchNode, {
        credentials: {
            apiKey: { type: "password" }
        }
    });
};
