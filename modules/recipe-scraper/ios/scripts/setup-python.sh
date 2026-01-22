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

# Ad-hoc sign all .so and .dylib files (required for Xcode 26+ codesigning)
sign_binary_files() {
    if [ -f "$FRAMEWORKS_DIR/.binaries_signed" ]; then
        log_info "Binary files already signed"
        return 0
    fi

    log_info "Signing binary files (.so, .dylib)..."

    # Sign all .so files in python-stdlib
    find "$FRAMEWORKS_DIR/python-stdlib" -name "*.so" -type f 2>/dev/null | while read -r file; do
        codesign --force --sign - "$file" 2>/dev/null || true
    done

    # Sign all .dylib files in python-stdlib
    find "$FRAMEWORKS_DIR/python-stdlib" -name "*.dylib" -type f 2>/dev/null | while read -r file; do
        codesign --force --sign - "$file" 2>/dev/null || true
    done

    touch "$FRAMEWORKS_DIR/.binaries_signed"
    log_info "Binary files signed"
}

# Create .bundle wrappers for Python resources (avoids codesign issues in Xcode 26+)
# Bundles are treated as opaque data containers, not code
create_bundle_wrappers() {
    if [ -f "$FRAMEWORKS_DIR/.bundles_created" ]; then
        log_info "Bundle wrappers already created"
        return 0
    fi

    log_info "Creating bundle wrappers..."

    # Create PythonStdlib.bundle from python-stdlib
    if [ -d "$FRAMEWORKS_DIR/python-stdlib" ]; then
        rm -rf "$FRAMEWORKS_DIR/PythonStdlib.bundle"
        mkdir -p "$FRAMEWORKS_DIR/PythonStdlib.bundle"
        cp -R "$FRAMEWORKS_DIR/python-stdlib/"* "$FRAMEWORKS_DIR/PythonStdlib.bundle/"
    fi

    # Create PythonPackages.bundle from python_packages
    if [ -d "$PACKAGES_DIR" ]; then
        rm -rf "$FRAMEWORKS_DIR/PythonPackages.bundle"
        mkdir -p "$FRAMEWORKS_DIR/PythonPackages.bundle"
        cp -R "$PACKAGES_DIR/"* "$FRAMEWORKS_DIR/PythonPackages.bundle/" 2>/dev/null || true
    fi

    touch "$FRAMEWORKS_DIR/.bundles_created"
    log_info "Bundle wrappers created"
}

# Remove stdlib test directories (not needed at runtime, cause codesign issues in Xcode 26+)
# This runs EVERY time to ensure test dirs are always cleaned
clean_test_directories() {
    if [ ! -d "$FRAMEWORKS_DIR/python-stdlib" ]; then
        return 0
    fi

    # Check if already cleaned (marker file)
    if [ -f "$FRAMEWORKS_DIR/.test_dirs_cleaned" ]; then
        log_info "Test directories already cleaned"
        return 0
    fi

    log_info "Removing stdlib test directories..."
    rm -rf "$FRAMEWORKS_DIR/python-stdlib/test"
    rm -rf "$FRAMEWORKS_DIR/python-stdlib/idlelib/idle_test"
    rm -rf "$FRAMEWORKS_DIR/python-stdlib/lib2to3/tests"
    rm -rf "$FRAMEWORKS_DIR/python-stdlib/turtledemo"
    find "$FRAMEWORKS_DIR/python-stdlib" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    # Also clean test directories inside xcframework
    find "$FRAMEWORKS_DIR/Python.xcframework" -path "*/lib/python*/test" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$FRAMEWORKS_DIR/Python.xcframework" -path "*/idlelib/idle_test" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$FRAMEWORKS_DIR/Python.xcframework" -path "*/turtledemo" -type d -exec rm -rf {} + 2>/dev/null || true
    find "$FRAMEWORKS_DIR/Python.xcframework" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

    touch "$FRAMEWORKS_DIR/.test_dirs_cleaned"
    log_info "Test directories cleaned"
}

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
clean_test_directories
sign_binary_files
setup_python_packages
create_bundle_wrappers
log_info "Python setup complete!"
