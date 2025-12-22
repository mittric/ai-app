import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import SessionLocal, Base, engine


# Clean up database before test
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_end_to_end_tournament_flow():
    # Create 8 unique test players
    created_player_ids = []
    for i in range(8):
        name = f"itest_{uuid.uuid4().hex[:8]}_{i}"
        resp = client.post("/api/players", json={"name": name})
        assert resp.status_code in (200, 201), resp.text
        body = resp.json()
        assert "id" in body
        created_player_ids.append(body["id"])

    # Create a tournament
    tour_payload = {"name": "itest tournament", "year": 2025, "month": 12}
    resp = client.post("/api/tournaments", json=tour_payload)
    assert resp.status_code == 200, resp.text
    tour = resp.json()
    assert "id" in tour
    tour_id = tour["id"]
    assert len(tour.get("pairings", [])) == 4

    # Fetch games for the tournament and expect 18 games
    resp = client.get(f"/api/tournaments/{tour_id}/games")
    assert resp.status_code == 200, resp.text
    games = resp.json()
    assert isinstance(games, list)
    assert len(games) == 18

    # Cleanup: delete tournament
    resp = client.delete(f"/api/tournaments/{tour_id}")
    assert resp.status_code == 200, resp.text

    # Cleanup: delete created players
    for pid in created_player_ids:
        resp = client.delete(f"/api/players/{pid}")
        # player may already be removed as part of tournament deletion, accept 200 or 404
        assert resp.status_code in (200, 404), resp.text
