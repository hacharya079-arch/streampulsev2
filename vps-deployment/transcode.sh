#!/bin/bash

# StreamPulse Multi-Bitrate Adaptive HLS Transcoding Script
# This script is auto-triggered by Nginx-RTMP when a stream ingest begins.
# Args: $1 = Stream Key / Stream Name

set -euo pipefail

STREAM_KEY=$1
HLS_PATH="/var/www/hls/${STREAM_KEY}"
RTMP_INPUT="rtmp://localhost/ingest/${STREAM_KEY}"
LOG_FILE="/var/log/nginx/transcode_${STREAM_KEY}.log"

# Exit if no stream key is supplied
if [ -z "$STREAM_KEY" ]; then
    echo "No stream key specified. Exiting..."
    exit 1
fi

# Ensure log file is writable and initialize
touch "$LOG_FILE" 2>/dev/null || true
echo "==========================================================" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] StreamPulse Transcoder Initiated for key: ${STREAM_KEY}" >> "$LOG_FILE"

# Ensure output path exists
mkdir -p "${HLS_PATH}"
chmod -R 755 "${HLS_PATH}"

# Keep track of spawned child process PID for trapping
FFMPEG_PID=""

# Cleanup function to be called on termination signals
cleanup() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Termination signal received. Initiating cleanup..." >> "$LOG_FILE"
    if [ -n "$FFMPEG_PID" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sending SIGTERM to FFmpeg PID: $FFMPEG_PID" >> "$LOG_FILE"
        kill -TERM "$FFMPEG_PID" 2>/dev/null || true
        wait "$FFMPEG_PID" 2>/dev/null || true
    fi
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Transcoding process for ${STREAM_KEY} stopped." >> "$LOG_FILE"
    exit 0
}

# Register traps
trap 'cleanup' SIGTERM SIGINT SIGHUP SIGQUIT EXIT

# Wait a short moment for the ingest stream to fully establish
sleep 1

# Detect if the incoming stream contains an audio track
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Analyzing stream properties..." >> "$LOG_FILE"
HAS_AUDIO=0
if ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 "$RTMP_INPUT" | grep -q "[a-zA-Z0-9]"; then
    HAS_AUDIO=1
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Audio track detected in input stream." >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] No audio track detected. Proceeding with video-only transcode." >> "$LOG_FILE"
fi

# Build FFmpeg command arguments
FFMPEG_ARGS=(
    -y
    -i "$RTMP_INPUT"
    # Video splitting and downscaling filters
    -filter_complex "[v:0]split=4[v1080_in][v720_in][v480_in][v360_in]; \
                     [v1080_in]scale=w=1920:h=1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[v1080]; \
                     [v720_in]scale=w=1280:h=720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2[v720]; \
                     [v480_in]scale=w=852:h=480:force_original_aspect_ratio=decrease,pad=852:480:(ow-iw)/2:(oh-ih)/2[v480]; \
                     [v360_in]scale=w=640:h=360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2[v360]"
    
    # 1080p Track
    -map "[v1080]" -c:v:0 libx264 -preset veryfast -b:v:0 5000k -maxrate:v:0 5000k -bufsize:v:0 10000k -g 60 -keyint_min 60 -sc_threshold 0
    # 720p Track
    -map "[v720]"  -c:v:1 libx264 -preset veryfast -b:v:1 3000k -maxrate:v:1 3000k -bufsize:v:1 6000k  -g 60 -keyint_min 60 -sc_threshold 0
    # 480p Track
    -map "[v480]"  -c:v:2 libx264 -preset veryfast -b:v:2 1500k -maxrate:v:2 1500k -bufsize:v:2 3000k  -g 60 -keyint_min 60 -sc_threshold 0
    # 360p Track
    -map "[v360]"  -c:v:3 libx264 -preset veryfast -b:v:3 800k  -maxrate:v:3 800k  -bufsize:v:3 1600k  -g 60 -keyint_min 60 -sc_threshold 0
)

if [ "$HAS_AUDIO" -eq 1 ]; then
    FFMPEG_ARGS+=(
        # Map audio channel 0 to all 4 video streams
        -map 0:a -c:a:0 aac -b:a:0 192k -ac 2
        -map 0:a -c:a:1 aac -b:a:1 128k -ac 2
        -map 0:a -c:a:2 aac -b:a:2 96k  -ac 2
        -map 0:a -c:a:3 aac -b:a:3 64k  -ac 2
        
        # Muxer HLS parameters
        -f hls
        -hls_time 4
        -hls_list_size 6
        -hls_flags delete_segments
        -hls_segment_type mpegts
        -master_pl_name master.m3u8
        -hls_segment_filename "${HLS_PATH}/%v/file%03d.ts"
        -var_stream_map "v:0,a:0,name:1080p v:1,a:1,name:720p v:2,a:2,name:480p v:3,a:3,name:360p"
    )
else
    FFMPEG_ARGS+=(
        # Muxer HLS parameters (no audio maps)
        -f hls
        -hls_time 4
        -hls_list_size 6
        -hls_flags delete_segments
        -hls_segment_type mpegts
        -master_pl_name master.m3u8
        -hls_segment_filename "${HLS_PATH}/%v/file%03d.ts"
        -var_stream_map "v:0,name:1080p v:1,name:720p v:2,name:480p v:3,name:360p"
    )
fi

FFMPEG_ARGS+=(
    "${HLS_PATH}/%v/index.m3u8"
)

# Launch FFmpeg in background and wait for it
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Spawning FFmpeg command: ffmpeg ${FFMPEG_ARGS[*]}" >> "$LOG_FILE"
ffmpeg "${FFMPEG_ARGS[@]}" >> "$LOG_FILE" 2>&1 &
FFMPEG_PID=$!

echo "[$(date '+%Y-%m-%d %H:%M:%S')] FFmpeg spawned with PID: $FFMPEG_PID" >> "$LOG_FILE"

# Block on FFmpeg process
wait "$FFMPEG_PID"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] FFmpeg finished processing with exit status: $?" >> "$LOG_FILE"

