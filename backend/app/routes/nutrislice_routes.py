from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_db
from app.nutrislice.populate_food import populate_day
from app.utils import get_current_admin


router = APIRouter()


@router.post("/populate")
async def populate_menus_on_demand(
    day: int = 0,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    """
    Trigger menu population manually.

    - day: day offset from today (0 = today, 1 = tomorrow, -1 = yesterday).
    """
    try:
        populate_day(db, day=day)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to populate menus") from exc

    return {
        "message": "Menu population completed",
        "day": day,
        "triggered_by": current_admin["user_id"],
    }
