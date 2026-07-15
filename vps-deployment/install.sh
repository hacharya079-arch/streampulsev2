#!/usr/bin/env bash
# ==============================================================================
# StreamPulse VPS Installer
# Designed for: Ubuntu 24.04 LTS (and compatible Debian-based Linux distributions)
# Description: Automates system updates, security hardening (Fail2Ban/UFW),
#              Docker & Docker-Compose installation, SSL generation, and
#              StreamPulse Docker container deployment.
# ==============================================================================

set -euo pipefail

# --- Color Definitions ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0;37m' # No Color

# --- Helper Logging Functions ---
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Clean-up Trap on Error ---
cleanup_on_error() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Installation failed at line $1 with exit code $exit_code."
        log_info "Please resolve any system configuration or networking issues and rerun this installer."
    fi
}
trap 'cleanup_on_error $LINENO' EXIT

# --- Prerequisites Checks ---
log_info "Verifying script environment..."
if [ "$EUID" -ne 0 ]; then
    log_error "This installation script must be executed with root/sudo privileges."
    exit 1
fi

# Detect operating system
if [ -f /etc/os-release ]; then
    . /etc/os-release
    log_info "Detected OS: $NAME ($VERSION_ID)"
    if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
        log_warning "This script is optimized for Ubuntu/Debian. Continuing on best-effort basis."
    fi
else
    log_warning "Unable to detect OS type. Proceeding with standard Ubuntu installer."
fi

# --- 1. System Updates & Hardening ---
log_info "Step 1: Updating system packages and installing baseline utilities..."
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git ufw fail2ban htop unzip ca-certificates software-properties-common gnupg

# Configure Fail2Ban
log_info "Configuring Fail2Ban brute-force protection for SSH..."
if [ ! -f /etc/fail2ban/jail.local ]; then
    cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
fi
systemctl enable fail2ban
systemctl restart fail2ban
log_success "Fail2Ban protection successfully activated."

# --- 2. UFW Firewall Setup ---
log_info "Step 2: Securing VPS via UFW Firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS Secure
ufw allow 1935/tcp    # RTMP Live-Stream Ingest
ufw allow 3000/tcp    # StreamPulse Manager Web UI (if direct access bypass is needed)
ufw --force enable
log_success "Firewall active. Allowed ports: 22, 80, 443, 1935, 3000."

# --- 3. Install Docker Engine & Compose plugin ---
log_info "Step 3: Installing Docker Engine & Docker Compose..."
if ! command -v docker &> /dev/null; then
    log_info "Adding Docker repository keys..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    log_success "Docker Engine installed."
else
    log_success "Docker is already installed: $(docker --version)"
fi

# Verify Docker daemon is active
systemctl enable docker
systemctl start docker

# --- 4. Prepare Environment Variables ---
log_info "Step 4: Loading environment variables..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Generate secure random secrets
RANDOM_JWT_SECRET=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)
RANDOM_DB_PASS=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 24)

# Create Root .env if not exists
if [ ! -f "$ROOT_DIR/.env" ]; then
    log_info "Generating secure .env configuration file in project root..."
    cat <<EOF > "$ROOT_DIR/.env"
# StreamPulse Production Environment Variables
NODE_ENV=production
JWT_SECRET=${RANDOM_JWT_SECRET}

# Storage Configuration
STORAGE_MODE=postgres

# Database Configuration
DB_HOST=postgres_db
DB_PORT=5432
DB_USER=streampulse_admin
DB_PASSWORD=${RANDOM_DB_PASS}
DB_NAME=streampulse

# AI Feature Flags
AI_ENABLED=false
GEMINI_API_KEY=
EOF
    log_success ".env file generated successfully with secure credentials."
else
    log_warning ".env file already exists. Skipping recreation to preserve existing secrets."
fi

