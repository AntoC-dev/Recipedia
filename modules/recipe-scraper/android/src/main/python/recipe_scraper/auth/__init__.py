"""
Authentication handlers for recipe sites.

Each handler implements site-specific login logic.
"""

import json
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


def get_supported_auth_hosts() -> str:
    """
    Get list of hosts that support authentication.

    Returns:
        JSON string with success/error result containing list of hosts.
    """
    try:
        hosts = list(HANDLERS.keys())
        return json.dumps({
            "success": True,
            "data": hosts
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": {"type": type(e).__name__, "message": str(e)}
        }, ensure_ascii=False)
