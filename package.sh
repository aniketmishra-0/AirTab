#!/usr/bin/env bash
# AirTab - Chrome Web Store Package Script

ZIP_NAME="AirTab.zip"

echo "📦 Packaging AirTab for Chrome Web Store..."

# Remove previous zips if exist
rm -f "$ZIP_NAME" "airtab.zip" "airtab-extension.zip" "quickpeek-extension.zip"

# Clean macOS metadata files
find . -name ".DS_Store" -delete

# Create clean zip excluding non-extension files
zip -r "$ZIP_NAME" \
  manifest.json \
  rules.json \
  background.js \
  content.js \
  styles.css \
  options.html \
  options.js \
  privacy-policy.html \
  icons/icon16.png \
  icons/icon48.png \
  icons/icon128.png \
  icons/promo_tile_440x280.png \
  icons/marquee_1400x560.png \
  -x "*.DS_Store"

# Also maintain lowercase copy
cp "$ZIP_NAME" "airtab.zip"
cp "$ZIP_NAME" "airtab-extension.zip"

echo "✅ Package created successfully: $ZIP_NAME"
echo "🚀 Ready to upload directly to https://chrome.google.com/webstore/devconsole"
