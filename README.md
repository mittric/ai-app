# Kartenspiel-Turnierverwaltung

Eine vollständige Anwendung zur Verwaltung eines monatlichen Kartenspiel-Turniers für 8 Spieler.

## Funktionen

- **Spieler-Verwaltung**: Erfassung und Verwaltung der 8 Spieler
- **Turnier-Verwaltung**: Erstellung monatlicher Turniere mit automatischer Paarungsgenerierung (Round-Robin)
- **Spiel-Erfassung**: Erfassung der Spielergebnisse und automatische Punkteberechnung
- **Jahresübersicht**: Gesamtpunktestand über das gesamte Jahr mit detaillierten Statistiken

## Technologien

- **Backend**: FastAPI (Python) mit SQLite (SQLAlchemy)
- **Frontend**: React (Vite)
- **Container**: Docker + docker-compose

## Setup

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Verwendung

1. **Spieler hinzufügen**: Füge genau 8 Spieler hinzu
2. **Turnier erstellen**: Erstelle ein neues Turnier für einen Monat (Paarungen werden automatisch generiert)
3. **Spiele erfassen**: Trage die Ergebnisse der Spiele ein (jede Paarung spielt 3 mal gegen jede andere)
4. **Übersichten**: Sieh dir die Punktestände pro Turnier und die Jahresübersicht an

## API-Endpunkte

- `GET/POST /api/players` - Spieler-Verwaltung
- `GET/POST /api/tournaments` - Turnier-Verwaltung
- `GET /api/tournaments/{id}/games` - Spiele eines Turniers
- `PATCH /api/games/{id}` - Spielergebnis aktualisieren
- `GET /api/tournaments/{id}/scores` - Punktestand eines Turniers
- `GET /api/statistics/yearly/{year}` - Jahresübersicht
- `GET /api/statistics/player/{id}/yearly/{year}` - Spielerdetails

## Spielregeln

- 8 Spieler werden in 4 Zweiergruppen (Paarungen) eingeteilt
- Die Paarungen rotieren jeden Monat (Round-Robin-System über 7 Monate, jeder Partner einmal)
- Jede Paarung spielt 3 mal gegen jede andere Paarung (9 Spiele pro Paarung)
- Jeder Sieg gibt 1 Punkt
- Am Ende des Jahres werden alle Punkte zusammengezählt
