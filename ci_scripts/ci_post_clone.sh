#!/bin/sh
set -e

# Xcode Cloud clones the repo but does not run npm install.
# Capacitor Swift packages are referenced as local paths inside node_modules,
# so they must exist before Xcode resolves package dependencies.

echo "▶ Installing Node.js dependencies..."

# Xcode Cloud agents ship with Node via Homebrew; fall back to installing it if missing.
if ! command -v node &>/dev/null; then
  echo "  Node not found — installing via Homebrew..."
  brew install node@20
  export PATH="$(brew --prefix node@20)/bin:$PATH"
fi

echo "  node $(node --version) / npm $(npm --version)"

# Run from the repository root (CI_WORKSPACE is set by Xcode Cloud)
cd "$CI_WORKSPACE"
npm ci

echo "▶ npm ci complete."
