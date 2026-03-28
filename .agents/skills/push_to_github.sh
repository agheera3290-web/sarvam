#!/bin/bash
# Auto-push all changes to GitHub
set -e

cd /app
source .agents/.env

git config user.email "rudr@base44.com"
git config user.name "Rudr"
git remote set-url origin https://${GITHUB_MCP_TOKEN}@github.com/agheera3290-web/sarvam.git

git add -A

# Only commit if there are changes
if git diff --staged --quiet; then
  echo "No changes to push."
else
  MSG="${1:-Auto-sync: SARVAM update $(date '+%Y-%m-%d %H:%M')}"
  git commit -m "$MSG"
  git push origin main
  echo "✅ Pushed to GitHub: $MSG"
fi
