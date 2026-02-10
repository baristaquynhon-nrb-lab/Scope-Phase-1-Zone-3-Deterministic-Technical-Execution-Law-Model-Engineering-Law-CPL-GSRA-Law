#!/data/data/com.termux/files/usr/bin/bash

# =====================================================
# Deterministic Repo Push Script
# Usage:
#   ./scripts/push.sh "Commit message here"
# =====================================================

set -e

if [ -z "$1" ]; then
  echo "❌ Commit message missing."
  echo "Usage: ./scripts/push.sh \"your message\""
  exit 1
fi

MSG="$1"

echo "🔹 Checking repo status..."
git status

echo "🔹 Adding changes..."
git add .

echo "🔹 Committing..."
git commit -m "$MSG" || echo "⚠️ Nothing new to commit."

echo "🔹 Pushing to remote..."
git push

echo "✅ Push complete."
