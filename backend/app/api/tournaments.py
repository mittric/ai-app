from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.player import Player
from app.models.tournament import Tournament
from app.models.pairing import Pairing
from app.models.game import Game

router = APIRouter()


class TournamentCreate(BaseModel):
    name: str
    year: int
    month: int


class PairingResponse(BaseModel):
    id: int
    player1_id: int
    player1_name: str
    player2_id: int
    player2_name: str

    class Config:
        from_attributes = True


class TournamentResponse(BaseModel):
    id: int
    name: str
    year: int
    month: int
    pairings: List[PairingResponse]

    class Config:
        from_attributes = True


def generate_pairing_rounds(player_ids: List[int]) -> List[List[tuple]]:
    """
    Generiert 7 Runden mit je 4 disjunkten Paarungen (Round-Robin für Partner),
    so dass über 7 Monate jede Paarung genau einmal vorkommt.
    """
    if len(player_ids) != 8:
        raise ValueError("Es müssen genau 8 Spieler vorhanden sein.")
    
    # Stabil sortieren für deterministische Ergebnisse
    players = sorted(player_ids)
    n = len(players)
    rounds: List[List[tuple]] = []

    # Circle-Method für Partner-Round-Robin (nicht Matches)
    for _ in range(n - 1):  # 7 Runden
        round_pairs: List[tuple] = []
        for i in range(n // 2):
            p1 = players[i]
            p2 = players[n - 1 - i]
            pair = (min(p1, p2), max(p1, p2))
            round_pairs.append(pair)
        rounds.append(round_pairs)
        # Rotation (fixiere den ersten)
        players = [players[0]] + [players[-1]] + players[1:-1]

    return rounds


def select_round_for_month(player_ids: List[int], year: int, month: int) -> List[tuple]:
    """
    Wählt basierend auf Monat eine der 7 vorberechneten Runden (0-basiert).
    Monat 1 → Runde 0, Monat 2 → Runde 1, ... Monat 7 → Runde 6, Monat 8 → wieder Runde 0, etc.
    """
    rounds = generate_pairing_rounds(player_ids)
    round_index = (month - 1) % len(rounds)
    return rounds[round_index]


@router.post("/tournaments", response_model=TournamentResponse)
def create_tournament(tournament: TournamentCreate, db: Session = Depends(get_db)):
    """Erstellt ein neues Turnier mit automatischen Paarungen."""
    # Prüfe, ob Turnier für diesen Monat bereits existiert
    existing = db.query(Tournament).filter(
        Tournament.year == tournament.year,
        Tournament.month == tournament.month
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Turnier für {tournament.month}/{tournament.year} existiert bereits."
        )
    
    # Prüfe, ob genau 8 Spieler vorhanden sind
    players = db.query(Player).all()
    if len(players) != 8:
        raise HTTPException(
            status_code=400,
            detail=f"Es müssen genau 8 Spieler vorhanden sein. Aktuell: {len(players)}"
        )
    
    # Erstelle Turnier
    new_tournament = Tournament(
        name=tournament.name,
        year=tournament.year,
        month=tournament.month
    )
    db.add(new_tournament)
    db.flush()
    
    # Generiere Paarungen für den Monat (rotierend)
    player_ids = [p.id for p in players]
    selected_pairs = select_round_for_month(player_ids, tournament.year, tournament.month)

    created_pairings = []
    for p1_id, p2_id in selected_pairs:
        pairing = Pairing(
            tournament_id=new_tournament.id,
            player1_id=p1_id,
            player2_id=p2_id
        )
        db.add(pairing)
        created_pairings.append(pairing)
    
    db.flush()
    
    # Erstelle alle Spiele: Jede Paarung spielt 3 mal gegen jede andere Paarung
    for i, pairing1 in enumerate(created_pairings):
        for j, pairing2 in enumerate(created_pairings):
            if i < j:  # Vermeide Duplikate und Spiele gegen sich selbst
                # 3 Spiele pro Paarung
                for round_num in range(1, 4):
                    game = Game(
                        tournament_id=new_tournament.id,
                        pairing1_id=pairing1.id,
                        pairing2_id=pairing2.id,
                        round_number=round_num,
                        winner_pairing_id=None
                    )
                    db.add(game)
    
    db.commit()
    db.refresh(new_tournament)
    
    # Lade Paarungen mit Spielernamen
    pairings_with_names = []
    for pairing in created_pairings:
        db.refresh(pairing)
        pairings_with_names.append({
            "id": pairing.id,
            "player1_id": pairing.player1_id,
            "player1_name": pairing.player1.name,
            "player2_id": pairing.player2_id,
            "player2_name": pairing.player2.name
        })
    
    return {
        "id": new_tournament.id,
        "name": new_tournament.name,
        "year": new_tournament.year,
        "month": new_tournament.month,
        "pairings": pairings_with_names
    }


@router.get("/tournaments", response_model=List[TournamentResponse])
def list_tournaments(db: Session = Depends(get_db)):
    """Listet alle Turniere auf."""
    tournaments = db.query(Tournament).order_by(Tournament.year.desc(), Tournament.month.desc()).all()
    result = []
    for tournament in tournaments:
        pairings = db.query(Pairing).filter(Pairing.tournament_id == tournament.id).all()
        pairings_with_names = []
        for pairing in pairings:
            db.refresh(pairing)
            pairings_with_names.append({
                "id": pairing.id,
                "player1_id": pairing.player1_id,
                "player1_name": pairing.player1.name,
                "player2_id": pairing.player2_id,
                "player2_name": pairing.player2.name
            })
        result.append({
            "id": tournament.id,
            "name": tournament.name,
            "year": tournament.year,
            "month": tournament.month,
            "pairings": pairings_with_names
        })
    return result


@router.get("/tournaments/{tournament_id}", response_model=TournamentResponse)
def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    """Holt ein einzelnes Turnier."""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Turnier nicht gefunden.")
    
    pairings = db.query(Pairing).filter(Pairing.tournament_id == tournament_id).all()
    pairings_with_names = []
    for pairing in pairings:
        db.refresh(pairing)
        pairings_with_names.append({
            "id": pairing.id,
            "player1_id": pairing.player1_id,
            "player1_name": pairing.player1.name,
            "player2_id": pairing.player2_id,
            "player2_name": pairing.player2.name
        })
    
    return {
        "id": tournament.id,
        "name": tournament.name,
        "year": tournament.year,
        "month": tournament.month,
        "pairings": pairings_with_names
    }


@router.delete("/tournaments/{tournament_id}")
def delete_tournament(tournament_id: int, db: Session = Depends(get_db)):
    """Löscht ein Turnier inklusive Paarungen und Spiele."""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Turnier nicht gefunden.")

    # Spiele löschen
    db.query(Game).filter(Game.tournament_id == tournament_id).delete()
    # Paarungen löschen
    db.query(Pairing).filter(Pairing.tournament_id == tournament_id).delete()
    # Turnier löschen
    db.delete(tournament)
    db.commit()
    return {"message": "Turnier gelöscht"}



