from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.facility_source import fixture_source
from app.models import SearchRequest, SearchResponse, VoiceInterpretRequest, VoiceInterpretResponse
from app.voice import interpret_voice


ROOT = Path(__file__).resolve().parents[1]
app = FastAPI(
    title="MediNear Demo API",
    description="Consent-gated voice demo backed by a local facility fixture. No live HFR API is connected.",
    version="0.1.0",
)
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(ROOT / "static" / "index.html")


@app.get("/api/health")
def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "data_mode": fixture_source.data_mode,
        "dataset_note": fixture_source.dataset_note,
        "live_hfr_connected": False,
        "recording_enabled": False,
    }


@app.post("/api/facilities/search", response_model=SearchResponse)
def search_facilities(request: SearchRequest) -> SearchResponse:
    return fixture_source.search(request)


@app.post("/api/voice/interpret", response_model=VoiceInterpretResponse)
def interpret(request: VoiceInterpretRequest) -> VoiceInterpretResponse:
    return interpret_voice(request.text, request.language)
