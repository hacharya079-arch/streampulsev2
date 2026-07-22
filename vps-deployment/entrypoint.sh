#!/bin/bash
set -e

# Start Nginx in background
nginx -c /etc/nginx/nginx.conf

# Start StreamPulse Node server in foreground
exec npm run start
