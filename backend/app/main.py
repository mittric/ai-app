from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app import models  # noqa: F401 stellt sicher, dass Modelle registriert sind
from app.api.players import router as players_router
from app.api.tournaments import router as tournaments_router
from app.api.games import router as games_router
from app.api.statistics import router as statistics_router
from app.db.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kartenspiel-Turnierverwaltung API")

# CORS-Konfiguration: Dynamisch aus Umgebungsvariable oder Standardwerte
cors_origins_raw = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174"
)
# Trim whitespace and remove empty entries to avoid accidental mismatches
cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]

# Log the configured CORS origins at startup to make debugging easier in Render logs
print(f"Configured CORS origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players_router, prefix="/api")
app.include_router(tournaments_router, prefix="/api")
app.include_router(games_router, prefix="/api")
app.include_router(statistics_router, prefix="/api")


@app.get("/health")
def healthcheck() -> dict:
    return {"status": "ok"}

