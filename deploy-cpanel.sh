#!/bin/bash
# =============================================================
# ManagedAd — cPanel Deployment Script
# Run this via SSH on your cPanel server
# =============================================================

set -e

echo "========================================="
echo "  ManagedAd — cPanel Deployment"
echo "========================================="

# Navigate to app directory
APP_DIR="$HOME/managedad.com"

if [ ! -d "$APP_DIR" ]; then
  echo "ERROR: App directory $APP_DIR not found."
  echo "Please upload your code first or adjust APP_DIR."
  exit 1
fi

cd "$APP_DIR"

echo ""
echo "[1/5] Installing dependencies..."
npm install --production=false

echo ""
echo "[2/5] Generating Prisma client..."
npx prisma generate

echo ""
echo "[3/5] Pushing database schema..."
npx prisma db push

echo ""
echo "[4/5] Building Next.js app..."
npm run build

echo ""
echo "[5/5] Seeding admin user..."
node seed-admin.js 2>/dev/null || echo "Seed skipped (already exists or script missing)"

echo ""
echo "========================================="
echo "  Deployment complete!"
echo "  Now configure Node.js App in cPanel:"
echo "  - App root: managedad.com"
echo "  - App URL: managedad.com"
echo "  - App startup file: server.js"
echo "========================================="
