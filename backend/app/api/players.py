from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.player import Player
from app.models.pairing import Pairing

router = APIRouter()


class PlayerCreate(BaseModel):
    name: str


class PlayerResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


@router.post("/players", response_model=PlayerResponse)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    """Erstellt einen neuen Spieler."""
    if not player.name or not player.name.strip():
        raise HTTPException(status_code=400, detail="Name darf nicht leer sein.")
    
    # Prüfe, ob Spieler bereits existiert
    existing = db.query(Player).filter(Player.name == player.name.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Spieler mit diesem Namen existiert bereits.")
    
    new_player = Player(name=player.name.strip())
    db.add(new_player)
    db.commit()
    db.refresh(new_player)
    return new_player


@router.get("/players", response_model=List[PlayerResponse])
def list_players(db: Session = Depends(get_db)):
    """Listet alle Spieler auf."""
    return db.query(Player).order_by(Player.name).all()


@router.get("/players/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, db: Session = Depends(get_db)):
    """Holt einen einzelnen Spieler."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Spieler nicht gefunden.")
    return player


@router.delete("/players/{player_id}")
def delete_player(player_id: int, db: Session = Depends(get_db)):
    """Löscht einen Spieler."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Spieler nicht gefunden.")

    # Verhindere Löschen, falls Spieler in Paarungen verwendet wird
    in_pairings = db.query(Pairing).filter(
        (Pairing.player1_id == player_id) | (Pairing.player2_id == player_id)
    ).first()
    if in_pairings:
        raise HTTPException(
            status_code=409,
            detail="Spieler kann nicht gelöscht werden, da er in Turnierpaarungen verwendet wird.",
        )
    
    db.delete(player)
    db.commit()
    return {"message": "Spieler gelöscht"}




