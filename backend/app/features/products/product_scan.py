from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ProductScanResult:
    raw_text: str
    candidates: dict[str, str | None]
    labels: list[str]


def _guess_fields_from_text(text: str) -> dict[str, str | None]:
    lines = [ln.strip() for ln in (text or "").splitlines() if ln.strip()]

    name = lines[0] if lines else None

    # price patterns: 12.90 / 12,90 / RM12.90 / $12.90
    m_price = re.search(r"(?:(RM|\$)\s*)?(\d{1,6}(?:[.,]\d{2})?)", text or "")
    currency = (m_price.group(1) if m_price else None) or None
    price = (m_price.group(2) if m_price else None)
    if price:
        price = price.replace(",", ".")

    # lightweight description: first few lines
    description = " ".join(lines[:3]) if lines else None

    return {
        "name": name,
        "price": price,
        "currency": currency,
        "description": description,
    }


class VisionProductScanner:
    """Google Cloud Vision based product scanner.

    Notes:
    - The Vision client is created lazily to avoid crashing app startup when
      credentials aren't configured (e.g., CI/tests).
    - Credential resolution uses standard GOOGLE_APPLICATION_CREDENTIALS.
    """

    def __init__(self) -> None:
        self._client: Any | None = None

    def _get_client(self):
        if self._client is None:
            # Import lazily so environments without this dependency (or without
            # configured creds) won't error until the feature is used.
            from google.cloud import vision

            self._client = vision.ImageAnnotatorClient()
        return self._client

    def scan(self, image_bytes: bytes) -> ProductScanResult:
        if not image_bytes:
            raise ValueError("Empty image")

        # Optional: allow feature-gating via env
        enabled = os.getenv("VISION_ENABLED", "").strip().lower()
        if enabled in {"0", "false", "no", "off"}:
            raise RuntimeError("Vision scan disabled (VISION_ENABLED=false)")

        from google.cloud import vision

        client = self._get_client()
        image = vision.Image(content=image_bytes)

        resp = client.annotate_image(
            {
                "image": image,
                "features": [
                    {"type_": vision.Feature.Type.TEXT_DETECTION},
                    {"type_": vision.Feature.Type.LABEL_DETECTION, "max_results": 10},
                ],
            }
        )

        if resp.error and resp.error.message:
            raise RuntimeError(resp.error.message)

        raw_text = ""
        if resp.text_annotations:
            raw_text = resp.text_annotations[0].description or ""

        labels = [lb.description for lb in (resp.label_annotations or []) if lb.description]
        candidates = _guess_fields_from_text(raw_text)

        return ProductScanResult(raw_text=raw_text, candidates=candidates, labels=labels)
