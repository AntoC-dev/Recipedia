"""Base class for login handlers."""

from abc import ABC, abstractmethod
from requests import Session


class LoginHandler(ABC):
    """Abstract base class for site-specific login handlers."""

    @abstractmethod
    def login(self, session: Session, username: str, password: str) -> bool:
        """
        Authenticate with the site.

        Args:
            session: Requests session to use for login.
            username: User's username or email.
            password: User's password.

        Returns:
            True if login succeeded, False otherwise.
        """
        pass

    @abstractmethod
    def get_host(self) -> str:
        """Get the host this handler is for."""
        pass

    @abstractmethod
    def get_login_url(self) -> str:
        """Get the login page URL."""
        pass
