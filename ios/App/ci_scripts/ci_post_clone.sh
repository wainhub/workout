#!/bin/sh
set -e

# Xcode Cloud clones the repo but does not run npm install.
# Capacitor Swift packages are referenced as local paths inside node_modules,
# so they must exist before Xcode resolves package dependencies.

echo "▶ Installing Node.js dependencies..."

# Capacitor CLI requires Node >= 22. Install via Homebrew if missing or too old.
NODE_MAJOR=$(node --version 2>/dev/null | sed 's/v\([0-9]*\).*/\1/')
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 22 ]; then
  echo "  Node ${NODE_MAJOR:-not found} — installing node@22 via Homebrew..."
  brew install node@22
  export PATH="$(brew --prefix node@22)/bin:$PATH"
fi

echo "  node $(node --version) / npm $(npm --version)"

# CI_PRIMARY_REPOSITORY_PATH is the repo root (CI_WORKSPACE is the .xcodeproj dir)
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci

echo "▶ npm ci complete."

# Regenerate Capacitor-generated files (capacitor.config.json, config.xml, public/)
# inside ios/App/App/ — these are gitignored but required by the Xcode project.
echo "▶ Running cap sync ios..."
npx cap sync ios --no-build
echo "▶ cap sync complete."
