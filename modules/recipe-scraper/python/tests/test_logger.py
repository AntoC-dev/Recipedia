import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import logger


class TestLogFormat:
    def test_prefixes_level(self, capsys):
        logger._log("INFO", "hello")
        assert "[PyScraper:INFO] hello" in capsys.readouterr().err


class TestDebugGating:
    def test_debug_suppressed_when_flag_off(self, capsys, monkeypatch):
        monkeypatch.setattr(logger, "DEBUG", False)
        logger._log_debug("quiet")
        logger._log_info("also quiet")
        assert capsys.readouterr().err == ""

    def test_warn_and_error_always_emit(self, capsys, monkeypatch):
        monkeypatch.setattr(logger, "DEBUG", False)
        logger._log_warn("loud warn")
        logger._log_error("loud error")
        err = capsys.readouterr().err
        assert "loud warn" in err
        assert "loud error" in err

    def test_debug_emitted_when_flag_on(self, capsys, monkeypatch):
        monkeypatch.setattr(logger, "DEBUG", True)
        logger._log_debug("verbose")
        assert "verbose" in capsys.readouterr().err


class TestErrorTraceback:
    def test_includes_traceback_when_debugging(self, capsys, monkeypatch):
        monkeypatch.setattr(logger, "DEBUG", True)
        try:
            raise ValueError("kaboom")
        except ValueError as e:
            logger._log_error("wrapped", e)
        err = capsys.readouterr().err
        assert "Traceback" in err
        assert "kaboom" in err

    def test_omits_traceback_without_exception(self, capsys, monkeypatch):
        monkeypatch.setattr(logger, "DEBUG", True)
        logger._log_error("no exc")
        assert "Traceback" not in capsys.readouterr().err
