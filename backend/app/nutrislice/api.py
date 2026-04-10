import logging
from datetime import datetime, timedelta
from typing import Any

import requests
from requests import RequestException


logger = logging.getLogger(__name__)

BASE_MENU_URL = "https://ithacadining.api.nutrislice.com/menu/api/weeks/school"
MEAL_TYPES = ("breakfast", "lunch", "dinner")
REQUEST_TIMEOUT_SECONDS = 15

TERRACE_SLUG = "terrace-dining-hall"
CAMPUS_CENTER_SLUG = "campus-center-dining-hall"


def _format_target_date(day_offset: int = 0) -> str:
    return (datetime.today() + timedelta(days=day_offset)).strftime("%Y/%m/%d")


def _build_menu_url(place_slug: str, target_date: str, meal_type: str) -> str:
    return f"{BASE_MENU_URL}/{place_slug}/menu-type/{meal_type}/{target_date}/"


def get_menu(url: str) -> dict[str, Any]:
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        return response.json()
    except RequestException as exc:
        logger.warning("Menu request failed for %s: %s", url, exc)
    except ValueError as exc:
        logger.warning("Menu response was not valid JSON for %s: %s", url, exc)
    return {}


def get_place_menus(place_slug: str, day_offset: int = 0) -> list[dict[str, Any]]:
    target_date = _format_target_date(day_offset)
    return [
        get_menu(_build_menu_url(place_slug, target_date, meal_type))
        for meal_type in MEAL_TYPES
    ]


def get_terrace_and_cc_menus(day_offset: int = 0) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    terrace_menus = get_place_menus(TERRACE_SLUG, day_offset)
    campus_center_menus = get_place_menus(CAMPUS_CENTER_SLUG, day_offset)
    return terrace_menus, campus_center_menus
