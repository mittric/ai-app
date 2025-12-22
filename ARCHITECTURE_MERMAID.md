# ai-app — Mermaid Architekturdiagramm

Die folgende Datei enthält ein Mermaid-Diagramm der Architektur. Du kannst es z.B. in einer Markdown-Datei oder im VS Code Mermaid-Preview anzeigen.

```mermaid
graph LR
  subgraph FE [Frontend]
    FEApp["React (Vite)\nFrontend"]
  end

  subgraph BE [Backend]
    BEApp["FastAPI App\n(app/main.py)"]
    APIRouters["API Routers\n(/api/players, /api/tournaments, /api/games, /api/statistics, /api/ai)"]
    Models["SQLAlchemy Models\n(players, tournaments, pairings, games, messages)"]
  end

  subgraph DB [Datenbank]
    SQLite["SQLite (app.db)\nvia SQLAlchemy"]
  end

  subgraph AI [Lokale KI]
    Ollama["Ollama (local)\n(OLLAMA_HOST)"]
  end

  subgraph Infra [Infra]
    DockerCompose["Docker / docker-compose"]
    K8s["Kubernetes Manifeste"]
  end

  FEApp -->|HTTP REST| BEApp
  BEApp --> APIRouters
  APIRouters --> Models
  Models -->|persist| SQLite
  BEApp -->|"HTTP (generate)"| Ollama
  DockerCompose --> BEApp
  DockerCompose --> FEApp
  DockerCompose --> SQLite
  K8s --> BEApp
  K8s --> FEApp

  %% Datenmodell-Beziehungen
  subgraph DataModel [Datenmodell]
    Players["players\n(id, name, created_at)"]
    Tournaments["tournaments\n(id, name, year, month)"]
    Pairings["pairings\n(id, tournament_id, player1_id, player2_id)"]
    Games["games\n(id, tournament_id, pairing1_id, pairing2_id, round_number, winner_pairing_id)"]
    Messages["messages\n(id, content, response, created_at)"]
  end

  Players -->|player1/player2| Pairings
  Tournaments -->|has| Pairings
  Pairings -->|plays| Games
  Games -->|winner refs| Pairings
  BEApp -->|stores chat| Messages

```

Hinweis: Kopiere den Mermaid-Block in eine Markdown-Datei oder öffne `ARCHITECTURE_MERMAID.md` mit einer Mermaid-Preview-Extension in VS Code, um das Diagramm visuell darzustellen.
