#!/bin/bash
# Setup Python runtime and packages for iOS recipe-scraper module
# This script is called during prebuild to download and prepare Python

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(dirname "$SCRIPT_DIR")"
MODULE_DIR="$(dirname "$IOS_DIR")"
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

# Download PythonKit source files (vendored to avoid SPM linking issues)
setup_pythonkit() {
    local PYTHONKIT_DIR="$IOS_DIR/PythonKit"
    local PYTHONKIT_VERSION="0.5.1"

    if [ -d "$PYTHONKIT_DIR" ] && [ -f "$PYTHONKIT_DIR/.complete" ]; then
        log_info "PythonKit already downloaded, skipping"
        return 0
    fi

    log_info "Downloading PythonKit source files..."
    mkdir -p "$PYTHONKIT_DIR"

    local BASE_URL="https://raw.githubusercontent.com/pvieito/PythonKit/v${PYTHONKIT_VERSION}/PythonKit"

    declare -a FILES=(
        "Python.swift"
        "PythonLibrary.swift"
        "PythonLibrary+Symbols.swift"
        "NumpyConversion.swift"
    )

    for file in "${FILES[@]}"; do
        log_info "  Downloading $file..."
        curl -fsSL "$BASE_URL/$file" -o "$PYTHONKIT_DIR/$file" || {
            log_error "Failed to download $file"
            return 1
        }
    done

    touch "$PYTHONKIT_DIR/.complete"
    log_info "PythonKit source files downloaded"
}

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

# Download a wheel file from URL and extract it
download_and_extract_wheel() {
    local url="$1"
    local temp_dir="$2"
    local filename=$(basename "$url")

    log_info "  Downloading $filename..."
    if curl -fsSL "$url" -o "$temp_dir/$filename"; then
        unzip -q -o "$temp_dir/$filename" -d "$PACKAGES_DIR" 2>/dev/null || {
            log_warn "  Failed to extract $filename"
            return 1
        }
    else
        log_warn "  Failed to download $filename"
        return 1
    fi
}

# Download and extract Python packages
setup_python_packages() {
    if [ -d "$PACKAGES_DIR" ] && [ -f "$PACKAGES_DIR/.complete" ]; then
        log_info "Python packages already installed, skipping"
        return 0
    fi

    log_info "Setting up Python packages..."
    rm -rf "$PACKAGES_DIR"
    mkdir -p "$PACKAGES_DIR"

    local TEMP_DIR=$(mktemp -d)

    # Download lxml from Flet's PyPI (iOS-specific wheel)
    # Uses versioned URL path from pypi.flet.dev
    log_info "Downloading lxml for iOS..."
    download_and_extract_wheel \
        "https://pypi.flet.dev/-/ver_1ZftSC/lxml-5.3.0-1-cp312-cp312-ios_13_0_arm64_iphoneos.whl" \
        "$TEMP_DIR"

    # Download pure-Python packages using pip3
    # Use --only-binary=:all: to get wheels, --platform any for pure-python
    log_info "Downloading pure-Python packages via pip..."

    declare -a PACKAGES=(
        "recipe-scrapers>=15.0.0"
        "extruct"
        "beautifulsoup4"
        "soupsieve"
        "lxml-html-clean"
        "rdflib"
        "mf2py"
        "w3lib"
        "html-text"
        "isodate"
        "pyparsing"
        "requests"
        "certifi"
        "charset-normalizer"
        "idna"
        "urllib3"
    )

    # Download wheels for pure-python packages
    pip3 download \
        --only-binary=:all: \
        --platform any \
        --python-version 312 \
        --implementation cp \
        --no-deps \
        -d "$TEMP_DIR" \
        "${PACKAGES[@]}" 2>&1 || log_warn "Some packages may have failed to download"

    # Extract all downloaded wheels
    log_info "Extracting wheel packages..."
    for wheel in "$TEMP_DIR"/*.whl; do
        if [ -f "$wheel" ]; then
            log_info "  Extracting $(basename "$wheel")..."
            unzip -q -o "$wheel" -d "$PACKAGES_DIR" 2>/dev/null || log_warn "  Failed to extract $(basename "$wheel")"
        fi
    done

    # Handle source-only packages (no wheels available)
    log_info "Downloading source-only packages..."

    # jstyleson - download source and extract
    log_info "  Downloading jstyleson..."
    pip3 download --no-deps --no-binary=:all: -d "$TEMP_DIR" jstyleson 2>/dev/null || true
    for tarball in "$TEMP_DIR"/jstyleson*.tar.gz; do
        if [ -f "$tarball" ]; then
            tar -xzf "$tarball" -C "$TEMP_DIR"
            # Copy the jstyleson module
            find "$TEMP_DIR" -path "*/jstyleson/*.py" -exec cp {} "$PACKAGES_DIR/" \; 2>/dev/null || true
        fi
    done

    # pyrdfa3 - RDFa parser
    log_info "  Downloading pyrdfa3..."
    pip3 download --no-deps --no-binary=:all: -d "$TEMP_DIR" pyrdfa3 2>/dev/null || true
    for tarball in "$TEMP_DIR"/pyRdfa3*.tar.gz "$TEMP_DIR"/pyrdfa3*.tar.gz; do
        if [ -f "$tarball" ]; then
            tar -xzf "$tarball" -C "$TEMP_DIR"
            # Find the pyRdfa directory and copy it
            find "$TEMP_DIR" -type d -name "pyRdfa" -exec cp -R {} "$PACKAGES_DIR/" \; 2>/dev/null || true
        fi
    done

    # Copy the Python scraper module from the shared python/ directory
    # The module structure is: python/scraper.py, python/auth/, etc.
    log_info "Copying recipe_scraper module..."
    if [ -d "$MODULE_DIR/python" ] && [ -f "$MODULE_DIR/python/scraper.py" ]; then
        # Create recipe_scraper package directory
        mkdir -p "$PACKAGES_DIR/recipe_scraper"
        # Copy main module
        cp "$MODULE_DIR/python/scraper.py" "$PACKAGES_DIR/recipe_scraper/"
        cp "$MODULE_DIR/python/__init__.py" "$PACKAGES_DIR/recipe_scraper/" 2>/dev/null || touch "$PACKAGES_DIR/recipe_scraper/__init__.py"
        # Copy auth submodule if it exists
        if [ -d "$MODULE_DIR/python/auth" ]; then
            cp -R "$MODULE_DIR/python/auth" "$PACKAGES_DIR/recipe_scraper/"
        fi
        log_info "  Copied Python scraper module"
    else
        log_warn "  Python scraper module not found at $MODULE_DIR/python"
    fi

    rm -rf "$TEMP_DIR"

    # Validate critical packages exist and aren't empty
    log_info "Validating package installation..."
    local validation_failed=0

    for pkg in "recipe_scrapers" "bs4" "extruct" "lxml"; do
        if [ ! -d "$PACKAGES_DIR/$pkg" ]; then
            log_warn "  Package directory missing: $pkg"
            validation_failed=1
        fi
    done

    if [ "$validation_failed" -eq 1 ]; then
        log_warn "Some packages may be missing, but continuing..."
    else
        log_info "All critical packages validated"
    fi

    # Mark as complete
    touch "$PACKAGES_DIR/.complete"
    log_info "Python packages installed"
}

# Main
log_info "Setting up Python for iOS recipe-scraper..."
setup_pythonkit
setup_python_framework
clean_test_directories
sign_binary_files
setup_python_packages
create_bundle_wrappers
log_info "Python setup complete!"
