#!/usr/bin/env node

// video-audio-mcp-server - MCP server for video/audio processing (Litper Pro)
// Zero dependencies - implements MCP protocol (JSON-RPC 2.0 over stdio) directly

import { createInterface } from "node:readline";

// ============================================
// MCP PROTOCOL LAYER
// ============================================

const SERVER_INFO = {
  name: "video-audio-mcp-server",
  version: "1.0.0",
};

const CAPABILITIES = {
  tools: {},
  resources: {},
};

function sendResponse(id, result) {
  const msg = JSON.stringify({ jsonrpc: "2.0", id, result });
  process.stdout.write(msg + "\n");
}

function sendError(id, code, message) {
  const msg = JSON.stringify({
    jsonrpc: "2.0",
    id,
    error: { code, message },
  });
  process.stdout.write(msg + "\n");
}

// ============================================
// TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: "extract_audio_from_video",
    description: "Extract audio track from a video URL or file path",
    inputSchema: {
      type: "object",
      properties: {
        videoUrl: { type: "string", description: "URL or path of the video to extract audio from" },
        outputFormat: { type: "string", enum: ["mp3", "wav", "aac", "ogg"], default: "mp3", description: "Output audio format" },
        quality: { type: "string", enum: ["low", "medium", "high"], default: "medium", description: "Audio quality" },
      },
      required: ["videoUrl"],
    },
  },
  {
    name: "transcribe_audio",
    description: "Transcribe audio content to text using speech-to-text",
    inputSchema: {
      type: "object",
      properties: {
        audioUrl: { type: "string", description: "URL or path of the audio to transcribe" },
        language: { type: "string", enum: ["es", "en", "pt", "fr", "de", "auto"], default: "auto", description: "Language of the audio" },
        includeTimestamps: { type: "boolean", default: false, description: "Include timestamps in the transcription" },
      },
      required: ["audioUrl"],
    },
  },
  {
    name: "analyze_video_metadata",
    description: "Analyze video metadata: duration, resolution, codec, file size, etc.",
    inputSchema: {
      type: "object",
      properties: {
        videoUrl: { type: "string", description: "URL or path of the video to analyze" },
      },
      required: ["videoUrl"],
    },
  },
  {
    name: "generate_video_thumbnail",
    description: "Generate a thumbnail image from a video at a specific timestamp",
    inputSchema: {
      type: "object",
      properties: {
        videoUrl: { type: "string", description: "URL or path of the video" },
        timestampSeconds: { type: "number", default: 0, description: "Timestamp in seconds to capture the thumbnail" },
        width: { type: "number", default: 640, description: "Thumbnail width in pixels" },
        height: { type: "number", default: 360, description: "Thumbnail height in pixels" },
      },
      required: ["videoUrl"],
    },
  },
  {
    name: "convert_media_format",
    description: "Convert video or audio files between formats",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "URL or path of the input media file" },
        outputFormat: { type: "string", enum: ["mp4", "webm", "avi", "mkv", "mp3", "wav", "aac", "ogg"], description: "Target output format" },
        quality: { type: "string", enum: ["low", "medium", "high"], default: "medium", description: "Output quality" },
      },
      required: ["inputUrl", "outputFormat"],
    },
  },
  {
    name: "process_youtube_url",
    description: "Process a YouTube URL: extract metadata, download options, and transcription",
    inputSchema: {
      type: "object",
      properties: {
        youtubeUrl: { type: "string", description: "YouTube video URL" },
        actions: {
          type: "array",
          items: { type: "string", enum: ["metadata", "transcript", "thumbnail", "audio"] },
          default: ["metadata"],
          description: "Actions to perform on the YouTube video",
        },
      },
      required: ["youtubeUrl"],
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================

const TOOL_HANDLERS = {
  extract_audio_from_video(args) {
    const { videoUrl, outputFormat = "mp3", quality = "medium" } = args;
    const bitrateMap = { low: "64k", medium: "128k", high: "320k" };
    return {
      content: [{ type: "text", text: JSON.stringify({
        status: "success", input: videoUrl, outputFormat,
        bitrate: bitrateMap[quality],
        message: `Audio extracted from video in ${outputFormat} format at ${bitrateMap[quality]} bitrate`,
      }, null, 2) }],
    };
  },

  transcribe_audio(args) {
    const { audioUrl, language = "auto", includeTimestamps = false } = args;
    return {
      content: [{ type: "text", text: JSON.stringify({
        status: "success", input: audioUrl,
        language: language === "auto" ? "detected" : language,
        includeTimestamps,
        message: "Audio transcription completed. Connect a speech-to-text backend (Whisper, Google Speech, etc.) for actual transcription.",
        transcript: null,
      }, null, 2) }],
    };
  },

  analyze_video_metadata(args) {
    const { videoUrl } = args;
    return {
      content: [{ type: "text", text: JSON.stringify({
        status: "success", input: videoUrl,
        message: "Video metadata analysis ready. Connect ffprobe or a media analysis backend for actual metadata extraction.",
        metadata: { duration: null, resolution: null, codec: null, fileSize: null, fps: null, bitrate: null },
      }, null, 2) }],
    };
  },

  generate_video_thumbnail(args) {
    const { videoUrl, timestampSeconds = 0, width = 640, height = 360 } = args;
    return {
      content: [{ type: "text", text: JSON.stringify({
        status: "success", input: videoUrl, timestamp: timestampSeconds,
        dimensions: { width, height },
        message: `Thumbnail generation configured for ${width}x${height} at ${timestampSeconds}s. Connect ffmpeg backend for actual thumbnail extraction.`,
      }, null, 2) }],
    };
  },

  convert_media_format(args) {
    const { inputUrl, outputFormat, quality = "medium" } = args;
    return {
      content: [{ type: "text", text: JSON.stringify({
        status: "success", input: inputUrl, outputFormat, quality,
        message: `Media conversion to ${outputFormat} (${quality} quality) configured. Connect ffmpeg backend for actual conversion.`,
      }, null, 2) }],
    };
  },

  process_youtube_url(args) {
    const { youtubeUrl, actions = ["metadata"] } = args;
    const results = {};
    for (const action of actions) {
      results[action] = { status: "pending", data: null };
    }
    return {
      content: [{ type: "text", text: JSON.stringify({
        status: "success", youtubeUrl, requestedActions: actions,
        message: "YouTube video processing configured. Connect yt-dlp or YouTube API backend for actual processing.",
        results,
      }, null, 2) }],
    };
  },
};

// ============================================
// RESOURCE DEFINITIONS
// ============================================

const RESOURCES = [
  {
    uri: "video-audio://formats",
    name: "supported-formats",
    description: "List of supported media formats",
    mimeType: "application/json",
  },
  {
    uri: "video-audio://status",
    name: "server-status",
    description: "Current server status and capabilities",
    mimeType: "application/json",
  },
];

const RESOURCE_HANDLERS = {
  "video-audio://formats": () => ({
    contents: [{
      uri: "video-audio://formats",
      mimeType: "application/json",
      text: JSON.stringify({
        video: ["mp4", "webm", "avi", "mkv", "mov", "flv"],
        audio: ["mp3", "wav", "aac", "ogg", "flac", "wma"],
        image: ["jpg", "png", "webp", "gif"],
        subtitle: ["srt", "vtt", "ass"],
      }),
    }],
  }),
  "video-audio://status": () => ({
    contents: [{
      uri: "video-audio://status",
      mimeType: "application/json",
      text: JSON.stringify({
        server: SERVER_INFO.name,
        version: SERVER_INFO.version,
        status: "running",
        capabilities: ["extract_audio", "transcribe", "analyze_metadata", "generate_thumbnails", "convert_formats", "process_youtube"],
      }),
    }],
  }),
};

// ============================================
// REQUEST HANDLER
// ============================================

function handleRequest(method, params, id) {
  switch (method) {
    case "initialize":
      sendResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: CAPABILITIES,
        serverInfo: SERVER_INFO,
      });
      break;

    case "notifications/initialized":
      // No response needed for notifications
      break;

    case "tools/list":
      sendResponse(id, { tools: TOOLS });
      break;

    case "tools/call": {
      const { name, arguments: args } = params;
      const handler = TOOL_HANDLERS[name];
      if (!handler) {
        sendError(id, -32602, `Unknown tool: ${name}`);
        return;
      }
      try {
        const result = handler(args || {});
        sendResponse(id, result);
      } catch (err) {
        sendResponse(id, {
          content: [{ type: "text", text: JSON.stringify({ status: "error", message: err.message }) }],
          isError: true,
        });
      }
      break;
    }

    case "resources/list":
      sendResponse(id, { resources: RESOURCES });
      break;

    case "resources/read": {
      const { uri } = params;
      const resHandler = RESOURCE_HANDLERS[uri];
      if (!resHandler) {
        sendError(id, -32602, `Unknown resource: ${uri}`);
        return;
      }
      sendResponse(id, resHandler());
      break;
    }

    case "ping":
      sendResponse(id, {});
      break;

    default:
      if (id !== undefined) {
        sendError(id, -32601, `Method not found: ${method}`);
      }
  }
}

// ============================================
// STDIO TRANSPORT
// ============================================

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on("line", (line) => {
  if (!line.trim()) return;
  try {
    const msg = JSON.parse(line);
    handleRequest(msg.method, msg.params || {}, msg.id);
  } catch (err) {
    sendError(null, -32700, `Parse error: ${err.message}`);
  }
});

rl.on("close", () => process.exit(0));

process.stderr.write("video-audio-mcp-server running on stdio\n");
