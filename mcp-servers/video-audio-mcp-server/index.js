#!/usr/bin/env node

// video-audio-mcp-server v2.0 - Professional MCP server for video/audio processing
// Zero dependencies - MCP protocol (JSON-RPC 2.0 over stdio) + real FFmpeg execution
// Litper Pro Colombia

import { createInterface } from "node:readline";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, basename, extname } from "node:path";
import { mkdtemp, writeFile, readFile, unlink, readdir, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const execFileAsync = promisify(execFile);

// ============================================
// MCP PROTOCOL LAYER
// ============================================

const SERVER_INFO = { name: "video-audio-mcp-server", version: "2.0.0" };
const CAPABILITIES = { tools: {}, resources: {} };

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}

function textResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function errorResult(msg) {
  return { content: [{ type: "text", text: JSON.stringify({ status: "error", message: msg }, null, 2) }], isError: true };
}

// ============================================
// FFMPEG HELPERS
// ============================================

const OUTPUT_DIR = process.env.MCP_OUTPUT_DIR || join(tmpdir(), "mcp-video-audio");

async function ensureOutputDir() {
  try { await mkdir(OUTPUT_DIR, { recursive: true }); } catch {}
  return OUTPUT_DIR;
}

function outPath(name) {
  return join(OUTPUT_DIR, `${randomUUID()}_${name}`);
}

async function ffmpeg(args, timeoutMs = 300000) {
  const bin = process.env.FFMPEG_PATH || "ffmpeg";
  return execFileAsync(bin, args, { timeout: timeoutMs, maxBuffer: 50 * 1024 * 1024 });
}

async function ffprobe(args) {
  const bin = process.env.FFPROBE_PATH || "ffprobe";
  return execFileAsync(bin, args, { timeout: 30000, maxBuffer: 10 * 1024 * 1024 });
}

async function getMediaInfo(input) {
  const { stdout } = await ffprobe([
    "-v", "quiet", "-print_format", "json",
    "-show_format", "-show_streams", input,
  ]);
  return JSON.parse(stdout);
}

// ============================================
// TOOL DEFINITIONS (32 total)
// ============================================

