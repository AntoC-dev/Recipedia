#!/bin/bash
# Setup Pyodide WASM runtime and generate a self-contained HTML bundle for iOS.
#
# Downloads Pyodide core files and generates a single HTML file with
# all assets embedded (base64 for WASM, inline for JavaScript).
#
# Note: Python packages (recipe-scrapers, etc.) are installed at runtime
# via micropip since they're pure Python and don't need pre-bundling.
#
# Usage: ./setup-pyodide.sh [--force]
#   --force: Re-download and regenerate even if bundle already exists

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(dirname "$SCRIPT_DIR")"
DOWNLOAD_DIR="$MODULE_DIR/assets/pyodide-download"
OUTPUT_DIR="$MODULE_DIR/assets"
BUNDLE_FILE="$OUTPUT_DIR/pyodide-bundle.html"

# Pyodide version and CDN
PYODIDE_VERSION="0.26.4"
PYODIDE_CDN="https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full"

# Parse arguments
FORCE=false
if [[ "$1" == "--force" ]]; then
    FORCE=true
fi

# Check if bundle already exists
if [[ -f "$BUNDLE_FILE" ]] && [[ "$FORCE" == "false" ]]; then
    BUNDLE_SIZE=$(ls -lh "$BUNDLE_FILE" | awk '{print $5}')
    echo "[setup-pyodide] Bundle already exists ($BUNDLE_SIZE), skipping (use --force to regenerate)"
    exit 0
fi

echo "[setup-pyodide] Setting up Pyodide v${PYODIDE_VERSION}..."

# Clean and create download directory
rm -rf "$DOWNLOAD_DIR"
mkdir -p "$DOWNLOAD_DIR"
mkdir -p "$OUTPUT_DIR"

cd "$DOWNLOAD_DIR"

# Download core Pyodide files
echo "[setup-pyodide] Downloading Pyodide core files..."
CORE_FILES=(
    "pyodide.js"
    "pyodide.asm.js"
    "pyodide.asm.wasm"
    "pyodide-lock.json"
    "python_stdlib.zip"
)

for file in "${CORE_FILES[@]}"; do
    echo "  Downloading $file..."
    if ! curl -fSL "$PYODIDE_CDN/$file" -o "$file"; then
        echo "ERROR: Failed to download $file from Pyodide CDN"
        exit 1
    fi
done

# Verify essential files exist
echo "[setup-pyodide] Verifying downloads..."
REQUIRED_FILES=("pyodide.js" "pyodide.asm.wasm" "python_stdlib.zip")
for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "ERROR: Required file missing: $file"
        exit 1
    fi
done

# Calculate download size
DOWNLOAD_SIZE=$(du -sh "$DOWNLOAD_DIR" | cut -f1)
echo "[setup-pyodide] Downloaded assets: $DOWNLOAD_SIZE"

# Generate the HTML bundle
echo "[setup-pyodide] Generating self-contained HTML bundle..."
cd "$SCRIPT_DIR"
if ! node generate-pyodide-html.mjs; then
    echo "ERROR: Failed to generate HTML bundle"
    exit 1
fi

# Verify bundle was created
if [[ ! -f "$BUNDLE_FILE" ]]; then
    echo "ERROR: Bundle file not created: $BUNDLE_FILE"
    exit 1
fi

# Validate bundle size (should be at least 10MB)
BUNDLE_SIZE_BYTES=$(wc -c < "$BUNDLE_FILE")
MIN_SIZE=$((10 * 1024 * 1024))  # 10MB
if [[ $BUNDLE_SIZE_BYTES -lt $MIN_SIZE ]]; then
    echo "ERROR: Bundle too small ($BUNDLE_SIZE_BYTES bytes), expected at least 10MB"
    exit 1
fi

BUNDLE_SIZE=$(ls -lh "$BUNDLE_FILE" | awk '{print $5}')
echo "[setup-pyodide] Bundle created: $BUNDLE_FILE ($BUNDLE_SIZE)"

# Clean up download directory to save space
echo "[setup-pyodide] Cleaning up downloads..."
rm -rf "$DOWNLOAD_DIR"

echo "[setup-pyodide] Setup complete!"
