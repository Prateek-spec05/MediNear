from __future__ import annotations

from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class FacilityCategory(StrEnum):
    ALL = "all"
    HOSPITAL = "hospital"
    CLINIC = "clinic"
    DIAGNOSTIC_CENTER = "diagnostic_center"
    PHARMACY = "pharmacy"
    OTHER = "other"


class FacilityRecord(BaseModel):
    facility_id: str
    name: str
    name_hi: str | None = None
    category: FacilityCategory
    ownership: str | None = None
    address: str
    address_hi: str | None = None
    locality: str | None = None
    district: str | None = None
    state: str | None = None
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    phone: str | None = None
    services: list[str] = Field(default_factory=list)
    operating_hours: str | None = None
    source: str
    source_as_of: str | None = None
    record_note: str | None = None

    @model_validator(mode="after")
    def coordinates_must_be_a_pair(self) -> FacilityRecord:
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must either both be set or both be absent")
        return self


class SearchRequest(BaseModel):
    category: FacilityCategory = FacilityCategory.ALL
    location: str = Field(min_length=1, max_length=160)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    limit: int = Field(default=3, ge=1, le=3)

    @model_validator(mode="after")
    def origin_coordinates_must_be_a_pair(self) -> SearchRequest:
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must either both be set or both be absent")
        return self


class FacilityMatch(BaseModel):
    facility: FacilityRecord
    distance_km: float | None = None
    distance_label: str | None = None


class SearchResponse(BaseModel):
    data_mode: str
    location: str
    distance_basis: str
    distance_basis_hi: str
    results: list[FacilityMatch]
    message: str
    message_hi: str


class VoiceInterpretRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    language: Literal["en", "hi"] = "en"


class VoiceInterpretResponse(BaseModel):
    action: Literal["facility_search", "emergency", "medical_advice", "unclear"]
    category: FacilityCategory | None = None
    location: str | None = None
    message: str | None = None
