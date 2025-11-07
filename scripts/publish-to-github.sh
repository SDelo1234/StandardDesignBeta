#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <remote-url> [branch]" >&2
  echo "Example: $0 https://github.com/your-name/StandardDesignBeta.git work" >&2
  exit 1
fi

remote_url="$1"
branch="${2:-work}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: this script must be run from inside a Git repository." >&2
  exit 1
fi

# Determine if a remote named origin already exists
if git remote get-url origin >/dev/null 2>&1; then
  current_url=$(git remote get-url origin)
  if [[ "$current_url" != "$remote_url" ]]; then
    echo "Updating existing origin remote from $current_url to $remote_url" >&2
    git remote set-url origin "$remote_url"
  else
    echo "Using existing origin remote: $remote_url" >&2
  fi
else
  echo "Adding origin remote: $remote_url" >&2
  git remote add origin "$remote_url"
fi

echo "Pushing branch '$branch' to origin..." >&2
git push -u origin "$branch"
