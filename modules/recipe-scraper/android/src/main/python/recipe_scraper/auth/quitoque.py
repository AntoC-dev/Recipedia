"""Login handler for Quitoque (quitoque.fr)."""

from bs4 import BeautifulSoup
from requests import Session

from .base import LoginHandler


class QuitoqueLoginHandler(LoginHandler):
    """Handler for quitoque.fr authentication."""

    def get_host(self) -> str:
        return "quitoque.fr"

    def get_login_url(self) -> str:
        return "https://www.quitoque.fr/login"

    def login(self, session: Session, username: str, password: str) -> bool:
        """
        Login to Quitoque using form POST with CSRF token.

        Quitoque uses a standard form-based login:
        - GET /login to get CSRF token
        - POST /login-check with credentials
        """
        try:
            login_page = session.get(self.get_login_url(), timeout=30)
            login_page.raise_for_status()

            soup = BeautifulSoup(login_page.text, 'html.parser')
            csrf_input = soup.find('input', {'name': '_csrf_shop_security_token'})
            if not csrf_input:
                return False

            csrf_token = csrf_input.get('value', '')

            login_data = {
                '_username': username,
                '_password': password,
                '_csrf_shop_security_token': csrf_token,
            }

            response = session.post(
                'https://www.quitoque.fr/login-check',
                data=login_data,
                allow_redirects=True,
                timeout=30
            )

            return '/login' not in response.url and response.status_code == 200
        except Exception:
            return False
