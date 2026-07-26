#!/bin/bash
set -e

# Ensure HLS output, log, and static dist directories exist with proper permissions for Nginx worker (www-data)
mkdir -p /var/www/hls /var/log/nginx /app/dist
chown -R www-data:www-data /var/www/hls /var/log/nginx /app/dist 2>/dev/null || true
chmod -R 777 /var/www/hls /var/log/nginx 2>/dev/null || true
chmod -R 755 /app/dist 2>/dev/null || true

# Validate Nginx configuration syntax before starting
nginx -t -c /etc/nginx/nginx.conf

# Start Nginx in background
nginx -c /etc/nginx/nginx.conf

# Start StreamPulse Node server in foreground
exec npm run start


