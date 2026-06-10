import re

ROAD_PATTERN = re.compile(r"(SP[A-Z]*)\s*0*(\d+)", re.IGNORECASE)


def normalize_road_name(raw: str) -> str:
    m = ROAD_PATTERN.search(raw)
    if m:
        prefix = m.group(1).upper()
        number = m.group(2)
        return f"{prefix}-{number}"
    return raw.strip()


class RoadEncoder:
    def __init__(self, encoders: dict):
        le = encoders.get("road_id")
        if le is None:
            raise ValueError("road_id encoder not found in encoders")
        self._le = le

    def encode(self, road: str) -> int:
        if road in self._le.classes_:
            return int(self._le.transform([road])[0])
        return int(self._le.transform(["desconhecido"])[0])
