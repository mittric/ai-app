from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.game import Game
from app.models.pairing import Pairing
from app.models.tournament import Tournament

router = APIRouter()


class GameUpdate(BaseModel):
    winner_pairing_id: Optional[int]


class GameResponse(BaseModel):
    id: int
    tournament_id: int
    pairing1_id: int
    pairing1_names: str
    pairing2_id: int
    pairing2_names: str
    round_number: int
    winner_pairing_id: Optional[int]
    winner_names: Optional[str]

    class Config:
        from_attributes = True


class ScoreResponse(BaseModel):
    pairing_id: int
    pairing_names: str
    points: int
    games_played: int
    games_won: int


@router.get("/tournaments/{tournament_id}/games", response_model=List[GameResponse])
def list_games(tournament_id: int, db: Session = Depends(get_db)):
    """Listet alle Spiele eines Turniers auf."""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Turnier nicht gefunden.")
    
    games = db.query(Game).filter(Game.tournament_id == tournament_id).order_by(
        Game.round_number, Game.id
    ).all()
    
    result = []
    for game in games:
        db.refresh(game)
        pairing1 = db.query(Pairing).filter(Pairing.id == game.pairing1_id).first()
        pairing2 = db.query(Pairing).filter(Pairing.id == game.pairing2_id).first()
        
        if pairing1 and pairing2:
            db.refresh(pairing1)
            db.refresh(pairing2)
            pairing1_names = f"{pairing1.player1.name} & {pairing1.player2.name}"
            pairing2_names = f"{pairing2.player1.name} & {pairing2.player2.name}"
            
            winner_names = None
            if game.winner_pairing_id:
                winner_pairing = db.query(Pairing).filter(Pairing.id == game.winner_pairing_id).first()
                if winner_pairing:
                    db.refresh(winner_pairing)
                    winner_names = f"{winner_pairing.player1.name} & {winner_pairing.player2.name}"
            
            result.append({
                "id": game.id,
                "tournament_id": game.tournament_id,
                "pairing1_id": game.pairing1_id,
                "pairing1_names": pairing1_names,
                "pairing2_id": game.pairing2_id,
                "pairing2_names": pairing2_names,
                "round_number": game.round_number,
                "winner_pairing_id": game.winner_pairing_id,
                "winner_names": winner_names
            })
    
    return result


@router.patch("/games/{game_id}", response_model=GameResponse)
def update_game(game_id: int, game_update: GameUpdate, db: Session = Depends(get_db)):
    """Aktualisiert das Ergebnis eines Spiels."""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Spiel nicht gefunden.")
    
    # Prüfe, ob die Gewinner-Paarung eine der beiden Spiel-Paarungen ist (oder None zum Zurücksetzen)
    if game_update.winner_pairing_id is not None and game_update.winner_pairing_id not in [game.pairing1_id, game.pairing2_id]:
        raise HTTPException(
            status_code=400,
            detail="Die Gewinner-Paarung muss eine der beiden Spiel-Paarungen sein."
        )
    
    game.winner_pairing_id = game_update.winner_pairing_id
    db.commit()
    db.refresh(game)
    
    # Lade vollständige Informationen
    pairing1 = db.query(Pairing).filter(Pairing.id == game.pairing1_id).first()
    pairing2 = db.query(Pairing).filter(Pairing.id == game.pairing2_id).first()
    
    if pairing1 and pairing2:
        db.refresh(pairing1)
        db.refresh(pairing2)
        pairing1_names = f"{pairing1.player1.name} & {pairing1.player2.name}"
        pairing2_names = f"{pairing2.player1.name} & {pairing2.player2.name}"
        
        winner_names = None
        if game.winner_pairing_id:
            winner_pairing = db.query(Pairing).filter(Pairing.id == game.winner_pairing_id).first()
            if winner_pairing:
                db.refresh(winner_pairing)
                winner_names = f"{winner_pairing.player1.name} & {winner_pairing.player2.name}"
        
        return {
            "id": game.id,
            "tournament_id": game.tournament_id,
            "pairing1_id": game.pairing1_id,
            "pairing1_names": pairing1_names,
            "pairing2_id": game.pairing2_id,
            "pairing2_names": pairing2_names,
            "round_number": game.round_number,
            "winner_pairing_id": game.winner_pairing_id,
            "winner_names": winner_names
        }
    
    raise HTTPException(status_code=500, detail="Fehler beim Laden der Spielinformationen.")


@router.get("/tournaments/{tournament_id}/scores", response_model=List[ScoreResponse])
def get_tournament_scores(tournament_id: int, db: Session = Depends(get_db)):
    """Ermittelt die Punktestände eines Turniers."""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Turnier nicht gefunden.")
    
    # Hole alle Paarungen des Turniers
    pairings = db.query(Pairing).filter(Pairing.tournament_id == tournament_id).all()
    
    scores = []
    for pairing in pairings:
        db.refresh(pairing)
        pairing_names = f"{pairing.player1.name} & {pairing.player2.name}"
        
        # Zähle gewonnene Spiele (als pairing1 oder pairing2)
        games_won = db.query(Game).filter(
            Game.tournament_id == tournament_id,
            Game.winner_pairing_id == pairing.id
        ).count()
        
        # Zähle gespielte Spiele
        games_played = db.query(Game).filter(
            Game.tournament_id == tournament_id,
            ((Game.pairing1_id == pairing.id) | (Game.pairing2_id == pairing.id)),
            Game.winner_pairing_id.isnot(None)
        ).count()
        
        scores.append({
            "pairing_id": pairing.id,
            "pairing_names": pairing_names,
            "points": games_won,  # Jeder Sieg = 1 Punkt
            "games_played": games_played,
            "games_won": games_won
        })
    
    # Sortiere nach Punkten (absteigend)
    scores.sort(key=lambda x: x["points"], reverse=True)
    return scores

