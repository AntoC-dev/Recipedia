import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from auth import get_handler, get_supported_auth_hosts
from auth.quitoque import QuitoqueLoginHandler


class FakeResponse:
    def __init__(self, text):
        self.text = text

    def raise_for_status(self):
        return None


class FakeSession:
    def __init__(self, get_text="", get_exc=None):
        self._get_text = get_text
        self._get_exc = get_exc

    def get(self, url, **kwargs):
        if self._get_exc is not None:
            raise self._get_exc
        return FakeResponse(self._get_text)


class TestGetHandler:
    def test_resolves_known_host(self):
        assert isinstance(get_handler("quitoque.fr"), QuitoqueLoginHandler)

    def test_strips_www_prefix(self):
        assert isinstance(get_handler("www.quitoque.fr"), QuitoqueLoginHandler)

    def test_unknown_host_returns_none(self):
        assert get_handler("example.com") is None

    def test_logs_when_resolved(self, capsys):
        get_handler("quitoque.fr")
        captured = capsys.readouterr()
        assert "Auth handler resolved" in captured.err

    def test_logs_when_missing(self, capsys):
        get_handler("example.com")
        captured = capsys.readouterr()
        assert "No auth handler" in captured.err


class TestSupportedAuthHosts:
    def test_includes_quitoque(self):
        assert "quitoque.fr" in get_supported_auth_hosts()


class TestQuitoqueLogin:
    def test_missing_csrf_returns_false_and_warns(self, capsys):
        handler = QuitoqueLoginHandler()
        result = handler.login(FakeSession(get_text="<html><body>no token</body></html>"), "u", "p")
        captured = capsys.readouterr()
        assert result is False
        assert "CSRF token input not found" in captured.err

    def test_exception_returns_false_and_logs_error(self, capsys):
        handler = QuitoqueLoginHandler()
        result = handler.login(FakeSession(get_exc=RuntimeError("network down")), "u", "p")
        captured = capsys.readouterr()
        assert result is False
        assert "Quitoque login failed" in captured.err
        assert "network down" in captured.err

    def test_host_and_login_url(self):
        handler = QuitoqueLoginHandler()
        assert handler.get_host() == "quitoque.fr"
        assert handler.get_login_url().startswith("https://")
