#!/usr/bin/env python3
"""Pre-launch readiness checks (local + optional live prod).

Usage:
  python scripts/launch_checks.py
  python scripts/launch_checks.py --prod
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _ok(msg: str) -> None:
    print(f"  OK  {msg}")


def _fail(msg: str) -> None:
    print(f" FAIL {msg}")


def _warn(msg: str) -> None:
    print(f" WARN {msg}")


def _load_dotenv() -> dict[str, str | None]:
    try:
        from dotenv import dotenv_values
    except ImportError:
        return {}
    return dict(dotenv_values(ROOT / ".env"))


def check_dotenv_parse() -> bool:
    print("\n[env]")
    env_path = ROOT / ".env"
    if not env_path.exists():
        _fail(".env missing")
        return False
    # Detect bare non-KEY=value lines that break python-dotenv
    bad = []
    for i, line in enumerate(env_path.read_text(encoding="utf-8").splitlines(), 1):
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        if "=" not in s:
            bad.append(i)
    if bad:
        _fail(f".env has non KEY=value line(s): {bad}")
        return False
    vals = _load_dotenv()
    _ok(".env parses as KEY=value")
    for key in ("VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"):
        if vals.get(key):
            _ok(f"{key} set")
        else:
            _fail(f"{key} missing")
            return False
    priv = vals.get("VAPID_PRIVATE_KEY") or ""
    if "\n" in priv and "\\n" not in priv.replace("\n", ""):
        # real newlines in value — dotenv may have already split; check file line count for key
        pass
    if "BEGIN PRIVATE KEY" in priv and "\\n" not in priv and "\n" not in priv:
        _warn("VAPID_PRIVATE_KEY has no \\n escapes — may still work if PEM is one line")
    alerts = vals.get("ALERTS_ENABLED", "0")
    if alerts == "1":
        _ok("ALERTS_ENABLED=1")
    else:
        _warn("ALERTS_ENABLED is not 1 (required on production for daily pushes)")
    prewarm = vals.get("PREWARM_ON_START", "1")
    if prewarm == "0":
        _ok("PREWARM_ON_START=0 (good for local)")
    return True


def check_pywebpush() -> bool:
    print("\n[python deps]")
    if importlib.util.find_spec("pywebpush") is None:
        _fail("pywebpush not installed — pip install -r requirements.txt")
        return False
    _ok("pywebpush importable")
    return True


def check_repo_files() -> bool:
    print("\n[repo]")
    ok = True
    paths = [
        ROOT / "docs" / "deployment" / "STORE_SUBMISSION.md",
        ROOT / "frontend-pwa" / "twa.config.json",
        ROOT / "frontend-pwa" / "public" / ".well-known" / "assetlinks.json",
        ROOT / "frontend-pwa" / "public" / "sw-push.js",
        ROOT / "frontend-pwa" / "src" / "services" / "webPush.js",
        ROOT / "mobile" / "eas.json",
        ROOT / "mobile" / "app.config.js",
    ]
    for p in paths:
        if p.exists():
            _ok(str(p.relative_to(ROOT)))
        else:
            _fail(f"missing {p.relative_to(ROOT)}")
            ok = False
    twa = json.loads((ROOT / "frontend-pwa" / "twa.config.json").read_text(encoding="utf-8"))
    if twa.get("host") == "mframapa.live":
        _ok("TWA host = mframapa.live")
    else:
        _fail(f"TWA host is {twa.get('host')!r}, expected mframapa.live")
        ok = False
    links = json.loads(
        (ROOT / "frontend-pwa" / "public" / ".well-known" / "assetlinks.json").read_text(
            encoding="utf-8"
        )
    )
    fp = links[0]["target"]["sha256_cert_fingerprints"][0]
    if "REPLACE" in fp:
        _warn("assetlinks.json still has placeholder SHA-256 (fill after Bubblewrap)")
    else:
        _ok("assetlinks.json has a real fingerprint")
    return ok


def _http_json(url: str, timeout: float = 12.0) -> tuple[int, dict | None]:
    # Browser-like UA — some CDNs/WAFs return 403 to the default Python-urllib agent.
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "MframapaLaunchChecks/1.0 (+https://mframapa.live)",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read().decode())
            return resp.status, body
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode())
        except Exception:
            body = None
        return e.code, body
    except Exception:
        return 0, None


def check_local_api() -> bool:
    print("\n[local api :8000]")
    status, body = _http_json("http://127.0.0.1:8000/api/v1/vapid-public-key")
    if status == 0:
        _warn("API not reachable on :8000 (start uvicorn to verify live)")
        return True
    if status == 200 and body and body.get("configured"):
        _ok(f"vapid-public-key configured (key starts {str(body.get('publicKey', ''))[:12]}…)")
        return True
    if status == 503:
        _fail("vapid-public-key 503 — VAPID env not loaded in running process")
        return False
    _fail(f"vapid-public-key unexpected status {status}")
    return False


def check_prod_api() -> bool:
    print("\n[prod api.mframapa.live]")
    status, body = _http_json("https://api.mframapa.live/api/v1/health")
    if status == 0:
        _fail("could not reach host (DNS/TLS/firewall/timeout)")
        return False
    if status == 403:
        _fail("health 403 — WAF/CDN blocking; try from a browser or allowlist this host")
        return False
    if status == 200:
        _ok("health ok")
    else:
        _fail(f"health status {status}")
        return False
    status, body = _http_json("https://api.mframapa.live/api/v1/vapid-public-key")
    if status == 200 and body and body.get("configured"):
        _ok("vapid-public-key configured")
        return True
    if status == 404:
        _fail("vapid-public-key 404 — deploy backend with Web Push route")
        return False
    if status == 503:
        _fail("vapid-public-key 503 — set VAPID_* on the server and recreate container")
        return False
    _fail(f"vapid-public-key status {status}")
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Mframapa launch readiness checks")
    parser.add_argument("--prod", action="store_true", help="Also hit api.mframapa.live")
    args = parser.parse_args()
    os.chdir(ROOT)

    print("Mframapa launch checks")
    results = [
        check_dotenv_parse(),
        check_pywebpush(),
        check_repo_files(),
        check_local_api(),
    ]
    if args.prod:
        results.append(check_prod_api())

    print()
    if all(results):
        print("All required checks passed.")
        return 0
    print("Some checks failed — fix FAIL lines above.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
