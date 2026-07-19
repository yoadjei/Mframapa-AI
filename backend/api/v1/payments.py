"""paystack webhook — the source of truth for subscription tiers.

paystack calls this endpoint directly, so it cannot present one of our api keys.
it is authenticated instead by verifying paystack's HMAC-SHA512 signature over the
raw request body, which only someone holding our secret key can produce.

a successful charge promotes the user's tier in supabase app_metadata; a cancelled
or failed subscription demotes them back to free. the client is never trusted for
any of this.

    POST /api/v1/payments/paystack/webhook
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Request

from backend.api.supabase_admin import find_user_id_by_email, set_user_tier

logger = logging.getLogger(__name__)

payments_router = APIRouter(prefix="/payments", tags=["payments"])

# plan id (sent in checkout metadata) -> tier granted
_PLAN_TIERS: Dict[str, str] = {
    "researcher_monthly": "researcher",
    "researcher_annual": "researcher",
}

# events that revoke access
_DOWNGRADE_EVENTS = {
    "subscription.disable",
    "subscription.not_renew",
    "invoice.payment_failed",
}


def _verify_signature(raw_body: bytes, signature: Optional[str]) -> bool:
    secret = os.getenv("PAYSTACK_SECRET_KEY")
    if not secret or not signature:
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(expected, signature)


def _resolve_user_id(data: Dict[str, Any]) -> Optional[str]:
    """prefer the supabase user id carried in checkout metadata; fall back to email."""
    metadata = data.get("metadata") or {}
    if isinstance(metadata, dict):
        user_id = metadata.get("user_id") or metadata.get("supabase_user_id")
        if user_id:
            return str(user_id)

    email = (data.get("customer") or {}).get("email")
    return find_user_id_by_email(email) if email else None


def _tier_for_plan(data: Dict[str, Any]) -> Optional[str]:
    metadata = data.get("metadata") or {}
    plan_id = metadata.get("plan_id") if isinstance(metadata, dict) else None
    if not plan_id:
        plan = data.get("plan")
        plan_id = plan.get("plan_code") if isinstance(plan, dict) else plan
    return _PLAN_TIERS.get(str(plan_id)) if plan_id else None


@payments_router.post("/paystack/webhook")
async def paystack_webhook(request: Request) -> Dict[str, str]:
    raw = await request.body()
    if not _verify_signature(raw, request.headers.get("x-paystack-signature")):
        # don't leak whether the secret is unset vs the signature being wrong
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed payload")

    event = payload.get("event", "")
    data = payload.get("data") or {}

    if event in _DOWNGRADE_EVENTS:
        user_id = _resolve_user_id(data)
        if user_id:
            set_user_tier(user_id, "free")
            logger.info("paystack %s -> downgraded %s to free", event, user_id)
        return {"status": "ok"}

    if event != "charge.success":
        return {"status": "ignored"}          # ack unhandled events so paystack stops retrying

    if data.get("status") != "success":
        return {"status": "ignored"}

    tier = _tier_for_plan(data)
    if tier is None:
        logger.warning("paystack charge.success with unknown plan: %s", data.get("metadata"))
        return {"status": "ignored"}

    user_id = _resolve_user_id(data)
    if not user_id:
        logger.error("paystack charge.success but no supabase user resolved: %s",
                     (data.get("customer") or {}).get("email"))
        return {"status": "ignored"}

    if not set_user_tier(user_id, tier):
        # 500 makes paystack retry, which is what we want for a transient failure
        raise HTTPException(status_code=500, detail="Could not apply subscription")

    logger.info("paystack charge.success -> %s upgraded to %s", user_id, tier)
    return {"status": "ok"}
