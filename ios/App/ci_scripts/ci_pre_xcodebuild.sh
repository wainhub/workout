#!/bin/sh
set -e

# Xcode Cloud archives with CODE_SIGN_IDENTITY=- (ad-hoc), which refuses to
# embed HealthKit entitlements (they require a real provisioning profile).
# Clearing the entitlements file at archive time is safe: Xcode Cloud re-signs
# the archive with the real Apple Distribution cert + proper provisioning profile
# during the managed distribution step, at which point entitlements are restored.

ENTITLEMENTS="$CI_WORKSPACE/App/AppRelease.entitlements"

if [ -f "$ENTITLEMENTS" ]; then
  echo "▶ Clearing AppRelease.entitlements for ad-hoc archive (Xcode Cloud re-adds at distribution)..."
  cat > "$ENTITLEMENTS" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict/>
</plist>
EOF
  echo "  Done."
fi