const TOOLS = [
  // === ORIGINAL 6 ===
  {
    name: "extract_audio_from_video",
    description: "Extract audio track from a video file using FFmpeg",
    inputSchema: {
      type: "object",
      properties: {
        videoUrl: { type: "string", description: "Path to the video file" },
        outputFormat: { type: "string", enum: ["mp3", "wav", "aac", "ogg", "flac"], default: "mp3" },
        quality: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
      },
      required: ["videoUrl"],
    },
  },
  {
    name: "transcribe_audio",
    description: "Transcribe audio to text (requires Whisper CLI installed)",
    inputSchema: {
      type: "object",
      properties: {
        audioUrl: { type: "string", description: "Path to audio file" },
        language: { type: "string", enum: ["es", "en", "pt", "fr", "de", "auto"], default: "auto" },
        model: { type: "string", enum: ["tiny", "base", "small", "medium", "large"], default: "base" },
        outputFormat: { type: "string", enum: ["txt", "srt", "vtt", "json"], default: "txt" },
      },
      required: ["audioUrl"],
    },
  },
  {
    name: "analyze_video_metadata",
    description: "Analyze video metadata using ffprobe: duration, resolution, codec, bitrate, fps, audio channels",
    inputSchema: {
      type: "object",
      properties: { videoUrl: { type: "string", description: "Path to the video file" } },
      required: ["videoUrl"],
    },
  },
  {
    name: "generate_video_thumbnail",
    description: "Generate a thumbnail image from a video at a specific timestamp using FFmpeg",
    inputSchema: {
      type: "object",
      properties: {
        videoUrl: { type: "string", description: "Path to the video" },
        timestampSeconds: { type: "number", default: 0 },
        width: { type: "number", default: 640 },
        height: { type: "number", default: 360 },
        outputFormat: { type: "string", enum: ["jpg", "png", "webp"], default: "jpg" },
      },
      required: ["videoUrl"],
    },
  },
  {
    name: "convert_media_format",
    description: "Convert video or audio files between formats using FFmpeg",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input media file" },
        outputFormat: { type: "string", enum: ["mp4", "webm", "avi", "mkv", "mov", "mp3", "wav", "aac", "ogg", "flac"] },
        quality: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
        videoCodec: { type: "string", enum: ["libx264", "libx265", "libvpx-vp9", "copy"], description: "Video codec (optional)" },
        audioCodec: { type: "string", enum: ["aac", "libmp3lame", "libvorbis", "libopus", "copy"], description: "Audio codec (optional)" },
      },
      required: ["inputUrl", "outputFormat"],
    },
  },
  {
    name: "process_youtube_url",
    description: "Process a YouTube URL using yt-dlp: download, extract audio, get metadata",
    inputSchema: {
      type: "object",
      properties: {
        youtubeUrl: { type: "string", description: "YouTube video URL" },
        actions: { type: "array", items: { type: "string", enum: ["metadata", "transcript", "thumbnail", "audio", "video"] }, default: ["metadata"] },
        audioFormat: { type: "string", enum: ["mp3", "wav", "aac"], default: "mp3" },
        videoQuality: { type: "string", enum: ["best", "720p", "480p", "360p"], default: "best" },
      },
      required: ["youtubeUrl"],
    },
  },

  // === 26 NEW PROFESSIONAL TOOLS ===
  {
    name: "trim_video",
    description: "Trim/cut a video segment between start and end timestamps",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        startTime: { type: "string", description: "Start time (HH:MM:SS or seconds)" },
        endTime: { type: "string", description: "End time (HH:MM:SS or seconds)" },
        outputFormat: { type: "string", default: "mp4" },
        reEncode: { type: "boolean", default: false, description: "Re-encode for frame-accurate cuts (slower but precise)" },
      },
      required: ["inputUrl", "startTime", "endTime"],
    },
  },
  {
    name: "merge_videos",
    description: "Merge/concatenate multiple video files into one",
    inputSchema: {
      type: "object",
      properties: {
        inputUrls: { type: "array", items: { type: "string" }, description: "Paths to input videos (in order)" },
        outputFormat: { type: "string", default: "mp4" },
        method: { type: "string", enum: ["concat", "filter"], default: "concat", description: "concat=same codec, filter=different codecs" },
      },
      required: ["inputUrls"],
    },
  },
  {
    name: "split_video",
    description: "Split a video into segments of equal duration or by chapter markers",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        segmentDuration: { type: "number", description: "Duration per segment in seconds" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["inputUrl", "segmentDuration"],
    },
  },
  {
    name: "add_watermark",
    description: "Add an image watermark/logo overlay to a video",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        watermarkUrl: { type: "string", description: "Path to the watermark image (PNG with transparency)" },
        position: { type: "string", enum: ["top-left", "top-right", "bottom-left", "bottom-right", "center"], default: "bottom-right" },
        opacity: { type: "number", default: 0.7, description: "Watermark opacity (0.0-1.0)" },
        scale: { type: "number", default: 0.15, description: "Watermark scale relative to video width (0.0-1.0)" },
      },
      required: ["inputUrl", "watermarkUrl"],
    },
  },
  {
    name: "add_text_overlay",
    description: "Add text overlay/title to a video using FFmpeg drawtext filter",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        text: { type: "string", description: "Text to overlay" },
        position: { type: "string", enum: ["top", "center", "bottom"], default: "bottom" },
        fontSize: { type: "number", default: 48 },
        fontColor: { type: "string", default: "white" },
        backgroundColor: { type: "string", default: "black@0.5", description: "Background color with opacity" },
        startTime: { type: "number", default: 0, description: "When to show text (seconds)" },
        duration: { type: "number", description: "How long to show text (seconds, omit for entire video)" },
      },
      required: ["inputUrl", "text"],
    },
  },
  {
    name: "remove_background_noise",
    description: "Remove background noise from audio using FFmpeg audio filters (highpass, lowpass, afftdn)",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the audio/video file" },
        noiseReduction: { type: "number", default: 25, description: "Noise reduction level in dB (1-97)" },
        highpassFreq: { type: "number", default: 200, description: "High-pass filter frequency (Hz)" },
        lowpassFreq: { type: "number", default: 3000, description: "Low-pass filter frequency (Hz)" },
        outputFormat: { type: "string", default: "mp3" },
      },
      required: ["inputUrl"],
    },
  },
  {
    name: "normalize_audio",
    description: "Normalize audio levels using FFmpeg loudnorm filter (EBU R128 standard)",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the audio/video file" },
        targetLUFS: { type: "number", default: -14, description: "Target loudness in LUFS (-70 to -5)" },
        targetTP: { type: "number", default: -1, description: "Target true peak in dBTP" },
        outputFormat: { type: "string", default: "mp3" },
      },
      required: ["inputUrl"],
    },
  },
  {
    name: "add_background_music",
    description: "Mix background music with a video or audio file",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the main video/audio" },
        musicUrl: { type: "string", description: "Path to the background music file" },
        musicVolume: { type: "number", default: 0.15, description: "Music volume relative to main (0.0-1.0)" },
        loop: { type: "boolean", default: true, description: "Loop music if shorter than main" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["inputUrl", "musicUrl"],
    },
  },
  {
    name: "generate_subtitles_srt",
    description: "Generate SRT subtitle file from audio using Whisper",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the video/audio file" },
        language: { type: "string", enum: ["es", "en", "pt", "fr", "de", "auto"], default: "auto" },
        model: { type: "string", enum: ["tiny", "base", "small", "medium", "large"], default: "base" },
      },
      required: ["inputUrl"],
    },
  },
  {
    name: "burn_subtitles",
    description: "Burn/hardcode subtitles (SRT/ASS) into a video permanently",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        subtitlesUrl: { type: "string", description: "Path to the SRT/ASS subtitle file" },
        fontSize: { type: "number", default: 24 },
        fontColor: { type: "string", default: "white" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["inputUrl", "subtitlesUrl"],
    },
  },
  {
    name: "create_gif_from_video",
    description: "Create an animated GIF from a video segment",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        startTime: { type: "number", default: 0, description: "Start time in seconds" },
        duration: { type: "number", default: 5, description: "Duration in seconds" },
        width: { type: "number", default: 480, description: "Output width in pixels" },
        fps: { type: "number", default: 15, description: "Frames per second" },
      },
      required: ["inputUrl"],
    },
  },
  {
    name: "extract_frames",
    description: "Extract individual frames from a video as images",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        fps: { type: "number", default: 1, description: "Frames to extract per second" },
        startTime: { type: "number", default: 0 },
        duration: { type: "number", description: "Duration in seconds (omit for entire video)" },
        outputFormat: { type: "string", enum: ["jpg", "png", "webp"], default: "jpg" },
      },
      required: ["inputUrl"],
    },
  },
  {
    name: "compress_video",
    description: "Compress a video to reduce file size with configurable quality (CRF)",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        crf: { type: "number", default: 28, description: "Constant Rate Factor (0-51, lower=better quality, 23=default, 28=good compression)" },
        maxBitrate: { type: "string", description: "Max bitrate (e.g., '2M', '500k')" },
        resolution: { type: "string", description: "Target resolution (e.g., '1280x720', '1920x1080')" },
        preset: { type: "string", enum: ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow"], default: "medium" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["inputUrl"],
    },
  },
  {
    name: "batch_process",
    description: "Apply the same FFmpeg operation to multiple files",
    inputSchema: {
      type: "object",
      properties: {
        inputUrls: { type: "array", items: { type: "string" }, description: "Paths to input files" },
        operation: { type: "string", enum: ["compress", "convert", "extract_audio", "thumbnail", "normalize_audio", "resize"], description: "Operation to apply" },
        outputFormat: { type: "string", default: "mp4" },
        quality: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
        resolution: { type: "string", description: "For resize operation (e.g., '1280x720')" },
      },
      required: ["inputUrls", "operation"],
    },
  },
  {
    name: "detect_silence",
    description: "Detect silent segments in audio/video using FFmpeg silencedetect filter",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input file" },
        noiseThreshold: { type: "string", default: "-30dB", description: "Noise threshold (e.g., '-30dB', '-50dB')" },
        minDuration: { type: "number", default: 0.5, description: "Minimum silence duration in seconds" },
      },
      required: ["inputUrl"],
    },
  },
  {
    name: "detect_scene_changes",
    description: "Detect scene changes/cuts in a video using FFmpeg scene filter",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        threshold: { type: "number", default: 0.3, description: "Scene change threshold (0.0-1.0, lower=more sensitive)" },
      },
      required: ["inputUrl"],
    },
  },
  {
    name: "apply_video_filter",
    description: "Apply visual filters to a video (blur, sharpen, grayscale, sepia, vignette, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        filter: { type: "string", enum: ["blur", "sharpen", "grayscale", "sepia", "vignette", "mirror", "flip", "negate", "edge_detect", "emboss", "vintage"], description: "Filter to apply" },
        intensity: { type: "number", default: 5, description: "Filter intensity (1-10)" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["inputUrl", "filter"],
    },
  },
  {
    name: "picture_in_picture",
    description: "Create a picture-in-picture composition with two videos",
    inputSchema: {
      type: "object",
      properties: {
        mainVideo: { type: "string", description: "Path to the main/background video" },
        overlayVideo: { type: "string", description: "Path to the overlay/small video" },
        position: { type: "string", enum: ["top-left", "top-right", "bottom-left", "bottom-right"], default: "bottom-right" },
        scale: { type: "number", default: 0.25, description: "Overlay scale relative to main (0.1-0.5)" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["mainVideo", "overlayVideo"],
    },
  },
  {
    name: "generate_waveform",
    description: "Generate a visual audio waveform image from an audio/video file",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input file" },
        width: { type: "number", default: 1920 },
        height: { type: "number", default: 200 },
        color: { type: "string", default: "0x00FF00", description: "Waveform color (hex)" },
        backgroundColor: { type: "string", default: "0x000000", description: "Background color (hex)" },
        outputFormat: { type: "string", enum: ["png", "jpg"], default: "png" },
      },
      required: ["inputUrl"],
    },
  },
  {
    name: "speed_change",
    description: "Change video/audio playback speed (slow motion or fast forward)",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input file" },
        speed: { type: "number", description: "Speed multiplier (0.25=4x slow, 0.5=2x slow, 2.0=2x fast, 4.0=4x fast)" },
        preservePitch: { type: "boolean", default: true, description: "Preserve audio pitch when changing speed" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["inputUrl", "speed"],
    },
  },
  {
    name: "crop_video",
    description: "Crop a region of a video",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        width: { type: "number", description: "Crop width in pixels" },
        height: { type: "number", description: "Crop height in pixels" },
        x: { type: "number", default: 0, description: "X offset from left" },
        y: { type: "number", default: 0, description: "Y offset from top" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["inputUrl", "width", "height"],
    },
  },
  {
    name: "resize_video",
    description: "Resize/scale a video to a specific resolution",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        width: { type: "number", description: "Target width (-1 to auto-scale)" },
        height: { type: "number", description: "Target height (-1 to auto-scale)" },
        preset: { type: "string", enum: ["4k", "1080p", "720p", "480p", "360p"], description: "Resolution preset (overrides width/height)" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["inputUrl"],
    },
  },
  {
    name: "rotate_video",
    description: "Rotate a video by 90, 180, or 270 degrees",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        degrees: { type: "number", enum: [90, 180, 270], description: "Rotation angle" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["inputUrl", "degrees"],
    },
  },
  {
    name: "add_intro_outro",
    description: "Add intro and/or outro clips to a video with optional transitions",
    inputSchema: {
      type: "object",
      properties: {
        mainVideo: { type: "string", description: "Path to the main video" },
        introVideo: { type: "string", description: "Path to the intro clip" },
        outroVideo: { type: "string", description: "Path to the outro clip" },
        transition: { type: "string", enum: ["none", "fade", "dissolve"], default: "fade" },
        transitionDuration: { type: "number", default: 1, description: "Transition duration in seconds" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["mainVideo"],
    },
  },
  {
    name: "fade_in_out",
    description: "Add fade-in and/or fade-out effects to video and audio",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        fadeInDuration: { type: "number", default: 1, description: "Fade-in duration in seconds" },
        fadeOutDuration: { type: "number", default: 1, description: "Fade-out duration in seconds" },
        fadeType: { type: "string", enum: ["both", "video_only", "audio_only"], default: "both" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["inputUrl"],
    },
  },
  {
    name: "reverse_video",
    description: "Reverse a video (play backwards) with audio",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        reverseAudio: { type: "boolean", default: true, description: "Also reverse the audio" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["inputUrl"],
    },
  },
  {
    name: "loop_video",
    description: "Loop a video a specified number of times or to a target duration",
    inputSchema: {
      type: "object",
      properties: {
        inputUrl: { type: "string", description: "Path to the input video" },
        loopCount: { type: "number", default: 3, description: "Number of loops" },
        targetDuration: { type: "number", description: "Target total duration in seconds (overrides loopCount)" },
        outputFormat: { type: "string", default: "mp4" },
      },
      required: ["inputUrl"],
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================

const TOOL_HANDLERS = {
  async extract_audio_from_video({ videoUrl, outputFormat = "mp3", quality = "medium" }) {
    await ensureOutputDir();
    const bitrateMap = { low: "64k", medium: "128k", high: "320k" };
    const out = outPath(`audio.${outputFormat}`);
    const codecMap = { mp3: "libmp3lame", wav: "pcm_s16le", aac: "aac", ogg: "libvorbis", flac: "flac" };
    await ffmpeg(["-i", videoUrl, "-vn", "-acodec", codecMap[outputFormat] || "libmp3lame", "-b:a", bitrateMap[quality], "-y", out]);
    return textResult({ status: "success", input: videoUrl, output: out, format: outputFormat, bitrate: bitrateMap[quality] });
  },

  async transcribe_audio({ audioUrl, language = "auto", model = "base", outputFormat = "txt" }) {
    await ensureOutputDir();
    const whisper = process.env.WHISPER_PATH || "whisper";
    const args = [audioUrl, "--model", model, "--output_format", outputFormat, "--output_dir", OUTPUT_DIR];
    if (language !== "auto") args.push("--language", language);
    try {
      const { stdout, stderr } = await execFileAsync(whisper, args, { timeout: 600000 });
      return textResult({ status: "success", input: audioUrl, model, language, outputDir: OUTPUT_DIR, message: "Transcription complete", details: stderr || stdout });
    } catch (err) {
      if (err.code === "ENOENT") return errorResult("Whisper CLI not found. Install: pip install openai-whisper");
      throw err;
    }
  },

  async analyze_video_metadata({ videoUrl }) {
    const info = await getMediaInfo(videoUrl);
    const fmt = info.format || {};
    const videoStream = (info.streams || []).find(s => s.codec_type === "video");
    const audioStream = (info.streams || []).find(s => s.codec_type === "audio");
    return textResult({
      status: "success", input: videoUrl,
      metadata: {
        duration: parseFloat(fmt.duration || 0),
        durationFormatted: new Date((parseFloat(fmt.duration || 0)) * 1000).toISOString().substr(11, 8),
        fileSize: parseInt(fmt.size || 0),
        fileSizeMB: (parseInt(fmt.size || 0) / 1048576).toFixed(2),
        bitrate: parseInt(fmt.bit_rate || 0),
        formatName: fmt.format_name,
        video: videoStream ? {
          codec: videoStream.codec_name, width: videoStream.width, height: videoStream.height,
          fps: eval(videoStream.r_frame_rate || "0"), pixelFormat: videoStream.pix_fmt,
          profile: videoStream.profile,
        } : null,
        audio: audioStream ? {
          codec: audioStream.codec_name, sampleRate: parseInt(audioStream.sample_rate || 0),
          channels: audioStream.channels, bitrate: parseInt(audioStream.bit_rate || 0),
        } : null,
        streamCount: (info.streams || []).length,
      },
    });
  },

  async generate_video_thumbnail({ videoUrl, timestampSeconds = 0, width = 640, height = 360, outputFormat = "jpg" }) {
    await ensureOutputDir();
    const out = outPath(`thumb.${outputFormat}`);
    await ffmpeg(["-i", videoUrl, "-ss", String(timestampSeconds), "-vframes", "1", "-vf", `scale=${width}:${height}`, "-y", out]);
    return textResult({ status: "success", input: videoUrl, output: out, timestamp: timestampSeconds, dimensions: { width, height } });
  },

  async convert_media_format({ inputUrl, outputFormat, quality = "medium", videoCodec, audioCodec }) {
    await ensureOutputDir();
    const out = outPath(`converted.${outputFormat}`);
    const crfMap = { low: "32", medium: "23", high: "18" };
    const args = ["-i", inputUrl];
    if (videoCodec) args.push("-c:v", videoCodec);
    if (audioCodec) args.push("-c:a", audioCodec);
    if (!videoCodec && ["mp4", "webm", "avi", "mkv", "mov"].includes(outputFormat)) args.push("-crf", crfMap[quality]);
    args.push("-y", out);
    await ffmpeg(args);
    return textResult({ status: "success", input: inputUrl, output: out, format: outputFormat, quality });
  },

  async process_youtube_url({ youtubeUrl, actions = ["metadata"], audioFormat = "mp3", videoQuality = "best" }) {
    await ensureOutputDir();
    const ytdlp = process.env.YTDLP_PATH || "yt-dlp";
    const results = {};

    for (const action of actions) {
      try {
        if (action === "metadata") {
          const { stdout } = await execFileAsync(ytdlp, ["-j", "--no-download", youtubeUrl], { timeout: 30000 });
          results.metadata = { status: "success", data: JSON.parse(stdout) };
        } else if (action === "audio") {
          const out = outPath(`yt_audio.${audioFormat}`);
          await execFileAsync(ytdlp, ["-x", "--audio-format", audioFormat, "-o", out, youtubeUrl], { timeout: 300000 });
          results.audio = { status: "success", output: out };
        } else if (action === "video") {
          const qualityMap = { best: "bestvideo+bestaudio", "720p": "bestvideo[height<=720]+bestaudio", "480p": "bestvideo[height<=480]+bestaudio", "360p": "bestvideo[height<=360]+bestaudio" };
          const out = outPath("yt_video.mp4");
          await execFileAsync(ytdlp, ["-f", qualityMap[videoQuality], "--merge-output-format", "mp4", "-o", out, youtubeUrl], { timeout: 600000 });
          results.video = { status: "success", output: out };
        } else if (action === "thumbnail") {
          const out = outPath("yt_thumb.jpg");
          await execFileAsync(ytdlp, ["--write-thumbnail", "--skip-download", "-o", out, youtubeUrl], { timeout: 30000 });
          results.thumbnail = { status: "success", output: out };
        } else if (action === "transcript") {
          const out = outPath("yt_subs");
          await execFileAsync(ytdlp, ["--write-auto-sub", "--sub-lang", "es,en", "--skip-download", "-o", out, youtubeUrl], { timeout: 30000 });
          results.transcript = { status: "success", outputDir: OUTPUT_DIR };
        }
      } catch (err) {
        results[action] = { status: "error", message: err.code === "ENOENT" ? "yt-dlp not found. Install: pip install yt-dlp" : err.message };
      }
    }
    return textResult({ status: "success", youtubeUrl, results });
  },

  // === NEW TOOLS ===

  async trim_video({ inputUrl, startTime, endTime, outputFormat = "mp4", reEncode = false }) {
    await ensureOutputDir();
    const out = outPath(`trimmed.${outputFormat}`);
    const args = ["-i", inputUrl, "-ss", String(startTime), "-to", String(endTime)];
    if (!reEncode) args.push("-c", "copy");
    args.push("-y", out);
    await ffmpeg(args);
    return textResult({ status: "success", input: inputUrl, output: out, startTime, endTime, reEncoded: reEncode });
  },

  async merge_videos({ inputUrls, outputFormat = "mp4", method = "concat" }) {
    await ensureOutputDir();
    const out = outPath(`merged.${outputFormat}`);
    if (method === "concat") {
      const listFile = outPath("concat_list.txt");
      const content = inputUrls.map(f => `file '${f}'`).join("\n");
      await writeFile(listFile, content);
      await ffmpeg(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", "-y", out]);
      await unlink(listFile).catch(() => {});
    } else {
      const inputs = inputUrls.flatMap(f => ["-i", f]);
      const filterParts = inputUrls.map((_, i) => `[${i}:v:0][${i}:a:0]`).join("");
      const filter = `${filterParts}concat=n=${inputUrls.length}:v=1:a=1[outv][outa]`;
      await ffmpeg([...inputs, "-filter_complex", filter, "-map", "[outv]", "-map", "[outa]", "-y", out]);
    }
    return textResult({ status: "success", inputs: inputUrls, output: out, method, fileCount: inputUrls.length });
  },

  async split_video({ inputUrl, segmentDuration, outputFormat = "mp4" }) {
    await ensureOutputDir();
    const prefix = outPath("segment_");
    const pattern = `${prefix}%03d.${outputFormat}`;
    await ffmpeg(["-i", inputUrl, "-f", "segment", "-segment_time", String(segmentDuration), "-c", "copy", "-reset_timestamps", "1", pattern]);
    const dir = OUTPUT_DIR;
    const baseName = basename(prefix);
    const files = (await readdir(dir)).filter(f => f.startsWith(baseName)).sort();
    return textResult({ status: "success", input: inputUrl, segmentDuration, segments: files.map(f => join(dir, f)), segmentCount: files.length });
  },

  async add_watermark({ inputUrl, watermarkUrl, position = "bottom-right", opacity = 0.7, scale = 0.15 }) {
    await ensureOutputDir();
    const out = outPath("watermarked.mp4");
    const posMap = {
      "top-left": "10:10", "top-right": "main_w-overlay_w-10:10",
      "bottom-left": "10:main_h-overlay_h-10", "bottom-right": "main_w-overlay_w-10:main_h-overlay_h-10",
      center: "(main_w-overlay_w)/2:(main_h-overlay_h)/2",
    };
    const filter = `[1:v]scale=iw*${scale}:-1,format=rgba,colorchannelmixer=aa=${opacity}[wm];[0:v][wm]overlay=${posMap[position]}`;
    await ffmpeg(["-i", inputUrl, "-i", watermarkUrl, "-filter_complex", filter, "-c:a", "copy", "-y", out]);
    return textResult({ status: "success", input: inputUrl, output: out, watermark: watermarkUrl, position, opacity, scale });
  },

  async add_text_overlay({ inputUrl, text, position = "bottom", fontSize = 48, fontColor = "white", backgroundColor = "black@0.5", startTime = 0, duration }) {
    await ensureOutputDir();
    const out = outPath("text_overlay.mp4");
    const yMap = { top: "30", center: "(h-text_h)/2", bottom: "h-text_h-30" };
    let drawtext = `drawtext=text='${text.replace(/'/g, "\\'")}':fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=${yMap[position]}:box=1:boxcolor=${backgroundColor}:boxborderw=10`;
    if (duration) drawtext += `:enable='between(t,${startTime},${startTime + duration})'`;
    else if (startTime > 0) drawtext += `:enable='gte(t,${startTime})'`;
    await ffmpeg(["-i", inputUrl, "-vf", drawtext, "-c:a", "copy", "-y", out]);
    return textResult({ status: "success", input: inputUrl, output: out, text, position, fontSize });
  },

  async remove_background_noise({ inputUrl, noiseReduction = 25, highpassFreq = 200, lowpassFreq = 3000, outputFormat = "mp3" }) {
    await ensureOutputDir();
    const out = outPath(`denoised.${outputFormat}`);
    const filter = `highpass=f=${highpassFreq},lowpass=f=${lowpassFreq},afftdn=nf=-${noiseReduction}`;
    await ffmpeg(["-i", inputUrl, "-af", filter, "-y", out]);
    return textResult({ status: "success", input: inputUrl, output: out, noiseReduction, highpassFreq, lowpassFreq });
  },

  async normalize_audio({ inputUrl, targetLUFS = -14, targetTP = -1, outputFormat = "mp3" }) {
    await ensureOutputDir();
    const out = outPath(`normalized.${outputFormat}`);
    const filter = `loudnorm=I=${targetLUFS}:TP=${targetTP}:LRA=11:print_format=json`;
    await ffmpeg(["-i", inputUrl, "-af", filter, "-y", out]);
    return textResult({ status: "success", input: inputUrl, output: out, targetLUFS, targetTP });
  },

  async add_background_music({ inputUrl, musicUrl, musicVolume = 0.15, loop = true, outputFormat = "mp4" }) {
    await ensureOutputDir();
    const out = outPath(`with_music.${outputFormat}`);
    const streamArg = loop ? "1" : "0";
    const filter = `[1:a]volume=${musicVolume}${loop ? ",aloop=loop=-1:size=2e+09" : ""}[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[outa]`;
    await ffmpeg(["-i", inputUrl, "-stream_loop", loop ? "-1" : "0", "-i", musicUrl, "-filter_complex", filter, "-map", "0:v?", "-map", "[outa]", "-shortest", "-c:v", "copy", "-y", out]);
    return textResult({ status: "success", input: inputUrl, output: out, music: musicUrl, musicVolume, loop });
  },

  async generate_subtitles_srt({ inputUrl, language = "auto", model = "base" }) {
    await ensureOutputDir();
    const whisper = process.env.WHISPER_PATH || "whisper";
    const args = [inputUrl, "--model", model, "--output_format", "srt", "--output_dir", OUTPUT_DIR];
    if (language !== "auto") args.push("--language", language);
    try {
      await execFileAsync(whisper, args, { timeout: 600000 });
      const base = basename(inputUrl, extname(inputUrl));
      const srtPath = join(OUTPUT_DIR, `${base}.srt`);
      return textResult({ status: "success", input: inputUrl, output: srtPath, language, model });
    } catch (err) {
      if (err.code === "ENOENT") return errorResult("Whisper CLI not found. Install: pip install openai-whisper");
      throw err;
    }
  },

  async burn_subtitles({ inputUrl, subtitlesUrl, fontSize = 24, fontColor = "white", outputFormat = "mp4" }) {
    await ensureOutputDir();
    const out = outPath(`subtitled.${outputFormat}`);
    const ext = extname(subtitlesUrl).toLowerCase();
    const filter = ext === ".ass"
      ? `ass=${subtitlesUrl}`
      : `subtitles=${subtitlesUrl}:force_style='FontSize=${fontSize},PrimaryColour=&H00${fontColor === "white" ? "FFFFFF" : fontColor}&'`;
    await ffmpeg(["-i", inputUrl, "-vf", filter, "-c:a", "copy", "-y", out]);
    return textResult({ status: "success", input: inputUrl, output: out, subtitles: subtitlesUrl });
  },

  async create_gif_from_video({ inputUrl, startTime = 0, duration = 5, width = 480, fps = 15 }) {
    await ensureOutputDir();
    const palettePath = outPath("palette.png");
    const out = outPath("output.gif");
    const filter = `fps=${fps},scale=${width}:-1:flags=lanczos`;
    await ffmpeg(["-ss", String(startTime), "-t", String(duration), "-i", inputUrl, "-vf", `${filter},palettegen=stats_mode=diff`, "-y", palettePath]);
    await ffmpeg(["-ss", String(startTime), "-t", String(duration), "-i", inputUrl, "-i", palettePath, "-lavfi", `${filter}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`, "-y", out]);
    await unlink(palettePath).catch(() => {});
    return textResult({ status: "success", input: inputUrl, output: out, startTime, duration, width, fps });
  },

  async extract_frames({ inputUrl, fps = 1, startTime = 0, duration, outputFormat = "jpg" }) {
    await ensureOutputDir();
    const prefix = outPath("frame_");
    const pattern = `${prefix}%04d.${outputFormat}`;
    const args = ["-i", inputUrl, "-ss", String(startTime)];
    if (duration) args.push("-t", String(duration));
    args.push("-vf", `fps=${fps}`, "-y", pattern);
    await ffmpeg(args);
    const baseName = basename(prefix);
    const files = (await readdir(OUTPUT_DIR)).filter(f => f.startsWith(baseName)).sort();
    return textResult({ status: "success", input: inputUrl, framesExtracted: files.length, fps, outputDir: OUTPUT_DIR, frames: files.map(f => join(OUTPUT_DIR, f)) });
  },

  async compress_video({ inputUrl, crf = 28, maxBitrate, resolution, preset = "medium", outputFormat = "mp4" }) {
    await ensureOutputDir();
    const out = outPath(`compressed.${outputFormat}`);
    const args = ["-i", inputUrl, "-c:v", "libx264", "-crf", String(crf), "-preset", preset];
    if (maxBitrate) args.push("-maxrate", maxBitrate, "-bufsize", maxBitrate);
    if (resolution) args.push("-vf", `scale=${resolution.replace("x", ":")}`);
    args.push("-c:a", "aac", "-y", out);
    await ffmpeg(args);
    return textResult({ status: "success", input: inputUrl, output: out, crf, preset, resolution: resolution || "original", maxBitrate: maxBitrate || "unlimited" });
  },

  async batch_process({ inputUrls, operation, outputFormat = "mp4", quality = "medium", resolution }) {
    await ensureOutputDir();
    const results = [];
    for (const url of inputUrls) {
      try {
        let result;
        switch (operation) {
          case "compress": result = await TOOL_HANDLERS.compress_video({ inputUrl: url, outputFormat }); break;
          case "convert": result = await TOOL_HANDLERS.convert_media_format({ inputUrl: url, outputFormat, quality }); break;
          case "extract_audio": result = await TOOL_HANDLERS.extract_audio_from_video({ videoUrl: url, outputFormat: "mp3", quality }); break;
          case "thumbnail": result = await TOOL_HANDLERS.generate_video_thumbnail({ videoUrl: url }); break;
          case "normalize_audio": result = await TOOL_HANDLERS.normalize_audio({ inputUrl: url }); break;
          case "resize": result = await TOOL_HANDLERS.resize_video({ inputUrl: url, preset: resolution || "720p", outputFormat }); break;
        }
        results.push({ input: url, status: "success", output: JSON.parse(result.content[0].text).output });
      } catch (err) {
        results.push({ input: url, status: "error", message: err.message });
      }
    }
    return textResult({ status: "success", operation, totalFiles: inputUrls.length, processed: results.filter(r => r.status === "success").length, failed: results.filter(r => r.status === "error").length, results });
  },

  async detect_silence({ inputUrl, noiseThreshold = "-30dB", minDuration = 0.5 }) {
    const { stderr } = await ffmpeg(["-i", inputUrl, "-af", `silencedetect=noise=${noiseThreshold}:d=${minDuration}`, "-f", "null", "-"], 60000);
    const silences = [];
    const lines = stderr.split("\n");
    let current = {};
    for (const line of lines) {
      const startMatch = line.match(/silence_start:\s*([\d.]+)/);
      const endMatch = line.match(/silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/);
      if (startMatch) current.start = parseFloat(startMatch[1]);
      if (endMatch) { current.end = parseFloat(endMatch[1]); current.duration = parseFloat(endMatch[2]); silences.push(current); current = {}; }
    }
    return textResult({ status: "success", input: inputUrl, threshold: noiseThreshold, minDuration, silentSegments: silences, totalSilences: silences.length });
  },

  async detect_scene_changes({ inputUrl, threshold = 0.3 }) {
    const { stderr } = await ffmpeg(["-i", inputUrl, "-vf", `select='gt(scene,${threshold})',showinfo`, "-f", "null", "-"], 120000);
    const scenes = [];
    for (const line of stderr.split("\n")) {
      const match = line.match(/pts_time:([\d.]+)/);
      if (match) scenes.push({ timestamp: parseFloat(match[1]), formatted: new Date(parseFloat(match[1]) * 1000).toISOString().substr(11, 8) });
    }
    return textResult({ status: "success", input: inputUrl, threshold, sceneChanges: scenes, totalScenes: scenes.length });
  },

  async apply_video_filter({ inputUrl, filter, intensity = 5, outputFormat = "mp4" }) {
    await ensureOutputDir();
    const out = outPath(`filtered.${outputFormat}`);
    const filterMap = {
      blur: `boxblur=${intensity}:${intensity}`,
      sharpen: `unsharp=5:5:${intensity / 2}:5:5:${intensity / 2}`,
      grayscale: "hue=s=0",
      sepia: "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
      vignette: `vignette=PI/${11 - intensity}`,
      mirror: "hflip",
      flip: "vflip",
      negate: "negate",
      edge_detect: "edgedetect=low=0.1:high=0.4",
      emboss: `convolution='-1 -1 0 -1 1 1 0 1 1:-1 -1 0 -1 1 1 0 1 1:-1 -1 0 -1 1 1 0 1 1:-1 -1 0 -1 1 1 0 1 1'`,
      vintage: "curves=vintage,noise=alls=20:allf=t+u",
    };
    await ffmpeg(["-i", inputUrl, "-vf", filterMap[filter] || filter, "-c:a", "copy", "-y", out]);
    return textResult({ status: "success", input: inputUrl, output: out, filter, intensity });
  },

  async picture_in_picture({ mainVideo, overlayVideo, position = "bottom-right", scale = 0.25, outputFormat = "mp4" }) {
    await ensureOutputDir();
    const out = outPath(`pip.${outputFormat}`);
    const margin = 10;
    const posMap = {
      "top-left": `${margin}:${margin}`,
      "top-right": `main_w-overlay_w-${margin}:${margin}`,
      "bottom-left": `${margin}:main_h-overlay_h-${margin}`,
      "bottom-right": `main_w-overlay_w-${margin}:main_h-overlay_h-${margin}`,
    };
    const filter = `[1:v]scale=iw*${scale}:-1[pip];[0:v][pip]overlay=${posMap[position]}`;
    await ffmpeg(["-i", mainVideo, "-i", overlayVideo, "-filter_complex", filter, "-map", "0:a?", "-c:a", "copy", "-shortest", "-y", out]);
    return textResult({ status: "success", mainVideo, overlayVideo, output: out, position, scale });
  },

  async generate_waveform({ inputUrl, width = 1920, height = 200, color = "0x00FF00", backgroundColor = "0x000000", outputFormat = "png" }) {
    await ensureOutputDir();
    const out = outPath(`waveform.${outputFormat}`);
    const filter = `showwavespic=s=${width}x${height}:colors=${color}`;
    await ffmpeg(["-i", inputUrl, "-filter_complex", `color=c=${backgroundColor}:s=${width}x${height}[bg];[0:a]${filter}[fg];[bg][fg]overlay=format=auto`, "-frames:v", "1", "-y", out]);
    return textResult({ status: "success", input: inputUrl, output: out, dimensions: { width, height } });
  },

  async speed_change({ inputUrl, speed, preservePitch = true, outputFormat = "mp4" }) {
    await ensureOutputDir();
    const out = outPath(`speed.${outputFormat}`);
    const videoFilter = `setpts=${(1 / speed).toFixed(4)}*PTS`;
    const atempoFilters = [];
    let remaining = speed;
    while (remaining > 2.0) { atempoFilters.push("atempo=2.0"); remaining /= 2.0; }
    while (remaining < 0.5) { atempoFilters.push("atempo=0.5"); remaining /= 0.5; }
    atempoFilters.push(`atempo=${remaining.toFixed(4)}`);
    const audioFilter = atempoFilters.join(",");
    await ffmpeg(["-i", inputUrl, "-filter:v", videoFilter, "-filter:a", audioFilter, "-y", out]);
    return textResult({ status: "success", input: inputUrl, output: out, speed, preservePitch });
  },

  async crop_video({ inputUrl, width, height, x = 0, y = 0, outputFormat = "mp4" }) {
    await ensureOutputDir();
    const out = outPath(`cropped.${outputFormat}`);
    await ffmpeg(["-i", inputUrl, "-vf", `crop=${width}:${height}:${x}:${y}`, "-c:a", "copy", "-y", out]);
    return textResult({ status: "success", input: inputUrl, output: out, crop: { width, height, x, y } });
  },

  async resize_video({ inputUrl, width, height, preset, outputFormat = "mp4" }) {
    await ensureOutputDir();
    const out = outPath(`resized.${outputFormat}`);
    const presetMap = { "4k": "3840:2160", "1080p": "1920:1080", "720p": "1280:720", "480p": "854:480", "360p": "640:360" };
    const scale = preset ? presetMap[preset] : `${width || -1}:${height || -1}`;
    await ffmpeg(["-i", inputUrl, "-vf", `scale=${scale}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`, "-c:a", "copy", "-y", out]);
    return textResult({ status: "success", input: inputUrl, output: out, resolution: preset || `${width}x${height}` });
  },

  async rotate_video({ inputUrl, degrees, outputFormat = "mp4" }) {
    await ensureOutputDir();
    const out = outPath(`rotated.${outputFormat}`);
    const filterMap = { 90: "transpose=1", 180: "transpose=1,transpose=1", 270: "transpose=2" };
    await ffmpeg(["-i", inputUrl, "-vf", filterMap[degrees], "-c:a", "copy", "-y", out]);
    return textResult({ status: "success", input: inputUrl, output: out, rotation: degrees });
  },

  async add_intro_outro({ mainVideo, introVideo, outroVideo, transition = "fade", transitionDuration = 1, outputFormat = "mp4" }) {
    await ensureOutputDir();
    const parts = [];
    if (introVideo) parts.push(introVideo);
    parts.push(mainVideo);
    if (outroVideo) parts.push(outroVideo);

    if (transition === "none" || parts.length === 1) {
      return TOOL_HANDLERS.merge_videos({ inputUrls: parts, outputFormat, method: "filter" });
    }

    const out = outPath(`with_intro_outro.${outputFormat}`);
    const inputs = parts.flatMap(f => ["-i", f]);
    const n = parts.length;

    if (n === 2) {
      const filter = `[0:v][1:v]xfade=transition=fade:duration=${transitionDuration}:offset=0[outv];[0:a][1:a]acrossfade=d=${transitionDuration}[outa]`;
      await ffmpeg([...inputs, "-filter_complex", filter, "-map", "[outv]", "-map", "[outa]", "-y", out], 600000);
    } else {
      const filter =
        `[0:v][1:v]xfade=transition=fade:duration=${transitionDuration}:offset=0[v01];` +
        `[v01][2:v]xfade=transition=fade:duration=${transitionDuration}:offset=0[outv];` +
        `[0:a][1:a]acrossfade=d=${transitionDuration}[a01];` +
        `[a01][2:a]acrossfade=d=${transitionDuration}[outa]`;
      await ffmpeg([...inputs, "-filter_complex", filter, "-map", "[outv]", "-map", "[outa]", "-y", out], 600000);
    }
    return textResult({ status: "success", output: out, parts: parts.length, transition, transitionDuration });
  },

  async fade_in_out({ inputUrl, fadeInDuration = 1, fadeOutDuration = 1, fadeType = "both", outputFormat = "mp4" }) {
    await ensureOutputDir();
    const out = outPath(`faded.${outputFormat}`);
    const info = await getMediaInfo(inputUrl);
    const duration = parseFloat(info.format.duration || 0);
    const fadeOutStart = Math.max(0, duration - fadeOutDuration);

    const filters = [];
    if (fadeType === "both" || fadeType === "video_only") {
      filters.push(`fade=t=in:st=0:d=${fadeInDuration},fade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}`);
    }
    const audioFilters = [];
    if (fadeType === "both" || fadeType === "audio_only") {
      audioFilters.push(`afade=t=in:st=0:d=${fadeInDuration},afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}`);
    }

    const args = ["-i", inputUrl];
    if (filters.length) args.push("-vf", filters.join(","));
    if (audioFilters.length) args.push("-af", audioFilters.join(","));
    args.push("-y", out);
    await ffmpeg(args);
    return textResult({ status: "success", input: inputUrl, output: out, fadeInDuration, fadeOutDuration, fadeType, videoDuration: duration });
  },

  async reverse_video({ inputUrl, reverseAudio = true, outputFormat = "mp4" }) {
    await ensureOutputDir();
    const out = outPath(`reversed.${outputFormat}`);
    const args = ["-i", inputUrl, "-vf", "reverse"];
    if (reverseAudio) args.push("-af", "areverse");
    args.push("-y", out);
    await ffmpeg(args, 600000);
    return textResult({ status: "success", input: inputUrl, output: out, reverseAudio });
  },

  async loop_video({ inputUrl, loopCount = 3, targetDuration, outputFormat = "mp4" }) {
    await ensureOutputDir();
    const out = outPath(`looped.${outputFormat}`);
    if (targetDuration) {
      await ffmpeg(["-stream_loop", "-1", "-i", inputUrl, "-t", String(targetDuration), "-c", "copy", "-y", out]);
    } else {
      await ffmpeg(["-stream_loop", String(loopCount - 1), "-i", inputUrl, "-c", "copy", "-y", out]);
    }
    return textResult({ status: "success", input: inputUrl, output: out, loopCount: targetDuration ? "auto" : loopCount, targetDuration: targetDuration || "N/A" });
  },
};

// ============================================
// RESOURCES
// ============================================

const RESOURCES = [
  { uri: "video-audio://formats", name: "supported-formats", description: "All supported media formats", mimeType: "application/json" },
  { uri: "video-audio://status", name: "server-status", description: "Server status and capabilities", mimeType: "application/json" },
  { uri: "video-audio://ffmpeg-check", name: "ffmpeg-check", description: "Check FFmpeg installation", mimeType: "application/json" },
];

const RESOURCE_HANDLERS = {
  "video-audio://formats": () => ({
    contents: [{
      uri: "video-audio://formats", mimeType: "application/json",
      text: JSON.stringify({
        video: ["mp4", "webm", "avi", "mkv", "mov", "flv", "wmv"],
        audio: ["mp3", "wav", "aac", "ogg", "flac", "wma", "opus"],
        image: ["jpg", "png", "webp", "gif", "bmp"],
        subtitle: ["srt", "vtt", "ass", "ssa"],
      }),
    }],
  }),
  "video-audio://status": () => ({
    contents: [{
      uri: "video-audio://status", mimeType: "application/json",
      text: JSON.stringify({
        server: SERVER_INFO.name, version: SERVER_INFO.version, status: "running",
        totalTools: TOOLS.length,
        categories: {
          extraction: ["extract_audio_from_video", "extract_frames"],
          transcription: ["transcribe_audio", "generate_subtitles_srt"],
          analysis: ["analyze_video_metadata", "detect_silence", "detect_scene_changes"],
          editing: ["trim_video", "merge_videos", "split_video", "crop_video", "resize_video", "rotate_video", "reverse_video", "loop_video", "speed_change"],
          effects: ["add_watermark", "add_text_overlay", "apply_video_filter", "fade_in_out", "picture_in_picture", "add_intro_outro"],
          audio_processing: ["remove_background_noise", "normalize_audio", "add_background_music"],
          conversion: ["convert_media_format", "compress_video", "create_gif_from_video", "generate_video_thumbnail", "generate_waveform"],
          youtube: ["process_youtube_url"],
          batch: ["batch_process"],
          subtitles: ["burn_subtitles"],
        },
        outputDir: OUTPUT_DIR,
      }),
    }],
  }),
  "video-audio://ffmpeg-check": async () => {
    const checks = {};
    for (const [name, cmd] of [["ffmpeg", "ffmpeg"], ["ffprobe", "ffprobe"], ["whisper", "whisper"], ["yt-dlp", "yt-dlp"]]) {
      try { await execFileAsync(cmd, ["-version"], { timeout: 5000 }); checks[name] = "installed"; } catch { checks[name] = "not found"; }
    }
    return { contents: [{ uri: "video-audio://ffmpeg-check", mimeType: "application/json", text: JSON.stringify(checks) }] };
  },
};

// ============================================
// REQUEST HANDLER
// ============================================

async function handleRequest(method, params, id) {
  switch (method) {
    case "initialize":
      sendResponse(id, { protocolVersion: "2024-11-05", capabilities: CAPABILITIES, serverInfo: SERVER_INFO });
      break;
    case "notifications/initialized": break;
    case "tools/list":
      sendResponse(id, { tools: TOOLS });
      break;
    case "tools/call": {
      const { name, arguments: args } = params;
      const handler = TOOL_HANDLERS[name];
      if (!handler) { sendError(id, -32602, `Unknown tool: ${name}`); return; }
      try {
        const result = await handler(args || {});
        sendResponse(id, result);
      } catch (err) {
        sendResponse(id, errorResult(`${name} failed: ${err.message}`));
      }
      break;
    }
    case "resources/list":
      sendResponse(id, { resources: RESOURCES });
      break;
    case "resources/read": {
      const { uri } = params;
      const h = RESOURCE_HANDLERS[uri];
      if (!h) { sendError(id, -32602, `Unknown resource: ${uri}`); return; }
      sendResponse(id, typeof h === "function" ? await h() : h());
      break;
    }
    case "ping": sendResponse(id, {}); break;
    default: if (id !== undefined) sendError(id, -32601, `Method not found: ${method}`);
  }
}

// ============================================
// STDIO TRANSPORT
// ============================================

const rl = createInterface({ input: process.stdin, terminal: false });
rl.on("line", (line) => {
  if (!line.trim()) return;
  try { const msg = JSON.parse(line); handleRequest(msg.method, msg.params || {}, msg.id); }
  catch (err) { sendError(null, -32700, `Parse error: ${err.message}`); }
});
rl.on("close", () => process.exit(0));
process.stderr.write(`${SERVER_INFO.name} v${SERVER_INFO.version} running on stdio (${TOOLS.length} tools)\n`);
