# Architekturübersicht — ai-app

Kurz: `ai-app` ist eine Fullstack-Anwendung zur Verwaltung eines monatlichen Kartenspiel-Turniers (8 Spieler) mit optionaler lokaler KI-Integration. Backend ist FastAPI + SQLAlchemy/SQLite, Frontend ist React (Vite). Deployment-Vorlagen für Docker / docker-compose und Kubernetes sind vorhanden.

**Komponenten**
- **Backend**: FastAPI-Anwendung (`ai-app/backend/app`) — Entrypoint: `app/main.py`.
- **API-Module**: `app/api/` — Endpunkte für Spieler, Turniere, Spiele, Statistiken, KI (`ai.py`).
- **Datenbank**: SQLite über SQLAlchemy — DB-Session und Base in `app/db/database.py`.
- **Models**: SQLAlchemy-Modelle in `app/models/` (`player.py`, `pairing.py`, `tournament.py`, `game.py`, `message.py`).
- **Frontend**: React (Vite) in `ai-app/frontend/` (`src/App.jsx`, `src/main.jsx`).
- **Infra**: `ai-app/infra/docker-compose.yml` und `ai-app/infra/k8s/` für Container / Kubernetes.

**Wichtige Dateien (Schnellreferenz)**
- **Backend Entrypoint**: `ai-app/backend/app/main.py`
- **API**: `ai-app/backend/app/api/players.py`, `tournaments.py`, `games.py`, `statistics.py`, `ai.py`
- **DB**: `ai-app/backend/app/db/database.py`
- **Models**: `ai-app/backend/app/models/*.py`
- **Frontend**: `ai-app/frontend/src/`
- **Docker / Compose**: `ai-app/backend/Dockerfile`, `ai-app/frontend/Dockerfile`, `ai-app/infra/docker-compose.yml`

**API-Endpunkte (Kurzliste)**
- **Health**: `GET /health` — Healthcheck.
- **Spieler**:
  - `POST /api/players` — Neuen Spieler anlegen (Body: `{name}`), erwartet genau 8 Spieler für Turnier-Generierung.
  - `GET /api/players` — Liste aller Spieler.
  - `GET /api/players/{player_id}` — Einzelnen Spieler holen.
  - `DELETE /api/players/{player_id}` — Spieler löschen.
- **Turniere**:
  - `POST /api/tournaments` — Neues Turnier erstellen (Body: `{name, year, month}`); erzeugt Paarungen (Round-Robin) und Spiele (jede Paarung spielt 3x gegen jede andere Paarung).
  - `GET /api/tournaments` — Alle Turniere.
  - `GET /api/tournaments/{tournament_id}` — Einzelnes Turnier mit Paarungen.
  - `GET /api/tournaments/{tournament_id}/games` — Spiele eines Turniers.
  - `GET /api/tournaments/{tournament_id}/scores` — Punktestand eines Turniers.
- **Spiele**:
  - `PATCH /api/games/{game_id}` — Ergebnis eines Spiels setzen (Body: `{winner_pairing_id}`).
- **Statistiken**:
  - `GET /api/statistics/yearly/{year}` — Jahresübersicht (Punkte pro Spieler).
  - `GET /api/statistics/player/{player_id}/yearly/{year}` — Detaillierte Jahresübersicht pro Spieler.
- **AI**:
  - `GET /api/ai/chat?message=...` — Einfacher Chat-Endpunkt, leitet an eine lokale Ollama-Instanz weiter (`OLLAMA_HOST` env var), persistiert Anfragen in `messages`.

Hinweis: Alle API-Router sind mit Prefix `/api` in `app/main.py` eingebunden.

**Datenmodell (Kurz)**
- **players** (`Player`)
  - `id`, `name` (unique), `created_at`
- **tournaments** (`Tournament`)
  - `id`, `name`, `year`, `month`, `created_at`
- **pairings** (`Pairing`)
  - `id`, `tournament_id`, `player1_id`, `player2_id`
- **games** (`Game`)
  - `id`, `tournament_id`, `pairing1_id`, `pairing2_id`, `round_number` (1-3), `winner_pairing_id` (nullable)
- **messages** (`Message`) — für AI-Chat
  - `id`, `content`, `response`, `created_at`

Beziehungen: `Pairing` referenziert zwei `Player`-Einträge; `Game` referenziert zwei `Pairing`-Einträge plus optional den Gewinner. `Tournament` hat mehrere `Pairing`-Einträge.

**Wesentliche Geschäftslogik**
- Turniererstellung erwartet genau 8 Spieler; `generate_round_robin_pairings` bildet Round-Robin-Paare und legt die ersten 4 Paarungen als aktive Paarungen für ein Monats-Turnier an.
- Für jedes Paar von Paarungen werden 3 Spiele (`round_number` 1..3) angelegt.
- Beim Setzen des Spiel-Ergebnisses (`PATCH /api/games/{id}`) wird geprüft, ob `winner_pairing_id` zu den beiden Paarungen im Spiel gehört.
- Punkte: Jeder Sieg = 1 Punkt; Turnier- und Jahres-Statistiken zählen `winner_pairing_id`-Vorkommen.

**Konfiguration & Umgebung**
- **Datenbank**: `DATABASE_URL` ist in `app/db/database.py` auf `sqlite:///./app.db` gesetzt (lokal). Für Produktion kann das ersetzt werden.
- **AI-Host**: `OLLAMA_HOST` env var default `http://localhost:11434`.
- **CORS** in `app/main.py` erlaubt `http://localhost:5173` und `5174` (Vite dev server).

**Lokales Entwickeln (Quickstart)**
- Backend (venv):
```
cd ai-app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
- Frontend (Vite):
```
cd ai-app/frontend
npm install
npm run dev
```
- Alternativ mit Docker Compose (lokal):
```
cd ai-app/infra
docker-compose up --build
```

**Tests**
- Es gibt einen Smoke-Test unter `ai-app/backend/tests/test_smoke.py`. Verwende `pytest` im Backend-Ordner, um Tests laufen zu lassen.

**Deployment-Hinweise**
- Containerize Backend + Frontend (Dockerfiles vorhanden). `infra/docker-compose.yml` orchestriert lokale Dienste.
- Für Kubernetes liegen Beispiel-Deployments/Services in `ai-app/infra/k8s/`.

**Erweiterungspunkte / Empfehlungen**
- Externe DB: Wechsel zu PostgreSQL für Produktion (anpassen `DATABASE_URL`, Create Engine). Entferne `check_same_thread`.
- Authentifizierung: derzeit keine Auth; für öffentliche Nutzung JWT/OAuth hinzufügen.
- Idempotenz & Validierung: zusätzliche Validierungen beim Anlegen / Modifizieren von Turnieren/Spielen.
- Hintergrundjobs: Bei intensiveren AI-Anfragen asynchrone Verarbeitung mit Celery / RQ.
- Tests: Weitere Unit- und Integrationstests für `tournaments`-Logik und AI-Fallbacks.

**Dateiablage**
- Architektur-Dokument: `ai-app/ARCHITECTURE.md`

---
Erstellt automatisch — bei Bedarf kann ich ein Diagramm (Mermaid) oder ein erweitertes `ARCHITECTURE.drawio`/PNG ergänzen.
