#!/usr/bin/env python3
"""
Validate the Pyodide bundle's dependency graph BEFORE shipping it.

For every wheel in WHEELS_DIR, parses METADATA's Requires-Dist entries and
verifies each runtime requirement can be satisfied by either:
  (a) another wheel in WHEELS_DIR, or
  (b) a built-in Pyodide package (pyodide-lock.json from the npm package).

Extras (marker `extra == 'foo'`) are only checked when the corresponding extra
is actually used (e.g. recipe-scrapers[online]). Environment markers (e.g.
`python_version < '3.10'`, `platform_system == 'Windows'`) are evaluated
against Pyodide's runtime (Python 3.13, platform_system='Emscripten').

Exits non-zero with a clear error if any requirement cannot be satisfied.
This catches version drift (e.g. extruct 0.18.0 needing lxml>=6.1.1 while
Pyodide ships lxml-6.0.0) at build time instead of at iOS E2E run time.
"""

from __future__ import annotations

import json
import sys
import zipfile
from pathlib import Path

from packaging.requirements import Requirement
from packaging.utils import canonicalize_name
from packaging.version import Version


SCRIPT_DIR = Path(__file__).resolve().parent
MODULE_DIR = SCRIPT_DIR.parent
WHEELS_DIR = MODULE_DIR / "assets" / "pyodide-download" / "wheels"
PYODIDE_LOCK = MODULE_DIR / ".." / ".." / "node_modules" / "pyodide" / "pyodide-lock.json"
REQUIREMENTS_FILE = SCRIPT_DIR / "requirements.txt"

# Packages provided to the Pyodide runtime by shims in generate-pyodide-html.mjs
# (mocked via micropip.add_mock_package). They have no wheel but ARE available.
SHIMMED_PACKAGES = {
    "jstyleson": "0.0.2",
}

# Pyodide 0.28 runs CPython 3.13 on Emscripten/WASM.
MARKER_ENV = {
    "python_version": "3.13",
    "python_full_version": "3.13.0",
    "implementation_name": "cpython",
    "implementation_version": "3.13.0",
    "platform_system": "Emscripten",
    "platform_machine": "wasm32",
    "platform_python_implementation": "CPython",
    "os_name": "posix",
    "sys_platform": "emscripten",
}


def parse_wheel_metadata(wheel_path: Path) -> tuple[str, str, list[str]]:
    with zipfile.ZipFile(wheel_path) as zf:
        metadata_files = [n for n in zf.namelist() if n.endswith(".dist-info/METADATA")]
        if not metadata_files:
            raise RuntimeError(f"{wheel_path.name}: no METADATA found")
        with zf.open(metadata_files[0]) as f:
            raw = f.read().decode("utf-8", errors="replace")
    name = ""
    version = ""
    requires: list[str] = []
    for line in raw.splitlines():
        if line.startswith("Name:"):
            name = line.split(":", 1)[1].strip()
        elif line.startswith("Version:"):
            version = line.split(":", 1)[1].strip()
        elif line.startswith("Requires-Dist:"):
            requires.append(line.split(":", 1)[1].strip())
        elif line == "":
            break
    if not name or not version:
        raise RuntimeError(f"{wheel_path.name}: missing Name or Version in METADATA")
    return name, version, requires


def load_direct_extras() -> dict[str, set[str]]:
    extras: dict[str, set[str]] = {}
    if not REQUIREMENTS_FILE.exists():
        return extras
    for raw_line in REQUIREMENTS_FILE.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        try:
            req = Requirement(line)
        except Exception:
            continue
        if req.extras:
            extras[canonicalize_name(req.name)] = set(req.extras)
    return extras


def parse_all_wheels() -> list[tuple[str, str, list[str]]]:
    return [parse_wheel_metadata(w) for w in sorted(WHEELS_DIR.glob("*.whl"))]


def load_pyodide_builtins() -> dict[str, str]:
    if not PYODIDE_LOCK.exists():
        return {}
    lock = json.loads(PYODIDE_LOCK.read_text())
    return {canonicalize_name(p["name"]): p["version"] for p in lock.get("packages", {}).values()}


def marker_applies(req: Requirement, requested_extras: set[str]) -> bool:
    if req.marker is None:
        return True
    extras_to_try = requested_extras if requested_extras else {""}
    for extra in extras_to_try:
        env = {**MARKER_ENV, "extra": extra}
        try:
            if req.marker.evaluate(env):
                return True
        except Exception as exc:
            print(
                f"[validate-bundle] WARN: marker eval failed for {req}: {exc} — "
                "treating as applicable",
                file=sys.stderr,
            )
            return True
    return False


def main() -> int:
    if not WHEELS_DIR.exists():
        print(f"[validate-bundle] ERROR: wheels dir missing: {WHEELS_DIR}", file=sys.stderr)
        return 2

    direct_extras = load_direct_extras()
    wheels = parse_all_wheels()
    bundled = {canonicalize_name(name): version for name, version, _ in wheels}
    pyodide = load_pyodide_builtins()

    errors: list[str] = []
    checked = 0

    for name, version, raw_requires in wheels:
        canonical = canonicalize_name(name)
        requested_extras = direct_extras.get(canonical, set())

        for raw in raw_requires:
            try:
                req = Requirement(raw)
            except Exception as exc:
                errors.append(f"{name}=={version}: cannot parse Requires-Dist {raw!r}: {exc}")
                continue
            if not marker_applies(req, requested_extras):
                continue

            dep_canonical = canonicalize_name(req.name)
            available_version = (
                bundled.get(dep_canonical)
                or pyodide.get(dep_canonical)
                or SHIMMED_PACKAGES.get(dep_canonical)
            )
            if available_version is None:
                errors.append(
                    f"{name}=={version}: requires {req} but no wheel, no "
                    "Pyodide built-in, and no shim provides it"
                )
                continue
            if req.specifier and not req.specifier.contains(Version(available_version), prereleases=True):
                if dep_canonical in bundled:
                    source = "bundled wheel"
                elif dep_canonical in pyodide:
                    source = "Pyodide built-in"
                else:
                    source = "shim"
                errors.append(
                    f"{name}=={version}: requires {req.name}{req.specifier} but "
                    f"{source} provides {req.name}=={available_version}"
                )
            checked += 1

    if errors:
        print(f"[validate-bundle] FAIL: {len(errors)} unsatisfied requirement(s):", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    print(f"[validate-bundle] OK: {len(bundled)} wheels, {checked} requirements satisfied")
    return 0


if __name__ == "__main__":
    sys.exit(main())
