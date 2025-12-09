#!/bin/bash
# Setup Python runtime and packages for iOS recipe-scraper module
# This script is called during prebuild to download and prepare Python

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(dirname "$SCRIPT_DIR")"
FRAMEWORKS_DIR="$IOS_DIR/Frameworks"
PACKAGES_DIR="$IOS_DIR/python_packages"

# Python version must match Flet's pre-built wheels (3.12)
PYTHON_VERSION="3.12"
SUPPORT_REVISION="4"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Download Python-Apple-support framework
setup_python_framework() {
    local FRAMEWORK_ARCHIVE="Python-${PYTHON_VERSION}-iOS-support.b${SUPPORT_REVISION}.tar.gz"
    local DOWNLOAD_URL="https://github.com/beeware/Python-Apple-support/releases/download/${PYTHON_VERSION}-b${SUPPORT_REVISION}/${FRAMEWORK_ARCHIVE}"

    if [ -d "$FRAMEWORKS_DIR/Python.xcframework" ]; then
        log_info "Python framework already exists, skipping download"
        return 0
    fi

    log_info "Downloading Python ${PYTHON_VERSION} iOS framework..."
    mkdir -p "$FRAMEWORKS_DIR"

    local TEMP_DIR=$(mktemp -d)
    curl -L "$DOWNLOAD_URL" -o "$TEMP_DIR/$FRAMEWORK_ARCHIVE"

    log_info "Extracting Python framework..."
    tar -xzf "$TEMP_DIR/$FRAMEWORK_ARCHIVE" -C "$TEMP_DIR"

    # Copy the xcframework (contains both framework and stdlib)
    # BeeWare structure: Python.xcframework/ios-arm64/lib/python3.12/ contains stdlib
    cp -R "$TEMP_DIR/Python.xcframework" "$FRAMEWORKS_DIR/"

    # Extract stdlib to separate directory for resource bundling
    # The stdlib is inside the xcframework per-architecture folders
    mkdir -p "$FRAMEWORKS_DIR/python-stdlib"
    # Copy from simulator architecture (works for both simulator and device builds)
    if [ -d "$TEMP_DIR/Python.xcframework/ios-arm64_x86_64-simulator/lib/python${PYTHON_VERSION}" ]; then
        cp -R "$TEMP_DIR/Python.xcframework/ios-arm64_x86_64-simulator/lib/python${PYTHON_VERSION}/"* "$FRAMEWORKS_DIR/python-stdlib/"
    elif [ -d "$TEMP_DIR/Python.xcframework/ios-arm64/lib/python${PYTHON_VERSION}" ]; then
        cp -R "$TEMP_DIR/Python.xcframework/ios-arm64/lib/python${PYTHON_VERSION}/"* "$FRAMEWORKS_DIR/python-stdlib/"
    fi

    rm -rf "$TEMP_DIR"
    log_info "Python framework installed"
}

# Download and extract Python packages
setup_python_packages() {
    if [ -d "$PACKAGES_DIR" ] && [ -f "$PACKAGES_DIR/.complete" ]; then
        log_info "Python packages already installed, skipping"
        return 0
    fi

    log_info "Setting up Python packages..."
    mkdir -p "$PACKAGES_DIR"

    local TEMP_DIR=$(mktemp -d)

    # Download lxml from Flet's PyPI (iOS-specific wheel)
    log_info "Downloading lxml for iOS..."
    curl -L "https://pypi.flet.dev/lxml/lxml-5.3.0-1-cp312-cp312-ios_13_0_arm64_iphoneos.whl" \
        -o "$TEMP_DIR/lxml.whl"

    # Download pure-Python packages from PyPI
    declare -a PURE_PACKAGES=(
        "recipe-scrapers"
        "extruct"
        "beautifulsoup4"
        "soupsieve"
        "lxml-html-clean"
        "rdflib"
        "pyrdfa3"
        "mf2py"
        "w3lib"
        "html-text"
        "isodate"
        "jstyleson"
        "requests"
        "certifi"
        "charset-normalizer"
        "idna"
        "urllib3"
    )

    # Use pip to download pure-Python packages
    log_info "Downloading pure-Python packages..."
    pip3 download \
        --only-binary=:all: \
        --platform any \
        --python-version 312 \
        --implementation cp \
        --no-deps \
        -d "$TEMP_DIR" \
        "${PURE_PACKAGES[@]}" 2>/dev/null || true

    # Some packages might only have source distributions, download them too
    pip3 download \
        --no-binary=:all: \
        --no-deps \
        -d "$TEMP_DIR" \
        jstyleson pyrdfa3 2>/dev/null || true

    # Extract all wheels to packages directory
    log_info "Extracting packages..."
    for wheel in "$TEMP_DIR"/*.whl; do
        if [ -f "$wheel" ]; then
            unzip -q -o "$wheel" -d "$PACKAGES_DIR" 2>/dev/null || true
        fi
    done

    # For source distributions, extract and copy Python files
    for tarball in "$TEMP_DIR"/*.tar.gz; do
        if [ -f "$tarball" ]; then
            tar -xzf "$tarball" -C "$TEMP_DIR" 2>/dev/null || true
            # Find and copy Python source files
            find "$TEMP_DIR" -name "*.py" -exec cp {} "$PACKAGES_DIR/" \; 2>/dev/null || true
        fi
    done

    # Copy the Python scraper module
    log_info "Copying recipe_scraper module..."
    if [ -d "$IOS_DIR/python" ]; then
        cp -R "$IOS_DIR/python/recipe_scraper" "$PACKAGES_DIR/"
    fi

    rm -rf "$TEMP_DIR"

    # Mark as complete
    touch "$PACKAGES_DIR/.complete"
    log_info "Python packages installed"
}

# Main
log_info "Setting up Python for iOS recipe-scraper..."
setup_python_framework
setup_python_packages
log_info "Python setup complete!"
