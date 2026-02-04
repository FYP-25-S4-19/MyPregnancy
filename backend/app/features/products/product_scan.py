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
    raw_lines = [re.sub(r"\s+", " ", ln).strip() for ln in (text or "").splitlines()]

    def is_barcode_like(s: str) -> bool:
        digits = re.sub(r"\D", "", s)
        return len(digits) >= 10 and digits == digits.strip()

    def is_price_like(s: str) -> bool:
        return bool(re.fullmatch(r"(?:(?:RM|\$)\s*)?\d{1,6}(?:[.,]\d{2})?", s.strip(), flags=re.IGNORECASE))

    def is_noise(s: str) -> bool:
        s = (s or "").strip()
        if not s:
            return True
        if len(s) <= 2:
            return True
        if is_barcode_like(s):
            return True
        if is_price_like(s):
            return True
        # mostly punctuation
        if len(re.sub(r"[\W_]", "", s)) <= 1:
            return True
        return False

    # Keep unique, informative lines in order.
    lines: list[str] = []
    seen: set[str] = set()
    for ln in raw_lines:
        if is_noise(ln):
            continue
        key = ln.lower()
        if key in seen:
            continue
        seen.add(key)
        lines.append(ln)

    # Pick a reasonable name: first line with letters and not too long.
    name: str | None = None
    for ln in lines:
        if re.search(r"[A-Za-z]", ln) and len(ln) <= 80:
            name = ln
            break
    if name is None and lines:
        name = lines[0]

    # price patterns: 12.90 / 12,90 / RM12.90 / $12.90
    m_price = re.search(r"(?:(RM|\$)\s*)?(\d{1,6}(?:[.,]\d{2})?)", text or "")
    currency = (m_price.group(1) if m_price else None) or None
    price = (m_price.group(2) if m_price else None)
    if price:
        price = price.replace(",", ".")

    # Richer description: include more informative lines (but keep it bounded).
    # Prefer lines that contain letters.
    descriptive_lines = [ln for ln in lines if re.search(r"[A-Za-z]", ln)]
    if not descriptive_lines:
        descriptive_lines = lines

    # Drop the name from description if it's identical (common on packaging)
    if name:
        descriptive_lines = [ln for ln in descriptive_lines if ln.strip().lower() != name.strip().lower()]

    # Join as multi-sentence text. Keep short enough for UI.
    description: str | None = None
    if descriptive_lines:
        joined = "; ".join(descriptive_lines[:8])
        description = joined[:500]

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
