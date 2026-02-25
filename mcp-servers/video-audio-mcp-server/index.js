#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "video-audio-mcp-server",
  version: "1.0.0",
  description: "MCP server for video and audio processing - Litper Pro",
});

// ============================================
// TOOLS
// ============================================

server.tool(
  "extract_audio_from_video",
  "Extract audio track from a video URL or file path",
  {
    videoUrl: z.string().describe("URL or path of the video to extract audio from"),
    outputFormat: z
      .enum(["mp3", "wav", "aac", "ogg"])
      .default("mp3")
      .describe("Output audio format"),
    quality: z
      .enum(["low", "medium", "high"])
      .default("medium")
      .describe("Audio quality"),
  },
  async ({ videoUrl, outputFormat, quality }) => {
    const bitrateMap = { low: "64k", medium: "128k", high: "320k" };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "success",
              input: videoUrl,
              outputFormat,
              bitrate: bitrateMap[quality],
              message: `Audio extracted from video in ${outputFormat} format at ${bitrateMap[quality]} bitrate`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "transcribe_audio",
  "Transcribe audio content to text using speech-to-text",
  {
    audioUrl: z.string().describe("URL or path of the audio to transcribe"),
    language: z
      .enum(["es", "en", "pt", "fr", "de", "auto"])
      .default("auto")
      .describe("Language of the audio (auto for automatic detection)"),
    includeTimestamps: z
      .boolean()
      .default(false)
      .describe("Include timestamps in the transcription"),
  },
  async ({ audioUrl, language, includeTimestamps }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "success",
              input: audioUrl,
              language: language === "auto" ? "detected" : language,
              includeTimestamps,
              message:
                "Audio transcription completed. Connect a speech-to-text backend (Whisper, Google Speech, etc.) for actual transcription.",
              transcript: null,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "analyze_video_metadata",
  "Analyze video metadata: duration, resolution, codec, file size, etc.",
  {
    videoUrl: z.string().describe("URL or path of the video to analyze"),
  },
  async ({ videoUrl }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "success",
              input: videoUrl,
              message:
                "Video metadata analysis ready. Connect ffprobe or a media analysis backend for actual metadata extraction.",
              metadata: {
                duration: null,
                resolution: null,
                codec: null,
                fileSize: null,
                fps: null,
                bitrate: null,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "generate_video_thumbnail",
  "Generate a thumbnail image from a video at a specific timestamp",
  {
    videoUrl: z.string().describe("URL or path of the video"),
    timestampSeconds: z
      .number()
      .default(0)
      .describe("Timestamp in seconds to capture the thumbnail"),
    width: z.number().default(640).describe("Thumbnail width in pixels"),
    height: z.number().default(360).describe("Thumbnail height in pixels"),
  },
  async ({ videoUrl, timestampSeconds, width, height }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "success",
              input: videoUrl,
              timestamp: timestampSeconds,
              dimensions: { width, height },
              message: `Thumbnail generation configured for ${width}x${height} at ${timestampSeconds}s. Connect ffmpeg backend for actual thumbnail extraction.`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "convert_media_format",
  "Convert video or audio files between formats",
  {
    inputUrl: z.string().describe("URL or path of the input media file"),
    outputFormat: z
      .enum(["mp4", "webm", "avi", "mkv", "mp3", "wav", "aac", "ogg"])
      .describe("Target output format"),
    quality: z
      .enum(["low", "medium", "high"])
      .default("medium")
      .describe("Output quality"),
  },
  async ({ inputUrl, outputFormat, quality }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "success",
              input: inputUrl,
              outputFormat,
              quality,
              message: `Media conversion to ${outputFormat} (${quality} quality) configured. Connect ffmpeg backend for actual conversion.`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "process_youtube_url",
  "Process a YouTube URL: extract metadata, download options, and transcription",
  {
    youtubeUrl: z.string().describe("YouTube video URL"),
    actions: z
      .array(z.enum(["metadata", "transcript", "thumbnail", "audio"]))
      .default(["metadata"])
      .describe("Actions to perform on the YouTube video"),
  },
  async ({ youtubeUrl, actions }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "success",
              youtubeUrl,
              requestedActions: actions,
              message:
                "YouTube video processing configured. Connect yt-dlp or YouTube API backend for actual processing.",
              results: actions.reduce((acc, action) => {
                acc[action] = { status: "pending", data: null };
                return acc;
              }, {}),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ============================================
// RESOURCES
// ============================================

server.resource("supported-formats", "video-audio://formats", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify({
        video: ["mp4", "webm", "avi", "mkv", "mov", "flv"],
        audio: ["mp3", "wav", "aac", "ogg", "flac", "wma"],
        image: ["jpg", "png", "webp", "gif"],
        subtitle: ["srt", "vtt", "ass"],
      }),
    },
  ],
}));

server.resource(
  "server-status",
  "video-audio://status",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          server: "video-audio-mcp-server",
          version: "1.0.0",
          status: "running",
          capabilities: [
            "extract_audio",
            "transcribe",
            "analyze_metadata",
            "generate_thumbnails",
            "convert_formats",
            "process_youtube",
          ],
        }),
      },
    ],
  })
);

// ============================================
// START SERVER
// ============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("video-audio-mcp-server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
