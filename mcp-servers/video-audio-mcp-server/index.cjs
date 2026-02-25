#!/usr/bin/env node
// ============================================
// VIDEO-AUDIO-MCP-SERVER
// Local MCP Server - JSON-RPC 2.0 over stdio
// No external dependencies - pure Node.js
// ============================================

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// ============================================
// CONFIGURATION
// ============================================

const OUTPUT_DIR = process.env.OUTPUT_DIR || './media/output';
const SERVER_NAME = 'video-audio-mcp-server';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

// Ensure output directory exists
try {
  fs.mkdirSync(path.resolve(OUTPUT_DIR), { recursive: true });
} catch (_) {}

// ============================================
// MCP TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: 'get_media_info',
    description: 'Get detailed information about a media file (duration, resolution, codecs, bitrate, size)',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Path to the media file' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'convert_video',
    description: 'Convert a video file to a different format, codec, or resolution using FFmpeg',
    inputSchema: {
      type: 'object',
      properties: {
        input_file: { type: 'string', description: 'Path to the input video file' },
        output_format: { type: 'string', description: 'Output format (mp4, avi, mkv, mov, webm)', enum: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'flv', 'wmv'] },
        codec: { type: 'string', description: 'Video codec (h264, h265, vp9, av1)', enum: ['h264', 'h265', 'vp8', 'vp9', 'av1', 'mpeg4'] },
        resolution: { type: 'string', description: 'Output resolution (e.g. 1920x1080, 1280x720)' },
        bitrate: { type: 'string', description: 'Video bitrate (e.g. 5000k)' },
      },
      required: ['input_file', 'output_format'],
    },
  },
  {
    name: 'convert_audio',
    description: 'Convert an audio file to a different format, bitrate, or sample rate',
    inputSchema: {
      type: 'object',
      properties: {
        input_file: { type: 'string', description: 'Path to the input audio file' },
        output_format: { type: 'string', description: 'Output format (mp3, wav, aac, ogg, flac)', enum: ['mp3', 'wav', 'aac', 'ogg', 'flac', 'wma'] },
        bitrate: { type: 'string', description: 'Audio bitrate (e.g. 320k, 192k)' },
        sample_rate: { type: 'number', description: 'Sample rate in Hz (e.g. 44100, 48000)' },
      },
      required: ['input_file', 'output_format'],
    },
  },
  {
    name: 'trim_video',
    description: 'Cut a segment from a video file by specifying start and end times',
    inputSchema: {
      type: 'object',
      properties: {
        input_file: { type: 'string', description: 'Path to the input video file' },
        start_time: { type: 'string', description: 'Start time (HH:MM:SS or seconds)' },
        end_time: { type: 'string', description: 'End time (HH:MM:SS or seconds)' },
      },
      required: ['input_file', 'start_time', 'end_time'],
    },
  },
  {
    name: 'add_text_overlay',
    description: 'Add text overlay on top of a video (titles, watermarks, subtitles)',
    inputSchema: {
      type: 'object',
      properties: {
        input_file: { type: 'string', description: 'Path to the input video file' },
        text: { type: 'string', description: 'Text to overlay on the video' },
        x: { type: 'number', description: 'X position (default: center)' },
        y: { type: 'number', description: 'Y position (default: center)' },
        font_size: { type: 'number', description: 'Font size in pixels (default: 24)' },
        font_color: { type: 'string', description: 'Font color (default: white)' },
      },
      required: ['input_file', 'text'],
    },
  },
  {
    name: 'adjust_speed',
    description: 'Change the playback speed of a video (slow motion or speed up)',
    inputSchema: {
      type: 'object',
      properties: {
        input_file: { type: 'string', description: 'Path to the input video file' },
        speed: { type: 'number', description: 'Speed multiplier (0.25 = 4x slower, 2.0 = 2x faster)' },
        adjust_audio: { type: 'boolean', description: 'Whether to adjust audio pitch with speed (default: true)' },
      },
      required: ['input_file', 'speed'],
    },
  },
];

// ============================================
// FFMPEG HELPERS
// ============================================

