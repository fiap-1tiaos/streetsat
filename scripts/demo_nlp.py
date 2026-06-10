"""Demo NLP: analisa narrativas de ocorrências. Uso: python scripts/demo_nlp.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.nlp import get_nlp_client
from src.ml.scoring import enrich_score_with_nlp

SAMPLE_NARRATIVES = [
    ("OC-19501", "Tombamento de carreta com vítimas presas às ferragens. Bloqueio total da pista. Bombeiros no local.", 2),
    ("OC-19502", "Colisão traseira entre dois veículos. Feridos leves atendidos pelo SAMU.", 1),
    ("OC-19503", "Acidente com morte. Motorista faleceu no local após colisão frontal com caminhão.", 2),
    ("OC-19504", "Obra de manutenção na faixa da direita. Desvio sinalizado. Fluxo normal.", 0),
    ("OC-19505", "Veículo em pane na acostamento. Sem interdição. Guincho acionado.", 0),
]


def main():
    nlp = get_nlp_client()
    print(f"\n{'─'*90}")
    print(f"{'OC-ID':<12} {'Sentimento':<12} {'Boost':<8} {'Score Base':<12} {'Score Final':<12} {'Narrativa'}")
    print(f"{'─'*90}")

    for occ_id, narrative, base_score in SAMPLE_NARRATIVES:
        result = nlp.analyze_occurrence(narrative)
        enriched = enrich_score_with_nlp(base_score, [{"narrative": narrative}])
        boost = result.get("severity_boost", 0)
        sentiment = result.get("sentiment", "")
        print(f"{occ_id:<12} {sentiment:<12} {f'+{boost}':<8} {base_score:<12} {enriched:<12} {narrative[:45]}...")

    print(f"{'─'*90}\n")


if __name__ == "__main__":
    main()
