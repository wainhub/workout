#!/bin/sh
set -e

# Pre-xcodebuild hook — intentionally empty.
# Entitlements (including HealthKit) must NOT be cleared here;
# stripping them removes the capability from the distributed IPA.
echo "▶ ci_pre_xcodebuild: nothing to do."
