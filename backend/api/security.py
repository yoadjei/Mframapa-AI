import os
import time
from typing import Optional, Dict
from fastapi import Request, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader, APIKeyQuery

# Hardcoded keys for demonstration/budget constraints.
# In a real system, these would be in a DB and hashed at rest.
INTERNAL_KEY = os.getenv("MFRAMAPA_INTERNAL_KEY", "mframapa-internal-dev-key")
PUBLIC_KEY_PREFIX = "mframapa-pub-"
INSTITUTIONAL_KEY_PREFIX = "mframapa-inst-"

# Simple leaky bucket / sliding window in-memory rate limiter for public keys
# Limits: Internal -> None, Institutional -> 100/sec, Public -> 10/min
_rate_limits: Dict[str, list] = {}

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
api_key_query = APIKeyQuery(name="api_key", auto_error=False)

def get_api_key(
    api_key_header: str = Security(api_key_header),
    api_key_query: str = Security(api_key_query),
) -> str:
    key = api_key_header or api_key_query
    if not key:
        raise HTTPException(status_code=401, detail="API Key required")
    return key

def verify_and_rate_limit(key: str = Security(get_api_key)) -> str:
    """Verifies the key and enforces simple rate limits."""
    now = time.time()
    
    if key == INTERNAL_KEY:
        tier = "internal"
        limit = 1000 # 1000 per minute
    elif key.startswith(INSTITUTIONAL_KEY_PREFIX):
        tier = "institutional"
        limit = 6000 # 6000 per minute (100/sec)
    elif key.startswith(PUBLIC_KEY_PREFIX):
        tier = "public"
        limit = 10 # 10 per minute
    else:
        raise HTTPException(status_code=401, detail="Invalid API Key")

    # Clean old requests
    window = 60 # 1 minute
    if key not in _rate_limits:
        _rate_limits[key] = []
    
    _rate_limits[key] = [t for t in _rate_limits[key] if now - t < window]
    
    if len(_rate_limits[key]) >= limit:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
    _rate_limits[key].append(now)
    return tier
