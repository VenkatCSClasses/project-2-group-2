from typing import TypeVar
from uuid import UUID

from fastapi import HTTPException
from sqlmodel import Session

T = TypeVar("T")


def parse_uuid(value: str) -> UUID:
    try:
        return UUID(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")


def strip(value: str | None, detail: str | None = None) -> str | None:
    if not value:
        return None
    value = value.strip()
    if not value:
        raise HTTPException(status_code=400, detail=detail or "Value cannot be empty")
    return value


def get_or_404(db: Session, model: type[T], id: UUID) -> T:
    item = db.get(model, id)
    if not item:
        raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
    return item
