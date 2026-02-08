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

# Detect host architecture (arm64 for Apple Silicon, x86_64 for Intel)
HOST_ARCH=$(uname -m)

# Package manifest location
IOS_PACKAGES_MANIFEST="$SCRIPT_DIR/ios-packages.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get wheel URL from manifest based on package name and architecture key
# Usage: get_wheel_url <package_name> <arch_key>
# Example: get_wheel_url "lxml" "arm64_iphonesimulator"
get_wheel_url() {
    local package="$1"
    local arch_key="$2"

    if [ ! -f "$IOS_PACKAGES_MANIFEST" ]; then
        log_error "Package manifest not found: $IOS_PACKAGES_MANIFEST"
        return 1
    fi

    # Use Python to parse JSON (more reliable than jq which may not be installed)
    python3 -c "
import json
with open('$IOS_PACKAGES_MANIFEST') as f:
    data = json.load(f)
    print(data['packages']['$package']['wheels']['$arch_key']['url'])
" 2>/dev/null
}

# Check if this is a device build (vs simulator)
is_device_build() {
    # PLATFORM_NAME is "iphoneos" for device, "iphonesimulator" for simulator
    [ "${PLATFORM_NAME:-iphonesimulator}" = "iphoneos" ]
}

# Merge two .so files into a universal binary using lipo
# Usage: merge_so_files <arm64_so> <x86_64_so> <output_so>
merge_so_files() {
    local arm64_so="$1"
    local x86_so="$2"
    local output_so="$3"

    if [ -f "$arm64_so" ] && [ -f "$x86_so" ]; then
        lipo -create "$arm64_so" "$x86_so" -output "$output_so" 2>/dev/null && return 0
    fi
    return 1
}

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

    # Download lxml from Flet's PyPI (iOS-specific wheels)
    # Flet provides separate wheels for device vs simulator:
    #   - arm64_iphoneos: Physical devices (always arm64)
    #   - arm64_iphonesimulator: Simulator on Apple Silicon Macs
    #   - x86_64_iphonesimulator: Simulator on Intel Macs or CI runners
    #
    # For simulator builds: download BOTH arm64 and x86_64 wheels, then merge
    # with lipo to create universal binaries. This is required because:
    # - Xcode may run simulator in x86_64 mode even on Apple Silicon
    # - React Native/Expo builds often target x86_64 for simulator compatibility
    # - Universal binaries work regardless of how Xcode runs the simulator
    log_info "Detected host architecture: $HOST_ARCH"
    log_info "Target platform: ${PLATFORM_NAME:-iphonesimulator}"

    if is_device_build; then
        # Device builds: single architecture (arm64)
        log_info "Device build detected, downloading arm64 iphoneos wheel..."
        local LXML_WHEEL_URL
        LXML_WHEEL_URL=$(get_wheel_url "lxml" "arm64_iphoneos")
        download_and_extract_wheel "$LXML_WHEEL_URL" "$TEMP_DIR"
    else
        # Simulator builds: download both architectures and merge with lipo
        log_info "Simulator build detected, downloading both arm64 and x86_64 wheels..."

        local ARM64_TEMP=$(mktemp -d)
        local X86_TEMP=$(mktemp -d)

        # Download arm64 wheel
        local ARM64_URL
        ARM64_URL=$(get_wheel_url "lxml" "arm64_iphonesimulator")
        log_info "  Downloading arm64 wheel..."
        curl -fsSL "$ARM64_URL" -o "$ARM64_TEMP/lxml_arm64.whl"
        unzip -q -o "$ARM64_TEMP/lxml_arm64.whl" -d "$ARM64_TEMP/extracted" 2>/dev/null

        # Download x86_64 wheel
        local X86_URL
        X86_URL=$(get_wheel_url "lxml" "x86_64_iphonesimulator")
        log_info "  Downloading x86_64 wheel..."
        curl -fsSL "$X86_URL" -o "$X86_TEMP/lxml_x86.whl"
        unzip -q -o "$X86_TEMP/lxml_x86.whl" -d "$X86_TEMP/extracted" 2>/dev/null

        # Copy arm64 as base (includes all Python files)
        cp -R "$ARM64_TEMP/extracted/lxml" "$PACKAGES_DIR/"

        # Merge .so files with lipo to create universal binaries
        log_info "  Creating universal binaries with lipo..."
        find "$PACKAGES_DIR/lxml" -name "*.so" -type f | while read -r so_file; do
            local filename=$(basename "$so_file")
            local relative_path="${so_file#$PACKAGES_DIR/lxml/}"
            local arm64_so="$ARM64_TEMP/extracted/lxml/$relative_path"
            local x86_so="$X86_TEMP/extracted/lxml/$relative_path"

            if [ -f "$arm64_so" ] && [ -f "$x86_so" ]; then
                log_info "    Merging $filename..."
                lipo -create "$arm64_so" "$x86_so" -output "$so_file" 2>/dev/null || {
                    log_warn "    Failed to merge $filename, keeping arm64 only"
                }
            fi
        done

        rm -rf "$ARM64_TEMP" "$X86_TEMP"
        log_info "  Universal lxml binaries created"
    fi

    # Download pure-Python packages using pip3
    # Let pip resolve ALL dependencies automatically
    # Use --prefer-binary to get wheels when available, but allow source for pure-Python packages
    # Platform-specific packages (lxml) are handled separately above
    log_info "Downloading Python packages via pip (with dependencies)..."

    # Only list top-level packages - pip resolves transitive dependencies
    declare -a PACKAGES=(
        "recipe-scrapers>=15.0.0"
        "extruct"
        "requests"
    )

    # Download packages with their dependencies
    # --prefer-binary: prefer wheels but allow source distributions
    # --only-binary lxml: force wheel for lxml (we provide iOS-specific one)
    pip3 download \
        --prefer-binary \
        --only-binary lxml \
        -d "$TEMP_DIR" \
        "${PACKAGES[@]}" 2>&1 || log_warn "Some packages may have failed to download"

    # Remove lxml wheel that pip downloaded (we use the iOS-specific one from Flet)
    rm -f "$TEMP_DIR"/lxml-*.whl 2>/dev/null || true

    # Extract source distributions (tar.gz) for pure-Python packages
    log_info "Extracting source distributions..."
    for tarball in "$TEMP_DIR"/*.tar.gz; do
        if [ -f "$tarball" ]; then
            pkg_name=$(basename "$tarball" | sed 's/-[0-9].*//')
            log_info "  Extracting $(basename "$tarball")..."
            tar -xzf "$tarball" -C "$TEMP_DIR"
            # Find and copy the Python package from the extracted source
            find "$TEMP_DIR" -maxdepth 2 -type d -name "$pkg_name" ! -path "$TEMP_DIR/$pkg_name-*" -exec cp -R {} "$PACKAGES_DIR/" \; 2>/dev/null || true
            # Also try common patterns like package_name (with underscores)
            pkg_name_underscore=$(echo "$pkg_name" | tr '-' '_')
            find "$TEMP_DIR" -maxdepth 2 -type d -name "$pkg_name_underscore" ! -path "$TEMP_DIR/*-*/$pkg_name_underscore" -exec cp -R {} "$PACKAGES_DIR/" \; 2>/dev/null || true
            # For single-file modules, copy .py files from src/ or package root
            find "$TEMP_DIR" -maxdepth 3 -name "${pkg_name}.py" -exec cp {} "$PACKAGES_DIR/" \; 2>/dev/null || true
            find "$TEMP_DIR" -maxdepth 3 -name "${pkg_name_underscore}.py" -exec cp {} "$PACKAGES_DIR/" \; 2>/dev/null || true
        fi
    done

    # Identify and replace platform-specific binary wheels with pure-Python versions
    log_info "Replacing platform-specific binary wheels with pure-Python versions..."
    declare -a NEED_PURE_PYTHON=()
    for wheel in "$TEMP_DIR"/*.whl; do
        if [ -f "$wheel" ]; then
            basename_wheel=$(basename "$wheel")
            # Check if wheel is platform-specific (contains macosx, linux, win, etc.)
            if echo "$basename_wheel" | grep -qE "(macosx|linux|win32|win_amd64|manylinux)" ; then
                # Extract package name from wheel filename (format: name-version-...)
                pkg_name=$(echo "$basename_wheel" | sed 's/-[0-9].*//')
                log_warn "  Removing platform-specific wheel: $basename_wheel"
                rm -f "$wheel"
                # Add to list for re-download as pure-Python
                NEED_PURE_PYTHON+=("$pkg_name")
            fi
        fi
    done

    # Re-download filtered packages as pure-Python wheels
    if [ ${#NEED_PURE_PYTHON[@]} -gt 0 ]; then
        log_info "Downloading pure-Python versions of filtered packages..."
        for pkg in "${NEED_PURE_PYTHON[@]}"; do
            log_info "  Downloading $pkg (pure-Python)..."
            pip3 download \
                --no-deps \
                --only-binary=:all: \
                --platform any \
                --python-version 312 \
                -d "$TEMP_DIR" \
                "$pkg" 2>&1 || log_warn "  Could not find pure-Python version of $pkg"
        done
    fi

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

    # Validate critical packages exist
    log_info "Validating package installation..."
    local validation_failed=0

    # Check directory-based packages
    for pkg in "recipe_scrapers" "bs4" "extruct" "lxml" "requests" "charset_normalizer"; do
        if [ ! -d "$PACKAGES_DIR/$pkg" ]; then
            log_warn "  Package directory missing: $pkg"
            validation_failed=1
        fi
    done

    # Check file-based packages (single .py file)
    if [ ! -f "$PACKAGES_DIR/typing_extensions.py" ]; then
        log_warn "  Package file missing: typing_extensions.py"
        validation_failed=1
    fi

    if [ "$validation_failed" -eq 1 ]; then
        log_warn "Some packages may be missing, but continuing..."
    else
        log_info "All critical packages validated"
    fi

    # Mark as complete
    touch "$PACKAGES_DIR/.complete"
    log_info "Python packages installed"
}

# Validate that all required packages are present and importable
validate_packages() {
    log_info "Validating Python packages..."

    local VALIDATE_SCRIPT="$SCRIPT_DIR/validate-packages.py"

    if [ ! -f "$VALIDATE_SCRIPT" ]; then
        log_warn "Validation script not found at $VALIDATE_SCRIPT, skipping validation"
        return 0
    fi

    # Run validation using host Python but with bundled packages
    python3 "$VALIDATE_SCRIPT" "$PACKAGES_DIR"
    local result=$?

    if [ $result -ne 0 ]; then
        log_error "Package validation failed! Some required packages are missing."
        log_error "Check the output above for details."
        return 1
    fi

    log_info "Package validation passed!"
    return 0
}

# Main
log_info "Setting up Python for iOS recipe-scraper..."
setup_pythonkit
setup_python_framework
clean_test_directories
sign_binary_files
setup_python_packages
validate_packages || exit 1
create_bundle_wrappers
log_info "Python setup complete!"
