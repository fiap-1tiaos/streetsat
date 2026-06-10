RISK_LABELS = {
    0: "Livre",
    1: "Atenção",
    2: "Alto",
    3: "Crítico",
}

RISK_COLORS = {
    0: "#2ECC71",
    1: "#F1C40F",
    2: "#E67E22",
    3: "#E74C3C",
}

RISK_PENALTY = {
    0: 0.0,
    1: 0.5,
    2: 2.0,
    3: 5.0,
}

SP_BOUNDS = {
    "lat_min": -25.5,
    "lat_max": -19.5,
    "lon_min": -53.0,
    "lon_max": -44.0,
}

CRITICAL_KEYWORDS = ["morto", "óbito", "vítima fatal", "faleceu", "morte", "fatal"]
HIGH_KEYWORDS = ["ferido grave", "uti", "internado", "presos às ferragens", "resgate", "bombeiros"]
MEDIUM_KEYWORDS = ["ferido leve", "socorrido", "atendimento médico", "ambulância"]
BLOCKAGE_KEYWORDS = ["bloqueio total", "interditado", "fechado", "sem passagem"]
DIVERSION_KEYWORDS = ["desvio", "alternativa", "contorno", "retorno"]

MODEL_FEATURES = [
    "hour",
    "day_of_week",
    "is_weekend",
    "month",
    "road_id_encoded",
    "km_mid",
    "class_encoded",
    "subclass_encoded",
    "accident_type_encoded",
    "concessionaire_encoded",
    "municipio_encoded",
    "has_blockage",
    "feridos_leves",
    "feridos_graves",
    "mortos",
    "nearest_eonet_distance_km",
    "has_nearby_eonet",
    "precipitation_mm",
    "wind_speed_ms",
    "temperature_c",
    "humidity",
]

CATEGORICAL_COLS = {
    "classe": "class_encoded",
    "subclasse_ac": "subclass_encoded",
    "tipo_ac": "accident_type_encoded",
    "concessionaria": "concessionaire_encoded",
    "municipio": "municipio_encoded",
}
