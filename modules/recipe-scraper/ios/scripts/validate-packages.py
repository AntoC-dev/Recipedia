#!/usr/bin/env python3
"""
Validates that all required Python packages for the iOS recipe-scraper are present.

This script runs on the host Python but uses the bundled packages directory,
simulating the import environment that will be used on iOS.

Usage:
    python3 validate-packages.py <packages_dir>
"""

import sys
import os
import platform
import subprocess
from pathlib import Path


def validate_packages(packages_dir: Path) -> bool:
    """
    Validate that all required packages can be imported from the bundle.

    Note: Native packages (like lxml) are tested separately since their iOS
    binaries can't be loaded on macOS. We verify they exist as directories.

    Returns True if all packages are valid, False otherwise.
    """
    # Add packages directory to Python path (simulating iOS environment)
    sys.path.insert(0, str(packages_dir))

    # Pure-Python packages that can be imported on the host
    pure_python_packages = [
        # HTTP
        'requests',
        'urllib3',
        'certifi',
        'charset_normalizer',
        'idna',

        # HTML parsing (pure-Python parts)
        'bs4',
        'soupsieve',
        'html5lib',

        # Schema extraction (except lxml-dependent ones)
        'rdflib',
        'mf2py',
        'w3lib',

        # Type hints
        'typing_extensions',

        # Utilities
        'isodate',
        'pyparsing',
        'jstyleson',
        'six',
    ]

    # Native packages - verify they exist as directories but don't import
    # (iOS binaries won't load on macOS host)
    native_packages = [
        'lxml',  # iOS-specific wheel from Flet
    ]

    # Packages that depend on native modules - verify existence only
    native_dependent_packages = [
        'lxml_html_clean',
        'html_text',
        'extruct',
        'recipe_scrapers',
        'recipe_scraper',
    ]

    errors = []

    # Test pure-Python packages by importing
    print("  Testing pure-Python packages...")
    for package in pure_python_packages:
        try:
            __import__(package)
            print(f"    [OK] {package}")
        except ImportError as e:
            print(f"    [FAIL] {package}: {e}")
            errors.append((package, str(e)))

    # Verify native packages exist
    print("\n  Verifying native packages exist...")
    for package in native_packages:
        pkg_path = packages_dir / package
        if pkg_path.exists():
            print(f"    [OK] {package} (directory exists)")
        else:
            print(f"    [FAIL] {package} (directory missing)")
            errors.append((package, "directory missing"))

    # Verify native-dependent packages exist
    print("\n  Verifying native-dependent packages exist...")
    for package in native_dependent_packages:
        pkg_path = packages_dir / package
        # Also check for single-file modules
        pkg_file = packages_dir / f"{package}.py"
        if pkg_path.exists() or pkg_file.exists():
            print(f"    [OK] {package}")
        else:
            print(f"    [FAIL] {package} (missing)")
            errors.append((package, "package missing"))

    if errors:
        print(f"\n[ERROR] {len(errors)} package(s) failed:")
        for pkg, err in errors:
            print(f"  - {pkg}: {err}")
        return False

    total = len(pure_python_packages) + len(native_packages) + len(native_dependent_packages)
    print(f"\n[OK] All {total} packages validated successfully!")
    return True


def validate_scraper_functionality(packages_dir: Path) -> bool:
    """
    Test that the scraper module structure is correct.

    Note: We can't fully test the scraper on macOS because it depends on lxml
    which is compiled for iOS. Instead, we verify the module structure and
    that basic imports work (without the lxml-dependent parts).
    """
    print("\nVerifying scraper module structure...")

    # Check that recipe_scraper module has the expected files
    scraper_dir = packages_dir / 'recipe_scraper'
    if not scraper_dir.exists():
        print("  [FAIL] recipe_scraper directory missing")
        return False

    required_files = ['__init__.py', 'scraper.py']
    for f in required_files:
        if not (scraper_dir / f).exists():
            print(f"  [FAIL] recipe_scraper/{f} missing")
            return False
        print(f"  [OK] recipe_scraper/{f} exists")

    # Check that recipe_scrapers has expected structure
    scrapers_dir = packages_dir / 'recipe_scrapers'
    if not scrapers_dir.exists():
        print("  [FAIL] recipe_scrapers directory missing")
        return False

    # recipe_scrapers should have many scraper modules
    scraper_files = list(scrapers_dir.glob('*.py'))
    if len(scraper_files) < 50:
        print(f"  [FAIL] recipe_scrapers has only {len(scraper_files)} .py files, expected 50+")
        return False
    print(f"  [OK] recipe_scrapers has {len(scraper_files)} scraper modules")

    # Test that the Python tests pass (they use system lxml, not bundled)
    print("\n  Note: Full scraper tests run during iOS build (uses pytest)")
    print("  Skipping functional tests (lxml is iOS-only binary)")

    print("\n[OK] Scraper structure validated!")
    return True


