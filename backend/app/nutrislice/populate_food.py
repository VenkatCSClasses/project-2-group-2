import logging
from typing import Any
from uuid import UUID
from sqlmodel import Session, select
from app.models import FoodItem, FoodPlace
from app.nutrislice.api import get_terrace_and_cc_menus


logger = logging.getLogger(__name__)


def populate_food_items(db: Session, menu_data: dict[str, Any], place_id: UUID) -> None:
    seen_names: set[str] = set()

    for day in menu_data.get("days", []):
        for menu_item in day.get("menu_items", []):
            food = menu_item.get("food", None)
            if food is not None:
                name = food.get("name")
                if not name or name in seen_names:
                    continue

                seen_names.add(name)
                description = food.get("description") or None
                image_url = food.get("image_url") or None

                existing_item = db.exec(select(FoodItem).where(FoodItem.name == name)).first()
                if existing_item:
                    updated = False
                    if not existing_item.description and description:
                        existing_item.description = description
                        updated = True
                    if not existing_item.image_url and image_url:
                        existing_item.image_url = image_url
                        updated = True
                    if existing_item.food_place_id is None:
                        existing_item.food_place_id = place_id
                        updated = True
                    if updated:
                        db.add(existing_item)
                    continue

                new_food_item = FoodItem(
                    name=name,
                    description=description,
                    image_url=image_url,
                    food_place_id=place_id,
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
