from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.game import Game


class Pairing(Base):
    __tablename__ = "pairings"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    player1_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    player2_id = Column(Integer, ForeignKey("players.id"), nullable=False)

    # Relationships
    tournament = relationship("Tournament", back_populates="pairings")
    player1 = relationship("Player", foreign_keys=[player1_id], back_populates="pairings_as_player1")
    player2 = relationship("Player", foreign_keys=[player2_id], back_populates="pairings_as_player2")
    games_as_pairing1 = relationship("Game", foreign_keys=[Game.pairing1_id], back_populates="pairing1")
    games_as_pairing2 = relationship("Game", foreign_keys=[Game.pairing2_id], back_populates="pairing2")

