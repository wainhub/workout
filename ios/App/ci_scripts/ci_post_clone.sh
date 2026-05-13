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
npx cap sync ios
echo "▶ cap sync complete."

# Capacitor 8 registers plugins via packageClassList in capacitor.config.json.
# cap sync only includes npm-installed Capacitor plugins in that list.
# Our local HealthKitPlugin is a plain Swift file, so we must inject it manually.
echo "▶ Injecting HealthKitPlugin into packageClassList..."
node -e "
const fs = require('fs');
const p = process.env.CI_PRIMARY_REPOSITORY_PATH + '/ios/App/App/capacitor.config.json';
const c = JSON.parse(fs.readFileSync(p, 'utf8'));
if (!c.packageClassList) c.packageClassList = [];
if (!c.packageClassList.includes('HealthKitPlugin')) {
  c.packageClassList.push('HealthKitPlugin');
  fs.writeFileSync(p, JSON.stringify(c, null, '\t'));
}
console.log('packageClassList:', JSON.stringify(c.packageClassList));
"
echo "▶ Injection complete."
