#!/bin/bash
# ==============================================================================
# Heer Ranjha - Hostinger VPS Initial Setup Script (Ubuntu 22.04 / 24.04 LTS)
# Run as root on your VPS:
#   curl -sSL https://raw.githubusercontent.com/Smahesh26/heer-ranjha/main/scripts/hostinger-setup.sh | bash
# ==============================================================================

set -e

APP_DIR="/var/www/heer-ranjha"
REPO_URL="https://github.com/Smahesh26/heer-ranjha.git"
NODE_VERSION="20"

echo ">>> [1/7] Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw nginx build-essential

echo ">>> [2/7] Installing Node.js LTS (v${NODE_VERSION})..."
if ! command -v node > /dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
fi

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

echo ">>> [3/7] Installing PM2 process manager..."
npm install -g pm2
pm2 startup systemd -u root --hp /root || true

echo ">>> [4/7] Setting up application directory ($APP_DIR)..."
mkdir -p /var/www
if [ ! -d "$APP_DIR" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR"
  git pull origin main
fi

cd "$APP_DIR"

echo ">>> [5/7] Installing application dependencies and building Next.js..."
npm install --production=false
if [ -f "prisma/schema.prisma" ]; then
  npx prisma generate
  npx prisma db push --accept-data-loss || true
fi
npm run build

echo ">>> [6/7] Starting app with PM2..."
pm2 start ecosystem.config.js || pm2 restart heer-ranjha
pm2 save

echo ">>> [7/7] Configuring UFW Firewall..."
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true

echo "=============================================================================="
echo " Heer Ranjha Initial Setup Complete!"
echo " App is running locally on http://127.0.0.1:3000 via PM2"
echo "=============================================================================="
