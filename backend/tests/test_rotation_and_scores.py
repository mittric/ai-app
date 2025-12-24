from typing import Generator, List

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base, get_db
from app.main import app
from app.models.player import Player
from app.models.pairing import Pairing
from app.models.game import Game
from app.models.tournament import Tournament


TEST_DB_URL = "sqlite:///./test_rotation.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def _prepare_db():
    reset_db()
    yield
    reset_db()


client = TestClient(app)


def seed_players(names: List[str]) -> None:
    with TestingSessionLocal() as db:
        for name in names:
            db.add(Player(name=name))
        db.commit()


def test_rotation_changes_pairings_by_month():
    seed_players([f"Player {i}" for i in range(1, 9)])

    # Januar
    res_jan = client.post(
        "/api/tournaments",
        json={"name": "Januar", "year": 2025, "month": 1},
    )
    assert res_jan.status_code == 200
    jan_pairings = {(p["player1_id"], p["player2_id"]) for p in res_jan.json()["pairings"]}
    assert len(jan_pairings) == 4

    # Februar
    res_feb = client.post(
        "/api/tournaments",
        json={"name": "Februar", "year": 2025, "month": 2},
    )
    assert res_feb.status_code == 200
    feb_pairings = {(p["player1_id"], p["player2_id"]) for p in res_feb.json()["pairings"]}

    # Paarungen müssen sich unterscheiden
    assert jan_pairings != feb_pairings


def test_game_update_and_reset():
    seed_players([f"Player {i}" for i in range(1, 9)])
    res = client.post(
        "/api/tournaments",
        json={"name": "Januar", "year": 2025, "month": 1},
    )
    assert res.status_code == 200
    tournament_id = res.json()["id"]

    # Hole Spiele
    games_res = client.get(f"/api/tournaments/{tournament_id}/games")
    assert games_res.status_code == 200
    games = games_res.json()
    game_id = games[0]["id"]
    pairing1_id = games[0]["pairing1_id"]
    pairing2_id = games[0]["pairing2_id"]

    # Setze Gewinner auf pairing1
    upd_res = client.patch(f"/api/games/{game_id}", json={"winner_pairing_id": pairing1_id})
    assert upd_res.status_code == 200
    assert upd_res.json()["winner_pairing_id"] == pairing1_id

    # Reset
    reset_res = client.patch(f"/api/games/{game_id}", json={"winner_pairing_id": None})
    assert reset_res.status_code == 200
    assert reset_res.json()["winner_pairing_id"] is None

    # Falscher Gewinner
    bad_res = client.patch(f"/api/games/{game_id}", json={"winner_pairing_id": pairing2_id + 999})
    assert bad_res.status_code == 400


def test_scores_and_yearly_stats():
    seed_players([f"Player {i}" for i in range(1, 9)])
    res = client.post(
        "/api/tournaments",
        json={"name": "Januar", "year": 2025, "month": 1},
    )
    assert res.status_code == 200
    tournament_id = res.json()["id"]

    # Setze für alle Spiele pairing1 als Gewinner
    games_res = client.get(f"/api/tournaments/{tournament_id}/games")
    games = games_res.json()
    pairing_wins = {}
    for g in games:
        client.patch(f"/api/games/{g['id']}", json={"winner_pairing_id": g["pairing1_id"]})
        pairing_wins[g["pairing1_id"]] = pairing_wins.get(g["pairing1_id"], 0) + 1

    scores_res = client.get(f"/api/tournaments/{tournament_id}/scores")
    assert scores_res.status_code == 200
    scores = scores_res.json()
    # Punkte müssen der Anzahl der gewonnenen Spiele entsprechen
    for s in scores:
        expected = pairing_wins.get(s["pairing_id"], 0)
        assert s["points"] == expected

    # Jahresübersicht: Summe muss der Gesamtsumme aller Siege entsprechen
    yearly_res = client.get("/api/statistics/yearly/2025")
    assert yearly_res.status_code == 200
    total_points = sum(pairing_wins.values())
    sum_yearly = sum(player["total_points"] for player in yearly_res.json())
    # Jeder Sieg bringt beiden Spielern 1 Punkt, daher doppelt so viele Punkte wie Siege
    assert sum_yearly == total_points * 2

