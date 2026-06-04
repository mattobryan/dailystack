#!/bin/bash
# Usage: ./push.sh "your commit message"
# If no message given, uses a timestamped default.

MSG="${1:-"Update $(date '+%Y-%m-%d %H:%M')"}"

git add -A
git commit -m "$MSG"
git push
