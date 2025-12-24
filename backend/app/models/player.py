from sqlalchemy import Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    pairings_as_player1 = relationship("Pairing", foreign_keys="Pairing.player1_id", back_populates="player1")
    pairings_as_player2 = relationship("Pairing", foreign_keys="Pairing.player2_id", back_populates="player2")



