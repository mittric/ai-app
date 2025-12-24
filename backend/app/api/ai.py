import json
import os
from typing import Any, Dict, List

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.message import Message

router = APIRouter()
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")


async def call_ollama(prompt: str) -> str:
    """Spricht die Ollama-API an und liefert nur den Textinhalt zurück."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        payload = {"model": "llama3.1", "prompt": prompt}
        response = await client.post(f"{OLLAMA_HOST}/api/generate", json=payload)
        response.raise_for_status()
        try:
            data: Dict[str, Any] = response.json()
            return (
                data.get("response")
                or data.get("output")
                or data.get("data")
                or str(data)
            )
        except ValueError:
            text_content = response.text.strip()
            if not text_content:
                return "Keine Antwort erhalten."

            chunks: List[str] = []
            for line in text_content.splitlines():
                if not line.strip():
                    continue
                try:
                    chunk = json.loads(line)
                    if isinstance(chunk, dict) and chunk.get("response"):
                        chunks.append(str(chunk["response"]))
                except ValueError:
                    chunks.append(line)

            cleaned = "".join(chunks).strip()
            return cleaned or text_content


@router.get("/ai/chat")
async def chat(message: str, db: Session = Depends(get_db)):
    """Einfacher Chat-Endpunkt für KI-Kommunikation."""
    if not message.strip():
        raise HTTPException(status_code=400, detail="Nachricht darf nicht leer sein.")

    try:
        response = await call_ollama(message)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    entry = Message(content=message, response=response)
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "id": entry.id,
        "message": entry.content,
        "response": entry.response,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
    }



