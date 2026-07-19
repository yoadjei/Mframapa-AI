"""issue and revoke api keys for api customers.

run where redis is reachable — easiest is inside the api container:

    docker compose exec api python scripts/api_key.py issue --tier institutional --label "acme corp"
    docker compose exec api python scripts/api_key.py revoke mframapa-inst-xxxxx

app users don't need keys — they authenticate with their supabase session.
"""

from __future__ import annotations

import argparse
import sys

from backend.api.auth import issue_api_key, revoke_api_key, tier_for_api_key


def main() -> int:
    parser = argparse.ArgumentParser(description="manage mframapa api keys")
    sub = parser.add_subparsers(dest="command", required=True)

    p_issue = sub.add_parser("issue", help="mint a new key")
    p_issue.add_argument("--tier", required=True, choices=["free", "researcher", "institutional"])
    p_issue.add_argument("--label", default="", help="who it's for (stored with the key)")

    p_revoke = sub.add_parser("revoke", help="deactivate a key")
    p_revoke.add_argument("key")

    p_check = sub.add_parser("check", help="show a key's tier, if active")
    p_check.add_argument("key")

    args = parser.parse_args()

    if args.command == "issue":
        try:
            key = issue_api_key(args.tier, args.label)
        except (RuntimeError, ValueError) as e:
            print(f"error: {e}", file=sys.stderr)
            return 1
        print(key)
        print("store it now — it is not recoverable from the registry.", file=sys.stderr)
        return 0

    if args.command == "revoke":
        ok = revoke_api_key(args.key)
        print("revoked" if ok else "not found (or redis unavailable)")
        return 0 if ok else 1

    tier = tier_for_api_key(args.key)
    print(tier or "invalid/revoked")
    return 0 if tier else 1


if __name__ == "__main__":
    raise SystemExit(main())
