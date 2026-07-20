"""the runtime deps auth needs must be declared, not inherited from a dev venv.

a missing jwt library does not crash: verify_supabase_jwt just returns None, so
every signed-in user silently degrades to anonymous in production while working
perfectly on the developer's machine. these tests make that failure loud.
"""

import pathlib
import re

import pytest

REQUIREMENTS = pathlib.Path(__file__).resolve().parents[2] / "requirements.txt"


def _declared() -> str:
    return REQUIREMENTS.read_text(encoding="utf-8").lower()


def test_jwt_library_is_declared():
    assert re.search(r"^pyjwt", _declared(), re.M), (
        "PyJWT is imported by backend/api/auth.py but not declared, so the "
        "container image will not install it"
    )


def test_jwt_crypto_extra_is_declared():
    """ES256 verification needs cryptography; without it JWKS decoding fails."""
    text = _declared()
    assert "pyjwt[crypto]" in text or re.search(r"^cryptography", text, re.M)


def test_auth_module_actually_loaded_jwt():
    """catches the silent-degradation path in the environment under test."""
    from backend.api import auth

    assert auth._jwt is not None, "auth loaded without a jwt library — tokens would be ignored"


def test_es256_is_supported_by_the_installed_jwt():
    """pyjwt without the crypto extra imports fine but cannot verify ES256."""
    jwt = pytest.importorskip("jwt")
    from cryptography.hazmat.primitives.asymmetric import ec  # noqa: F401

    assert "ES256" in jwt.algorithms.get_default_algorithms()


def test_health_reports_auth_capability():
    """the deploy has to be verifiable from outside the container."""
    from fastapi.testclient import TestClient

    from backend.api.app import app

    body = TestClient(app).get("/api/v1/health").json()
    assert body["auth"] is True
