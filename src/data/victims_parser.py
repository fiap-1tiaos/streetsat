import re

PATTERN = re.compile(r"(ILESA|FERIDA LEVE|FERIDA GRAVE|MORTA)\s*:\s*(\d+)", re.IGNORECASE)

KEYS = {
    "ILESA": "ilesos",
    "FERIDA LEVE": "feridos_leves",
    "FERIDA GRAVE": "feridos_graves",
    "MORTA": "mortos",
}


def parse_victims(text: str | None) -> dict[str, int]:
    result = {"ilesos": 0, "feridos_leves": 0, "feridos_graves": 0, "mortos": 0}
    if not text:
        return result
    for match in PATTERN.finditer(text):
        key = KEYS.get(match.group(1).upper())
        if key:
            result[key] = int(match.group(2))
    return result
