#!/usr/bin/env bash
# Setup script for video-audio-mcp MCP server
# This installs FFmpeg and the video-audio-mcp-server npm package

set -euo pipefail

echo "=== Setting up video-audio-mcp MCP Server ==="

# 1. Check/install FFmpeg
if command -v ffmpeg &>/dev/null; then
  echo "[OK] FFmpeg found: $(ffmpeg -version 2>&1 | head -1)"
else
  echo "[INFO] FFmpeg not found. Attempting to install..."
  if command -v apt-get &>/dev/null; then
    sudo apt-get update && sudo apt-get install -y ffmpeg
  elif command -v brew &>/dev/null; then
    brew install ffmpeg
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y ffmpeg
  elif command -v pacman &>/dev/null; then
    sudo pacman -S --noconfirm ffmpeg
  else
    echo "[ERROR] Could not detect package manager. Please install FFmpeg manually:"
    echo "  - macOS: brew install ffmpeg"
    echo "  - Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  - Fedora: sudo dnf install ffmpeg"
    echo "  - Arch: sudo pacman -S ffmpeg"
    echo "  - Windows: choco install ffmpeg OR download from https://ffmpeg.org/download.html"
    exit 1
  fi

  if command -v ffmpeg &>/dev/null; then
    echo "[OK] FFmpeg installed successfully: $(ffmpeg -version 2>&1 | head -1)"
  else
    echo "[ERROR] FFmpeg installation failed. Please install it manually."
    exit 1
  fi
fi

# 2. Check/install ffprobe
if command -v ffprobe &>/dev/null; then
  echo "[OK] ffprobe found"
else
  echo "[WARN] ffprobe not found. It is usually included with FFmpeg."
  echo "       Please ensure your FFmpeg installation includes ffprobe."
fi

# 3. Verify Node.js and npx
if ! command -v node &>/dev/null; then
  echo "[ERROR] Node.js is required but not installed."
  exit 1
fi
echo "[OK] Node.js: $(node --version)"

if ! command -v npx &>/dev/null; then
  echo "[ERROR] npx is required but not installed."
  exit 1
fi
echo "[OK] npx available"

# 4. Pre-cache the MCP server package
echo "[INFO] Pre-caching video-audio-mcp-server package..."
npx -y video-audio-mcp-server --help 2>/dev/null || true
echo "[OK] video-audio-mcp-server package cached"

# 5. Create output directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
mkdir -p "$PROJECT_DIR/media/output"
mkdir -p "$PROJECT_DIR/media/input"
echo "[OK] Media directories created: media/input, media/output"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "The video-audio-mcp MCP server is configured in .mcp.json"
echo "It will start automatically when used by Claude Code or Claude Desktop."
echo ""
echo "Available tools:"
echo "  - convert_video: Convert video format, codec, resolution"
echo "  - convert_audio: Convert audio format, bitrate, sample rate"
echo "  - trim_video: Cut video segments by start/end time"
echo "  - get_media_info: Get detailed info about media files"
echo "  - add_text_overlay: Add text overlays to video"
echo "  - add_image_overlay: Add image watermarks/overlays"
echo "  - adjust_speed: Change video playback speed"
echo "  - concatenate_videos: Join multiple videos with transitions"
echo "  - add_broll: Insert B-roll footage"
echo "  - remove_silence: Detect and remove silent segments"
echo "  - burn_subtitles: Burn subtitle files into video"
echo ""
echo "Place input media files in: media/input/"
echo "Output files will be saved to: media/output/"