function runFFprobe(filePath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ];
    execFile('ffprobe', args, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`ffprobe failed: ${error.message}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`Failed to parse ffprobe output: ${e.message}`));
      }
    });
  });
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile('ffmpeg', ['-y', ...args], { timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`ffmpeg failed: ${stderr || error.message}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function buildOutputPath(inputFile, suffix, newExt) {
  const baseName = path.basename(inputFile, path.extname(inputFile));
  const ext = newExt || path.extname(inputFile).slice(1) || 'mp4';
  const outputDir = path.resolve(OUTPUT_DIR);
  return path.join(outputDir, `${baseName}_${suffix}_${Date.now()}.${ext}`);
}

// ============================================
// TOOL HANDLERS
// ============================================

async function handleGetMediaInfo(params) {
  const { file_path } = params;
  if (!fs.existsSync(file_path)) {
    throw new Error(`File not found: ${file_path}`);
  }

  const probe = await runFFprobe(file_path);
  const format = probe.format || {};
  const videoStream = (probe.streams || []).find(s => s.codec_type === 'video');
  const audioStream = (probe.streams || []).find(s => s.codec_type === 'audio');
  const stat = fs.statSync(file_path);

  const info = {
    fileName: path.basename(file_path),
    filePath: file_path,
    format: format.format_name || 'unknown',
    duration: parseFloat(format.duration) || 0,
    size: stat.size,
    bitrate: parseInt(format.bit_rate) || 0,
  };

  if (videoStream) {
    info.video = {
      codec: videoStream.codec_name,
      width: videoStream.width,
      height: videoStream.height,
      fps: eval(videoStream.r_frame_rate) || 0,
      bitrate: parseInt(videoStream.bit_rate) || 0,
    };
  }

  if (audioStream) {
    info.audio = {
      codec: audioStream.codec_name,
      sampleRate: parseInt(audioStream.sample_rate) || 0,
      channels: audioStream.channels || 0,
      bitrate: parseInt(audioStream.bit_rate) || 0,
    };
  }

  return info;
}

async function handleConvertVideo(params) {
  const { input_file, output_format, codec, resolution, bitrate } = params;
  if (!fs.existsSync(input_file)) {
    throw new Error(`File not found: ${input_file}`);
  }

  const outputPath = buildOutputPath(input_file, 'converted', output_format);
  const args = ['-i', input_file];

  if (codec) {
    const codecMap = { h264: 'libx264', h265: 'libx265', vp8: 'libvpx', vp9: 'libvpx-vp9', av1: 'libaom-av1', mpeg4: 'mpeg4' };
    args.push('-c:v', codecMap[codec] || codec);
  }
  if (resolution) {
    args.push('-s', resolution);
  }
  if (bitrate) {
    args.push('-b:v', bitrate);
  }
  args.push(outputPath);

  await runFFmpeg(args);
  return { output_file: outputPath, format: output_format, message: `Video converted successfully to ${output_format}` };
}

async function handleConvertAudio(params) {
  const { input_file, output_format, bitrate, sample_rate } = params;
  if (!fs.existsSync(input_file)) {
    throw new Error(`File not found: ${input_file}`);
  }

  const outputPath = buildOutputPath(input_file, 'audio', output_format);
  const args = ['-i', input_file];

  if (bitrate) {
    args.push('-b:a', bitrate);
  }
  if (sample_rate) {
    args.push('-ar', String(sample_rate));
  }
  args.push(outputPath);

  await runFFmpeg(args);
  return { output_file: outputPath, format: output_format, message: `Audio converted successfully to ${output_format}` };
}

async function handleTrimVideo(params) {
  const { input_file, start_time, end_time } = params;
  if (!fs.existsSync(input_file)) {
    throw new Error(`File not found: ${input_file}`);
  }

  const outputPath = buildOutputPath(input_file, 'trimmed');
  const args = ['-i', input_file, '-ss', start_time, '-to', end_time, '-c', 'copy', outputPath];

  await runFFmpeg(args);
  return { output_file: outputPath, start: start_time, end: end_time, message: `Video trimmed from ${start_time} to ${end_time}` };
}

async function handleAddTextOverlay(params) {
  const { input_file, text, x, y, font_size, font_color } = params;
  if (!fs.existsSync(input_file)) {
    throw new Error(`File not found: ${input_file}`);
  }

  const outputPath = buildOutputPath(input_file, 'text_overlay');
  const posX = x != null ? x : '(w-text_w)/2';
  const posY = y != null ? y : '(h-text_h)/2';
  const size = font_size || 24;
  const color = font_color || 'white';

  const drawtext = `drawtext=text='${text.replace(/'/g, "\\'")}':x=${posX}:y=${posY}:fontsize=${size}:fontcolor=${color}`;
  const args = ['-i', input_file, '-vf', drawtext, '-c:a', 'copy', outputPath];

  await runFFmpeg(args);
  return { output_file: outputPath, text, message: `Text overlay "${text}" added successfully` };
}

async function handleAdjustSpeed(params) {
  const { input_file, speed, adjust_audio } = params;
  if (!fs.existsSync(input_file)) {
    throw new Error(`File not found: ${input_file}`);
  }

  const label = speed < 1 ? 'slowmo' : 'speedup';
  const outputPath = buildOutputPath(input_file, `${label}_${speed}x`);

  const videoFilter = `setpts=${(1 / speed).toFixed(4)}*PTS`;
  const audioFilter = adjust_audio !== false ? `atempo=${speed}` : null;

  let filterComplex;
  if (audioFilter) {
    // atempo only supports 0.5-2.0, chain multiple for extreme values
    let audioChain = '';
    let remaining = speed;
    while (remaining > 2.0) {
      audioChain += 'atempo=2.0,';
      remaining /= 2.0;
    }
    while (remaining < 0.5) {
      audioChain += 'atempo=0.5,';
      remaining /= 0.5;
    }
    audioChain += `atempo=${remaining.toFixed(4)}`;
    filterComplex = `-filter:v ${videoFilter} -filter:a ${audioChain}`;
  } else {
    filterComplex = `-filter:v ${videoFilter} -an`;
  }

  const args = ['-i', input_file, ...filterComplex.split(' '), outputPath];

  await runFFmpeg(args);
  return { output_file: outputPath, speed, message: `Video speed adjusted to ${speed}x` };
}

const TOOL_HANDLERS = {
  get_media_info: handleGetMediaInfo,
  convert_video: handleConvertVideo,
  convert_audio: handleConvertAudio,
  trim_video: handleTrimVideo,
  add_text_overlay: handleAddTextOverlay,
  adjust_speed: handleAdjustSpeed,
};

// ============================================
// JSON-RPC 2.0 OVER STDIO
// ============================================

function sendResponse(id, result) {
  const response = JSON.stringify({ jsonrpc: '2.0', id, result });
  process.stdout.write(response + '\n');
}

function sendError(id, code, message, data) {
  const response = JSON.stringify({
    jsonrpc: '2.0',
    id,
    error: { code, message, ...(data ? { data } : {}) },
  });
  process.stdout.write(response + '\n');
}

function sendNotification(method, params) {
  const notification = JSON.stringify({ jsonrpc: '2.0', method, params });
  process.stdout.write(notification + '\n');
}

async function handleRequest(request) {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize':
      return sendResponse(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
      });

    case 'notifications/initialized':
      // Client acknowledged initialization - no response needed
      return;

    case 'tools/list':
      return sendResponse(id, { tools: TOOLS });

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      const handler = TOOL_HANDLERS[toolName];
      if (!handler) {
        return sendResponse(id, {
          content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
          isError: true,
        });
      }

      try {
        const result = await handler(toolArgs);
        return sendResponse(id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        });
      } catch (error) {
        return sendResponse(id, {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        });
      }
    }

    case 'ping':
      return sendResponse(id, {});

    default:
      if (id !== undefined) {
        return sendError(id, -32601, `Method not found: ${method}`);
      }
  }
}

// ============================================
// STDIO TRANSPORT
// ============================================

let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;

  // Process complete JSON-RPC messages (newline-delimited)
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);

    if (line.length === 0) continue;

    try {
      const request = JSON.parse(line);
      handleRequest(request).catch((err) => {
        if (request.id !== undefined) {
          sendError(request.id, -32603, `Internal error: ${err.message}`);
        }
        process.stderr.write(`[${SERVER_NAME}] Error handling request: ${err.message}\n`);
      });
    } catch (parseError) {
      process.stderr.write(`[${SERVER_NAME}] JSON parse error: ${parseError.message}\n`);
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Log startup to stderr (not stdout, to avoid interfering with JSON-RPC)
process.stderr.write(`[${SERVER_NAME}] MCP server started (stdio, JSON-RPC 2.0)\n`);
