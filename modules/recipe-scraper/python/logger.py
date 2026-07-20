"""
Structured logging for the recipe-scraper Python module.

The module runs inside Chaquopy (Android) and Pyodide (iOS), where the host
app's TypeScript logger is not reachable. Logs are written to stderr with a
``[PyScraper:<LEVEL>]`` prefix so the native layer can capture and forward
them. This is the single logging entry point shared by ``scraper.py`` and the
``auth`` handlers, keeping message format consistent across the module.
"""

import sys
import traceback
from typing import Optional


# Emit DEBUG/INFO in addition to the always-on WARN/ERROR levels.
DEBUG = True


def _log(level: str, message: str) -> None:
    """Write a prefixed log line to stderr, captured by iOS/Android native code."""
    if DEBUG or level in ('ERROR', 'WARN'):
        print(f"[PyScraper:{level}] {message}", file=sys.stderr)


def _log_debug(message: str) -> None:
    """Log a DEBUG-level message (suppressed unless ``DEBUG`` is enabled)."""
    _log('DEBUG', message)


def _log_info(message: str) -> None:
    """Log an INFO-level message (suppressed unless ``DEBUG`` is enabled)."""
    _log('INFO', message)


def _log_warn(message: str) -> None:
    """Log a WARN-level message (always emitted)."""
    _log('WARN', message)


def _log_error(message: str, exc: Optional[Exception] = None) -> None:
    """Log an ERROR-level message (always emitted), plus a traceback when debugging."""
    _log('ERROR', message)
    if exc and DEBUG:
        _log('ERROR', f"Traceback:\n{traceback.format_exc()}")
