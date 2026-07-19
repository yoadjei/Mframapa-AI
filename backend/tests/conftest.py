"""shared test environment — must be set before the app is imported."""

import os

# no live upstream calls during tests
os.environ.setdefault("PREWARM_ON_START", "0")
# key the suites authenticate with (matches the client fixture in test_api.py)
os.environ.setdefault("MFRAMAPA_INTERNAL_KEY", "mframapa-internal-dev-key")
