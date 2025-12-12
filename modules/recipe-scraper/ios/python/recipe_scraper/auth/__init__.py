"""
Authentication handlers for recipe sites.

Each handler implements site-specific login logic.
"""

from typing import Optional
from .base import LoginHandler
from .quitoque import QuitoqueLoginHandler


HANDLERS = {
    'quitoque.fr': QuitoqueLoginHandler,
}


def get_handler(host: str) -> Optional[LoginHandler]:
    """Get login handler for a host, or None if not supported."""
    host_lower = host.lower().replace('www.', '')
    handler_class = HANDLERS.get(host_lower)
    if handler_class:
        return handler_class()
    return None


def get_supported_auth_hosts() -> list:
    """Get list of hosts that support authentication."""
    return list(HANDLERS.keys())
