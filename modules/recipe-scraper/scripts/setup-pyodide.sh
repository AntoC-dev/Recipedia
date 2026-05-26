#!/bin/bash
# Setup Pyodide bundle for iOS recipe scraping.
#
# Downloads pure-Python wheels and generates a self-contained HTML bundle with
# all assets embedded (Pyodide from npm, wheels as base64).
# This ensures offline initialization without PyPI access at runtime.
#
# Pyodide runtime files come from the npm package (node_modules/pyodide/).
# Python dependencies come from pip (pinned in requirements.txt).
#
# Usage: ./setup-pyodide.sh [--force]
#   --force: Re-download and regenerate even if bundle already exists

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(dirname "$SCRIPT_DIR")"
DOWNLOAD_DIR="$MODULE_DIR/assets/pyodide-download"
OUTPUT_DIR="$MODULE_DIR/assets"
BUNDLE_FILE="$OUTPUT_DIR/pyodide-bundle.html"
REQUIREMENTS_FILE="$SCRIPT_DIR/requirements.txt"
PYODIDE_DIR="$MODULE_DIR/../../node_modules/pyodide"

# Parse arguments
FORCE=false
if [[ "$1" == "--force" ]]; then
    FORCE=true
fi

# Check if a valid (non-empty) bundle already exists
MIN_VALID_SIZE=$((10 * 1024 * 1024))  # 10MB
if [[ -f "$BUNDLE_FILE" ]] && [[ "$FORCE" == "false" ]] && [[ $(wc -c < "$BUNDLE_FILE") -ge $MIN_VALID_SIZE ]]; then
    BUNDLE_SIZE=$(ls -lh "$BUNDLE_FILE" | awk '{print $5}')
    echo "[setup-pyodide] Bundle already exists ($BUNDLE_SIZE), skipping (use --force to regenerate)"
    exit 0
fi

# Verify Pyodide npm package is installed
if [[ ! -f "$PYODIDE_DIR/pyodide.js" ]]; then
    echo "ERROR: Pyodide npm package not found at $PYODIDE_DIR"
    echo "       Run 'npm install' first."
    exit 1
fi

PYODIDE_VERSION=$(node -e "console.log(require('$PYODIDE_DIR/package.json').version)")
echo "[setup-pyodide] Using Pyodide v${PYODIDE_VERSION} from npm"

# Prefer the project venv (has `packaging` for the validator); fall back to system python3.
PYTHON_BIN="$MODULE_DIR/python/.venv/bin/python"
[[ -x "$PYTHON_BIN" ]] || PYTHON_BIN="python3"

# Clean and create download directory (for wheels only)
rm -rf "$DOWNLOAD_DIR"
mkdir -p "$DOWNLOAD_DIR/wheels"
mkdir -p "$OUTPUT_DIR"

# Download pure-Python wheels for offline installation via pip
WHEELS_DIR="$DOWNLOAD_DIR/wheels"

echo "[setup-pyodide] Downloading Python wheels (from $REQUIREMENTS_FILE)..."

# Download all deps. Some come as sdists (jstyleson) or platform wheels (lxml).
# We filter those out below — Pyodide provides C extensions (lxml, beautifulsoup4)
# and we shim jstyleson in the bundle.
if ! "$PYTHON_BIN" -m pip download \
    -r "$REQUIREMENTS_FILE" \
    --dest "$WHEELS_DIR"; then
    echo "ERROR: Failed to download Python wheels"
    exit 1
fi

# Keep only pure-Python wheels (py3-none-any / py2.py3-none-any).
# Removes: sdists (.tar.gz), platform-specific wheels, C-extension wheels.
# Pyodide provides built-in C packages and we shim jstyleson.
for f in "$WHEELS_DIR"/*; do
    filename=$(basename "$f")
    if [[ ! "$filename" =~ -none-any\.whl$ ]]; then
        echo "  Removing non-portable package: $filename"
        rm -f "$f"
    fi
done

WHEEL_COUNT=$(ls "$WHEELS_DIR"/*.whl 2>/dev/null | wc -l | tr -d ' ')
if [[ "$WHEEL_COUNT" -eq 0 ]]; then
    echo "ERROR: No pure-Python wheels downloaded"
    exit 1
fi
echo "[setup-pyodide] Downloaded $WHEEL_COUNT pure-Python wheels"

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

# Statically validate the dependency graph against Pyodide's built-in packages
# (catches mismatches like extruct 0.18.0 requiring lxml>=6.1.1 when Pyodide
# ships lxml-6.0.0 — would otherwise only surface at iOS E2E run time).
#
# The validator needs `packaging`. The project venv has it; CI runners typically
# don't. Install scoped to a temp dir and inject via PYTHONPATH so we don't
# touch the system site-packages (PEP 668 environments would reject that).
echo "[setup-pyodide] Validating bundle dependency graph..."
VALIDATOR_TOOLS_DIR="$DOWNLOAD_DIR/tools"
if ! "$PYTHON_BIN" -c "import packaging" 2>/dev/null; then
    echo "[setup-pyodide] Installing 'packaging' for validator into $VALIDATOR_TOOLS_DIR..."
    if ! "$PYTHON_BIN" -m pip install --quiet --target "$VALIDATOR_TOOLS_DIR" packaging; then
        echo "ERROR: Failed to install 'packaging' for the bundle validator"
        exit 1
    fi
fi
if ! PYTHONPATH="$VALIDATOR_TOOLS_DIR${PYTHONPATH:+:$PYTHONPATH}" \
    "$PYTHON_BIN" "$SCRIPT_DIR/validate-bundle.py"; then
    echo "ERROR: Bundle dependency validation failed. Fix requirements.txt and rerun."
    exit 1
fi

# Clean up download directory to save space
echo "[setup-pyodide] Cleaning up downloads..."
rm -rf "$DOWNLOAD_DIR"

echo "[setup-pyodide] Setup complete!"
