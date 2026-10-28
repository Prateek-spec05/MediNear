# MediNear : A Calling agent for nearby health facilities.
# MediNear — ABDM Facility Locator Demo

MediNear is a small Hindi-English voice-first demonstration for locating hospitals, clinics, diagnostic centres, and pharmacies. It uses a deterministic FastAPI service and a local fixture adapter. It does **not** connect to ABHA, access health records, or call an undocumented ABDM endpoint.

## Important demo limitation

The bundled facilities are fictional and exist only to demonstrate the interface. They are **not ABDM HFR listings**, and their names, addresses, coordinates, hours, contacts, and distances must not be used to seek care. The UI labels them as synthetic. Live ABDM HFR access is not connected because no official read API credentials or reuse/export terms were supplied.

ABDM's Health Facility Registry is the intended directory for facilities. ABHA is an individual's health account/record service and is not used by this project.

## Run locally

Python 3.11 or later is recommended.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Open <http://127.0.0.1:8000>. The API description is at <http://127.0.0.1:8000/docs>.

## Voice and privacy behavior

- Search and microphone controls remain disabled until the user accepts the notice.
- The microphone uses the browser's Web Speech API when available. The browser's speech service may process audio after consent; MediNear does not receive or save the audio.
- Hindi is the default voice. Playback prefers a Hindi voice installed in the browser/device; if none is available, the page explains that text remains available.
- Search requests contain only the selected category and entered area/PIN. This app has no database, call recording, analytics, or server-side search history.
- Browser speech synthesis reads results aloud when available. Typed search remains available as a fallback.
- Emergency phrases return a fixed instruction to end the demo session and dial 112. The app does not transfer or dispatch calls.
- Search matches only the loaded local records. Results do not confirm that a facility is open, has capacity, or has a requested medicine in stock.
## Facility source boundary

`FacilitySource` is defined in `app/facility_source.py`. The initial implementation is a local JSON fixture. `MEDINEAR_FACILITY_DATA` can point to a **locally prepared, authorized, normalized JSON file** with the same top-level structure as `data/facilities.sample.json`. Keep the source and source date on every record. Do not scrape the ABDM portal or mark a record as HFR-sourced unless it was obtained through an authorized ABDM source.

Once official access is obtained, implement a separate read-only HFR adapter behind `FacilitySource`; keep ABHA and patient health records out of the locator. The app currently supports up to three matches, area/PIN text matching, and optional coordinate-based straight-line distance. The bundled Kanpur centroid and facility coordinates are synthetic and only exercise sorting in the demo.
