"""Generate VAPID keys for PWA Web Push. Prints .env lines."""

from __future__ import annotations

import base64

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec


def main() -> None:
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint,
    )
    public_b64 = base64.urlsafe_b64encode(public_bytes).decode().rstrip("=")

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()

    # pywebpush accepts a PEM string; keep newlines escaped for single-line .env
    private_one_line = private_pem.replace("\n", "\\n")

    print("# Paste into .env / production secrets:")
    print(f"VAPID_PUBLIC_KEY={public_b64}")
    print(f"VAPID_PRIVATE_KEY={private_one_line}")
    print("VAPID_SUBJECT=mailto:alerts@mframapa.live")


if __name__ == "__main__":
    main()
