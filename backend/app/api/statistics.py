from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.game import Game
from app.models.pairing import Pairing
from app.models.player import Player
from app.models.tournament import Tournament

router = APIRouter()


class YearlyScoreResponse(BaseModel):
    player_id: int
    player_name: str
    total_points: int
    tournaments_played: int


@router.get("/statistics/yearly/{year}", response_model=List[YearlyScoreResponse])
def get_yearly_scores(year: int, db: Session = Depends(get_db)):
    """Ermittelt die Jahresübersicht aller Spieler für ein bestimmtes Jahr."""
    # Hole alle Turniere des Jahres
    tournaments = db.query(Tournament).filter(Tournament.year == year).all()
    if not tournaments:
        return []
    
    tournament_ids = [t.id for t in tournaments]
    
    # Hole alle Spieler
    players = db.query(Player).all()
    
    results = []
    for player in players:
        # Finde alle Paarungen, an denen dieser Spieler beteiligt war
        pairings = db.query(Pairing).filter(
            Pairing.tournament_id.in_(tournament_ids),
            ((Pairing.player1_id == player.id) | (Pairing.player2_id == player.id))
        ).all()
        
        pairing_ids = [p.id for p in pairings]
        
        # Zähle alle gewonnenen Spiele dieser Paarungen
        total_points = db.query(Game).filter(
            Game.tournament_id.in_(tournament_ids),
            Game.winner_pairing_id.in_(pairing_ids)
        ).count()
        
        # Zähle Turniere, an denen der Spieler teilgenommen hat
        tournaments_played = len(set(p.tournament_id for p in pairings))
        
        results.append({
            "player_id": player.id,
            "player_name": player.name,
            "total_points": total_points,
            "tournaments_played": tournaments_played
        })
    
    # Sortiere nach Punkten (absteigend)
    results.sort(key=lambda x: x["total_points"], reverse=True)
    return results


@router.get("/statistics/player/{player_id}/yearly/{year}")
def get_player_yearly_details(player_id: int, year: int, db: Session = Depends(get_db)):
    """Detaillierte Jahresübersicht für einen einzelnen Spieler."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Spieler nicht gefunden.")
    
    tournaments = db.query(Tournament).filter(Tournament.year == year).order_by(
        Tournament.month
    ).all()
    
    tournament_ids = [t.id for t in tournaments]
    
    details = {
        "player_id": player.id,
        "player_name": player.name,
        "year": year,
        "tournaments": []
    }
    
    for tournament in tournaments:
        # Finde Paarungen dieses Spielers in diesem Turnier
        pairings = db.query(Pairing).filter(
            Pairing.tournament_id == tournament.id,
            ((Pairing.player1_id == player_id) | (Pairing.player2_id == player_id))
        ).all()
        
        tournament_points = 0
        for pairing in pairings:
            games_won = db.query(Game).filter(
                Game.tournament_id == tournament.id,
                Game.winner_pairing_id == pairing.id
            ).count()
            tournament_points += games_won
        
        # Finde Partner
        partner_name = None
        if pairings:
            pairing = pairings[0]
            db.refresh(pairing)
            if pairing.player1_id == player_id:
                partner_name = pairing.player2.name
            else:
                partner_name = pairing.player1.name
        
        details["tournaments"].append({
            "tournament_id": tournament.id,
            "tournament_name": tournament.name,
            "month": tournament.month,
            "partner": partner_name,
            "points": tournament_points
        })
    
    # Berechne Gesamtpunkte
    pairing_ids = []
    for tournament in tournaments:
        pairings = db.query(Pairing).filter(
            Pairing.tournament_id == tournament.id,
            ((Pairing.player1_id == player_id) | (Pairing.player2_id == player_id))
        ).all()
        pairing_ids.extend([p.id for p in pairings])
    
    total_points = db.query(Game).filter(
        Game.tournament_id.in_(tournament_ids),
        Game.winner_pairing_id.in_(pairing_ids)
    ).count() if pairing_ids else 0
    
    details["total_points"] = total_points
    return details