# Synchronize docker-compose.yml environment variables with .env
# Read database credentials from .env to update docker-compose.yml
DB_PASS_FROM_ENV=$(grep -E "^DB_PASSWORD=" "$ROOT_DIR/.env" | cut -d'=' -f2- || echo "${RANDOM_DB_PASS}")
JWT_SECRET_FROM_ENV=$(grep -E "^JWT_SECRET=" "$ROOT_DIR/.env" | cut -d'=' -f2- || echo "${RANDOM_JWT_SECRET}")

# Update compose env dynamically (or trust docker-compose to read root .env or service definitions)
log_info "Setting database password in docker-compose configurations..."
sed -i "s/DB_PASSWORD=.*$/DB_PASSWORD=${DB_PASS_FROM_ENV}/g" "$SCRIPT_DIR/docker-compose.yml"
sed -i "s/POSTGRES_PASSWORD=.*$/POSTGRES_PASSWORD=${DB_PASS_FROM_ENV}/g" "$SCRIPT_DIR/docker-compose.yml"
sed -i "s/JWT_SECRET=.*$/JWT_SECRET=${JWT_SECRET_FROM_ENV}/g" "$SCRIPT_DIR/docker-compose.yml"

# --- 5. SSL & Domain Configuration ---
log_info "Step 5: Configuring Domain & Let's Encrypt SSL Certificates..."
echo -e -n "${YELLOW}[PROMPT] Please enter your StreamPulse server domain name (e.g. stream.yourdomain.com): ${NC}"
# Use non-blocking read or default fallback in headless CI
if [[ -t 0 ]]; then
    read -r DOMAIN_NAME
else
    DOMAIN_NAME="streampulse.local"
fi

if [[ -z "$DOMAIN_NAME" ]]; then
    log_warning "No domain provided. Falling back to HTTP local setup (streampulse.local)."
    DOMAIN_NAME="streampulse.local"
fi

# Clean standalone Certbot request if not localhost
if [[ "$DOMAIN_NAME" != "streampulse.local" ]]; then
    log_info "Initiating Let's Encrypt SSL standalone validation for $DOMAIN_NAME..."
    # Disable port 80 momentarily if Nginx is running on host
    if systemctl is-active --quiet nginx; then
        systemctl stop nginx
    fi
    
    apt-get install -y certbot
    if certbot certonly --standalone -d "$DOMAIN_NAME" --agree-tos --register-unsafely-without-email --non-interactive; then
        log_success "SSL certificates generated successfully!"
        log_info "Updating domain names in nginx configuration..."
        sed -i "s/streampulse.yourdomain.com/${DOMAIN_NAME}/g" "$SCRIPT_DIR/nginx.conf"
    else
        log_error "SSL generation failed. Check your DNS and port 80 accessibility."
        log_warning "Continuing setup using self-signed or default HTTP parameters."
    fi
fi

# --- 6. Bootstrap Containers via Docker Compose ---
log_info "Step 6: Bootstrapping StreamPulse application services via Docker Compose..."
cd "$SCRIPT_DIR"

# Ensure local directories for volume mappings
mkdir -p "$ROOT_DIR/data"

# Pull and Build
log_info "Building StreamPulse Manager and Database Containers..."
docker compose build --pull

log_info "Launching all containers in daemonized (detached) mode..."
docker compose up -d

# Verify Container Statuses
log_info "Step 7: Validating container health states..."
sleep 5
docker compose ps

# Done
trap - EXIT
log_success "======================================================================="
log_success "  StreamPulse RTMP VPS Core Manager has been successfully installed!"
log_success "======================================================================="
log_info "Access your dashboard via:"
if [[ "$DOMAIN_NAME" != "streampulse.local" ]]; then
    log_info "URL:  https://$DOMAIN_NAME"
else
    log_info "URL:  http://YOUR_VPS_PUBLIC_IP"
fi
log_info "Stream Ingest RTMP URL: rtmp://YOUR_VPS_PUBLIC_IP/live"
log_info "======================================================================="
