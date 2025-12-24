from sqlalchemy import Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)  # z.B. "Januar 2024"
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    pairings = relationship("Pairing", back_populates="tournament", cascade="all, delete-orphan")





