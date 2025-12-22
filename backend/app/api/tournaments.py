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


def generate_all_round_robin_rounds(player_ids: List[int]) -> List[List[tuple]]:
    """
    Generiert alle 7 Round-Robin-Runden für 8 Spieler.
    Jeder Spieler wird mit jedem anderen Spieler genau einmal in einer Runde gepaart.
    Jede Runde hat 4 Paarungen (8 Spieler / 2 = 4 Paare).
    
    Returns:
        Liste von 7 Runden, jede Runde ist eine Liste von 4 Paarungen (Tupeln).
    """
    if len(player_ids) != 8:
        raise ValueError("Es müssen genau 8 Spieler vorhanden sein.")
    
    n = len(player_ids)
    all_rounds = []
    
    # Erstelle eine Liste der Spieler-IDs (diese wird rotiert)
    players = player_ids.copy()
    
    # Generiere 7 Runden (n - 1)
    for round_num in range(n - 1):
        round_pairings = []
        
        # In jeder Runde: Paare den ersten Spieler mit dem letzten, 
        # den zweiten mit dem vorletzten, etc.
        for i in range(n // 2):
            p1 = players[i]
            p2 = players[n - 1 - i]
            # Stelle sicher, dass die kleinere ID zuerst kommt (für Konsistenz)
            pair = (min(p1, p2), max(p1, p2))
            round_pairings.append(pair)
        
        all_rounds.append(round_pairings)
        
        # Rotiere die Spieler für die nächste Runde (außer dem ersten)
        players = [players[0]] + [players[-1]] + players[1:-1]
    
    return all_rounds


def get_round_robin_round_for_tournament(player_ids: List[int], tournament_number: int) -> List[tuple]:
    """
    Gibt die Paarungen für ein bestimmtes Turnier zurück.
    Nach 7 Turnieren startet der Zyklus wieder bei Runde 1.
    
    Args:
        player_ids: Liste von 8 Spieler-IDs
        tournament_number: Turniernummer (1, 2, 3, ..., 7, 8=1, 9=2, ...)
    
    Returns:
        Liste von 4 Paarungen für dieses Turnier.
    """
    all_rounds = generate_all_round_robin_rounds(player_ids)
    # tournament_number ist 1-basiert, Zyklus nach 7 Turnieren
    round_index = (tournament_number - 1) % 7
    return all_rounds[round_index]


@router.post("/tournaments", response_model=TournamentResponse)
def create_tournament(tournament: TournamentCreate, db: Session = Depends(get_db)):
    """
    Erstellt ein neues Turnier mit automatischen Paarungen nach Round-Robin-Logik.
    Nach jedem neuen Turnier werden die Spieler in einer neuen Konfiguration gepaart,
    wobei sich jeder Spieler von Turnier zu Turnier mit einem anderen Partner paart.
    Nach 7 Turnieren wiederholt sich das Schema.
    """
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
    
    # Ermittle die Turniernummer für diese Saisongruppe
    # Zähle alle bisherigen Turniere (unabhängig von Jahr/Monat)
    total_tournaments = db.query(Tournament).count()
    tournament_number = total_tournaments + 1
    
    # Erstelle Turnier
    new_tournament = Tournament(
        name=tournament.name,
        year=tournament.year,
        month=tournament.month
    )
    db.add(new_tournament)
    db.flush()
    
    # Generiere Paarungen für diese Turniernummer
    player_ids = [p.id for p in players]
    pairings_list = get_round_robin_round_for_tournament(player_ids, tournament_number)
    
    # Erstelle 4 Paarungen für dieses Turnier
    created_pairings = []
    for p1_id, p2_id in pairings_list:
        pairing = Pairing(
            tournament_id=new_tournament.id,
            player1_id=p1_id,
            player2_id=p2_id
        )
        db.add(pairing)
        created_pairings.append(pairing)
    
    db.flush()
    
    # Erstelle Spiele: Jedes Spielerpaar spielt 3 Mal gegen ein anderes Paar.
    # Mit 4 Paarungen entstehen 3 Kombinationen (0-1, 2-3, 0-2):
    # - Runde 1: Paarung 0 vs 1, Paarung 2 vs 3 (je 3 Spiele)
    # - Runde 2: Paarung 0 vs 2, Paarung 1 vs 3 (je 3 Spiele)
    # - Runde 3: Paarung 0 vs 3, Paarung 1 vs 2 (je 3 Spiele)
    # Total: 9 Spiele pro Turnier
    
    pairings = created_pairings
    match_ups = [
        (0, 1, 2, 3),  # Runde 1: 0 vs 1, 2 vs 3
        (0, 2, 1, 3),  # Runde 2: 0 vs 2, 1 vs 3
        (0, 3, 1, 2),  # Runde 3: 0 vs 3, 1 vs 2
    ]
    
    for round_num, (p1_idx, p2_idx, p3_idx, p4_idx) in enumerate(match_ups, start=1):
        # Spiele in dieser Runde: p1 vs p2 und p3 vs p4
        pairing_pairs = [
            (pairings[p1_idx], pairings[p2_idx]),
            (pairings[p3_idx], pairings[p4_idx])
        ]
        
        for pair1, pair2 in pairing_pairs:
            # Jedes Paarungen-Paar spielt 3 Spiele
            for game_num in range(1, 4):
                game = Game(
                    tournament_id=new_tournament.id,
                    pairing1_id=pair1.id,
                    pairing2_id=pair2.id,
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
    """
    Löscht ein Turnier und alle dazugehörigen Daten (Paarungen und Spiele).
    """
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Turnier nicht gefunden.")
    
    # Lösche alle Spiele dieses Turniers
    db.query(Game).filter(Game.tournament_id == tournament_id).delete()
    
    # Lösche alle Paarungen dieses Turniers
    db.query(Pairing).filter(Pairing.tournament_id == tournament_id).delete()
    
    # Lösche das Turnier selbst
    db.delete(tournament)
    db.commit()
    
    return {"message": "Turnier und alle dazugehörigen Daten gelöscht"}

