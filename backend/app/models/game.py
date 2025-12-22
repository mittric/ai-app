from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.db.database import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    pairing1_id = Column(Integer, ForeignKey("pairings.id"), nullable=False)
    pairing2_id = Column(Integer, ForeignKey("pairings.id"), nullable=False)
    round_number = Column(Integer, nullable=False)  # 1, 2 oder 3 (3 Spiele pro Paarung)
    winner_pairing_id = Column(Integer, ForeignKey("pairings.id"), nullable=True)  # None = noch nicht gespielt

    # Relationships
    tournament = relationship("Tournament")
    pairing1 = relationship("Pairing", foreign_keys=[pairing1_id], back_populates="games_as_pairing1")
    pairing2 = relationship("Pairing", foreign_keys=[pairing2_id], back_populates="games_as_pairing2")
    winner_pairing = relationship("Pairing", foreign_keys=[winner_pairing_id])

