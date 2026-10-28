from __future__ import annotations

import json
import math
import os
import re
from pathlib import Path
from typing import Protocol

from app.models import (
    FacilityCategory,
    FacilityMatch,
    FacilityRecord,
    SearchRequest,
    SearchResponse,
)


DATA_FILE = Path(
    os.environ.get(
        "MEDINEAR_FACILITY_DATA",
        str(Path(__file__).resolve().parents[1] / "data" / "facilities.sample.json"),
    )
)


class FacilitySource(Protocol):
    """Read-only source boundary. A live ABDM connector can be added after access is approved."""

    def search(self, request: SearchRequest) -> SearchResponse: ...


def _normalize(value: str) -> str:
    return re.sub(r"[^\w\s]", " ", value.casefold(), flags=re.UNICODE).strip()


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    value = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    return 2 * radius_km * math.asin(math.sqrt(value))


class FixtureFacilitySource:
    """Loads a local normalized fixture. It makes no network calls and persists no searches."""

    def __init__(self, path: Path = DATA_FILE) -> None:
        payload = json.loads(path.read_text(encoding="utf-8"))
        self.data_mode = str(payload.get("data_mode", "synthetic_demo"))
        self.dataset_note = str(payload.get("dataset_note", ""))
        self._origins = payload.get("demo_origins", [])
        self.facilities = [FacilityRecord.model_validate(row) for row in payload.get("facilities", [])]

    def _resolve_demo_origin(self, query: str) -> tuple[float, float] | None:
        normalized = _normalize(query)
        for origin in self._origins:
            aliases = [origin.get("label", ""), *origin.get("aliases", [])]
            if any(_normalize(alias) and _normalize(alias) in normalized for alias in aliases):
                return float(origin["latitude"]), float(origin["longitude"])
        return None

    def search(self, request: SearchRequest) -> SearchResponse:
        query = _normalize(request.location)
        tokens = {token for token in query.split() if len(token) > 1}
        if not tokens:
            return SearchResponse(
                data_mode=self.data_mode,
                location=request.location,
                distance_basis="No usable location was provided.",
                distance_basis_hi="इलाके का नाम या पिन कोड दर्ज करें।",
                results=[],
                message="Enter an area name or PIN code.",
                message_hi="इलाके का नाम या पिन कोड दर्ज करें।",
            )

        origin = (
            (request.latitude, request.longitude)
            if request.latitude is not None and request.longitude is not None
            else self._resolve_demo_origin(request.location)
        )

        candidates: list[tuple[float, int, FacilityRecord]] = []
        for record in self.facilities:
            if request.category != FacilityCategory.ALL and record.category != request.category:
                continue

            searchable = _normalize(
                " ".join(
                    part
                    for part in (
                        record.name,
                        record.address,
                        record.locality or "",
                        record.district or "",
                        record.state or "",
                        record.pincode or "",
                    )
                    if part
                )
            )
            score = sum(1 for token in tokens if token in searchable)
            if score == 0:
                continue

            distance: float | None = None
            if origin and record.latitude is not None and record.longitude is not None:
                distance = _haversine_km(*origin, record.latitude, record.longitude)
            candidates.append((distance if distance is not None else float("inf"), -score, record))

        candidates.sort(key=lambda item: (item[0], item[1], item[2].name.casefold()))
        results = [
            FacilityMatch(
                facility=record,
                distance_km=round(distance, 2) if math.isfinite(distance) else None,
                distance_label=(
                    f"about {distance:.1f} km, straight-line estimate"
                    if math.isfinite(distance)
                    else None
                ),
            )
            for distance, _score, record in candidates[: request.limit]
        ]

        if request.latitude is not None and request.longitude is not None:
            basis = "Approximate straight-line distance from coordinates you provided; not road distance."
            basis_hi = "आपके दिए स्थान से सीधी दूरी का अनुमान; सड़क की दूरी नहीं।"
        elif origin:
            basis = "Approximate straight-line distance from a demo area centroid; not road distance."
            basis_hi = "डेमो इलाके के अनुमानित केंद्र से सीधी दूरी; सड़क की दूरी नहीं।"
        else:
            basis = "Area/PIN text match only; distance is unavailable for this location."
            basis_hi = "इलाके या पिन कोड के आधार पर मिलान; दूरी उपलब्ध नहीं है।"

        if results and self.data_mode == "synthetic_demo":
            message = "These are fictional demo records, not real facilities. Do not use them for care or travel."
            message_hi = "ये काल्पनिक डेमो रिकॉर्ड हैं, असली सुविधाएँ नहीं। इलाज या यात्रा के लिए इनका उपयोग न करें।"
        elif results:
            message = "Directory matches only. Call the facility to confirm details before travel."
            message_hi = "ये केवल डायरेक्टरी में मिले रिकॉर्ड हैं। जाने से पहले सुविधा को फोन करके जानकारी की पुष्टि करें।"
        else:
            message = "No matching records. Try another area or facility category."
            message_hi = "कोई रिकॉर्ड नहीं मिला। दूसरा इलाका या सुविधा का प्रकार आज़माएँ।"
        return SearchResponse(
            data_mode=self.data_mode,
            location=request.location,
            distance_basis=basis,
            distance_basis_hi=basis_hi,
            results=results,
            message=message,
            message_hi=message_hi,
        )


fixture_source = FixtureFacilitySource()
