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

BRAZIL_BOUNDS = {
    "lat_min": -35.0,
    "lat_max": 5.5,
    "lon_min": -75.0,
    "lon_max": -34.0,
}

# Palavras-chave para NLP local
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
    "br_number",
    "km_bucket",
    "cause_encoded",
    "type_encoded",
    "weather_encoded",
    "day_phase_encoded",
    "road_type_encoded",
    "road_layout_encoded",
    "land_use_encoded",
    "uf_encoded",
]
