from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401 stellt sicher, dass Modelle registriert sind
from app.api.players import router as players_router
from app.api.tournaments import router as tournaments_router
from app.api.games import router as games_router
from app.api.statistics import router as statistics_router
from app.db.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kartenspiel-Turnierverwaltung API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ai-app-five-nu.vercel.app", "http://localhost:5174"],
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

