import logging
from datetime import date, datetime
from typing import Any
from uuid import UUID
from sqlmodel import Session, select
from app.models import FoodItem, FoodPlace
from app.nutrislice.api import get_terrace_and_cc_menus


logger = logging.getLogger(__name__)


def _parse_menu_date(raw_value: Any) -> date | None:
    if not raw_value:
        return None
    if isinstance(raw_value, datetime):
        return raw_value.date()
    if isinstance(raw_value, date):
        return raw_value
    if isinstance(raw_value, str):
        normalized = raw_value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized).date()
        except ValueError:
            pass
        for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y"):
            try:
                return datetime.strptime(raw_value, fmt).date()
            except ValueError:
                continue
    return None


def populate_food_items(db: Session, menu_data: dict[str, Any], place_id: UUID) -> None:
    seen_keys: set[tuple[str, date]] = set()

    for day in menu_data.get("days", []):
        menu_date = _parse_menu_date(day.get("date"))
        if menu_date is None:
            logger.warning("Skipping menu day with missing or invalid date: %s", day.get("date"))
            continue

        for menu_item in day.get("menu_items", []):
            food = menu_item.get("food", None)
            if food is not None:
                name = food.get("name")
                seen_key = (name, menu_date)
                if not name or seen_key in seen_keys:
                    continue

                seen_keys.add(seen_key)
                description = food.get("description") or None
                image_url = food.get("image_url") or None

                existing_item = db.exec(
                    select(FoodItem).where(
                        FoodItem.name == name,
                        FoodItem.food_place_id == place_id,
                        FoodItem.menu_date == menu_date,
                    )
                ).first()
                if existing_item:
                    updated = False
                    if not existing_item.description and description:
                        existing_item.description = description
                        updated = True
                    if not existing_item.image_url and image_url:
                        existing_item.image_url = image_url
                        updated = True
                    if updated:
                        db.add(existing_item)
                    continue

                new_food_item = FoodItem(
                    name=name,
                    description=description,
                    image_url=image_url,
                    food_place_id=place_id,
                    menu_date=menu_date,
                )
                db.add(new_food_item)


def populate_day(db: Session, day: int = 0) -> None:
    terrace_menus, cc_menus = get_terrace_and_cc_menus(day)

    terrace_place = db.exec(select(FoodPlace).where(FoodPlace.name == "Terrace Dining Hall")).first()
    if not terrace_place:
        terrace_place = FoodPlace(name="Terrace Dining Hall", description="Terrace Dining Hall")
        db.add(terrace_place)
        logger.info("Created food place: Terrace Dining Hall")

    cc_place = db.exec(select(FoodPlace).where(FoodPlace.name == "Campus Center Dining Hall")).first()
    if not cc_place:
        cc_place = FoodPlace(name="Campus Center Dining Hall", description="Campus Center Dining Hall")
        db.add(cc_place)
        logger.info("Created food place: Campus Center Dining Hall")

    for terrace_menu in terrace_menus:
        populate_food_items(db, terrace_menu, terrace_place.id)

    for cc_menu in cc_menus:
        populate_food_items(db, cc_menu, cc_place.id)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
