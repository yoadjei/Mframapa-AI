"""
expo push delivery.

batches messages (expo caps at 100 per request) and posts to the expo push api.
the transport is injectable so callers/tests can supply a fake sender.
"""

import logging
from typing import Any, Callable, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
_BATCH_SIZE = 100
_TIMEOUT = 10.0


def build_messages(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    return [
        {"to": t, "title": title, "body": body, "sound": "default", "data": data or {}}
        for t in tokens
    ]


def _chunks(items: List[Any], size: int):
    for i in range(0, len(items), size):
        yield items[i:i + size]


def send_push(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
    *,
    post: Optional[Callable[[str, List[Dict[str, Any]]], Any]] = None,
) -> Dict[str, int]:
    # send to all tokens in batches; returns {sent, batches, failed}.
    messages = build_messages(tokens, title, body, data)
    if not messages:
        return {"sent": 0, "batches": 0, "failed": 0}

    sender = post or _http_post
    sent = failed = batches = 0
    for chunk in _chunks(messages, _BATCH_SIZE):
        batches += 1
        try:
            sender(EXPO_PUSH_URL, chunk)
            sent += len(chunk)
        except Exception as e:
            failed += len(chunk)
            logger.warning("push: batch failed (%d tokens) — %s", len(chunk), e)
    return {"sent": sent, "batches": batches, "failed": failed}


def _http_post(url: str, messages: List[Dict[str, Any]]) -> None:
    r = httpx.post(url, json=messages, timeout=_TIMEOUT)
    r.raise_for_status()