def get_host_architecture() -> str:
    """Get the host machine architecture (arm64 or x86_64)."""
    arch = platform.machine()
    if arch in ('arm64', 'aarch64'):
        return 'arm64'
    elif arch in ('x86_64', 'AMD64'):
        return 'x86_64'
    return arch


def get_binary_architectures(file_path: Path) -> list[str]:
    """
    Get the architectures of a binary file using the 'file' command.

    Returns a list of detected architectures (e.g., ['arm64'], ['x86_64'], or ['arm64', 'x86_64'] for fat binaries).
    """
    try:
        result = subprocess.run(
            ['file', str(file_path)],
            capture_output=True,
            text=True,
            timeout=10
        )
        output = result.stdout.lower()

        archs = []
        if 'arm64' in output or 'aarch64' in output:
            archs.append('arm64')
        if 'x86_64' in output or 'x86-64' in output:
            archs.append('x86_64')

        return archs
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return []


def validate_architecture(packages_dir: Path) -> bool:
    """
    Validate that native binary files (.so) have the correct architecture.

    For simulator builds, we expect universal binaries (arm64 + x86_64).
    For device builds, we expect arm64 only.
    """
    print("\nValidating binary architectures...")

    host_arch = get_host_architecture()
    print(f"  Host architecture: {host_arch}")

    # Find all .so files in the lxml package
    lxml_dir = packages_dir / 'lxml'
    if not lxml_dir.exists():
        print("  [SKIP] lxml directory not found, skipping architecture check")
        return True

    so_files = list(lxml_dir.rglob('*.so'))
    if not so_files:
        print("  [WARN] No .so files found in lxml")
        return True

    errors = []
    warnings = []

    for so_file in so_files:
        archs = get_binary_architectures(so_file)
        relative_path = so_file.relative_to(packages_dir)

        if not archs:
            print(f"    [WARN] {relative_path}: could not determine architecture")
            warnings.append(relative_path)
            continue

        # Check if it's a simulator build (filename contains "iphonesimulator")
        is_simulator = 'iphonesimulator' in so_file.name

        if is_simulator:
            # Simulator builds should have both architectures (universal binary)
            if 'arm64' in archs and 'x86_64' in archs:
                print(f"    [OK] {relative_path}: universal ({', '.join(archs)})")
            elif host_arch in archs:
                # Single arch but matches host - acceptable with warning
                print(f"    [WARN] {relative_path}: {', '.join(archs)} (not universal, may fail on other Macs)")
                warnings.append(relative_path)
            else:
                print(f"    [FAIL] {relative_path}: {', '.join(archs)} (missing {host_arch})")
                errors.append((relative_path, archs, host_arch))
        else:
            # Device builds just need arm64
            if 'arm64' in archs:
                print(f"    [OK] {relative_path}: {', '.join(archs)}")
            else:
                print(f"    [FAIL] {relative_path}: {', '.join(archs)} (expected arm64)")
                errors.append((relative_path, archs, 'arm64'))

    if errors:
        print(f"\n[ERROR] {len(errors)} binary file(s) have wrong architecture:")
        for path, actual, expected in errors:
            print(f"  - {path}: has {', '.join(actual)}, needs {expected}")
        print("\n  This usually means the wrong wheel was downloaded.")
        print("  Try cleaning and re-running setup:")
        print("    rm -rf ios/python_packages ios/Frameworks/PythonPackages.bundle ios/Frameworks/.bundles_created")
        print("    bash ios/scripts/setup-python.sh")
        return False

    if warnings:
        print(f"\n[WARN] {len(warnings)} binary file(s) have warnings but may still work")

    print(f"\n[OK] All {len(so_files)} binary files validated!")
    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: validate-packages.py <packages_dir>")
        sys.exit(1)

    packages_dir = Path(sys.argv[1]).resolve()

    if not packages_dir.exists():
        print(f"[ERROR] Packages directory not found: {packages_dir}")
        sys.exit(1)

    print(f"Validating Python packages in: {packages_dir}\n")

    # Step 1: Validate all imports
    print("Step 1: Checking package imports...")
    if not validate_packages(packages_dir):
        sys.exit(1)

    # Step 2: Test scraper functionality
    print("\nStep 2: Testing scraper functionality...")
    if not validate_scraper_functionality(packages_dir):
        sys.exit(1)

    # Step 3: Validate binary architectures
    print("\nStep 3: Validating binary architectures...")
    if not validate_architecture(packages_dir):
        sys.exit(1)

    print("\n" + "="*50)
    print("All validations passed! Package bundle is ready.")
    print("="*50)


if __name__ == '__main__':
    main()
