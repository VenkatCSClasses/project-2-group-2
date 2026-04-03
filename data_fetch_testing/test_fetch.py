import requests
import json
from datetime import datetime

def get_menu(url: str) -> dict:
    response = requests.get(url)
    print(response.status_code)
    data = response.json()

    for day in data.get("days", []):
        for menu_item in day.get("menu_items", []):
            food = menu_item.get("food", None)
            if food is not None:
                print(f"{food.get('name', 'Unknown Food Item')}")
            else:
                print(f"{menu_item.get('text', 'None')} - None")

    return data


def main() -> None:
    today = datetime.today().strftime("%Y/%m/%d")

    terrace_menu = get_menu(f"https://ithacadining.api.nutrislice.com/menu/api/weeks/school/terrace-dining-hall/menu-type/lunch/{today}/")
    cc_menu = get_menu(f"https://ithacadining.api.nutrislice.com/menu/api/weeks/school/campus-center-dining-hall/menu-type/lunch/{today}/")
    
    with open("terrace_menu.json", "w") as f:
        json.dump(terrace_menu, f, indent=4)

    with open("cc_menu.json", "w") as f:
        json.dump(cc_menu, f, indent=4)


if __name__ == "__main__":
    main()
