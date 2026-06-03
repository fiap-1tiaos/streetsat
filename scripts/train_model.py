"""
Treina o modelo Random Forest com dados PRF e exporta modelo_rf.pkl.
Uso: python scripts/train_model.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd

from src.core.config import PRF_DIR, MODELS_DIR, DOCS_DIR
from src.core.constants import MODEL_FEATURES, RISK_LABELS
from src.data.prf_loader import load_prf_data
from src.data.data_cleaner import clean_prf_data
from src.data.feature_engineering import build_risk_label, engineer_features, save_encoders
from src.models.ml_model import train
from src.utils.logger import get_logger

log = get_logger("train")


def main():
    # ── 1. Carregar CSVs ──────────────────────────────────────────────────────
    csv_files = sorted(PRF_DIR.glob("*.csv"))
    if not csv_files:
        log.error("Nenhum CSV encontrado em %s", PRF_DIR)
        sys.exit(1)
    log.info("Arquivos encontrados: %s", [f.name for f in csv_files])

    df = load_prf_data(csv_files)

    # ── 2. Limpeza ────────────────────────────────────────────────────────────
    df = clean_prf_data(df)

    # ── 3. EDA rápido ─────────────────────────────────────────────────────────
    _plot_eda(df)

    # ── 4. Feature engineering + label ────────────────────────────────────────
    df["risk_label"] = build_risk_label(df)
    log.info("Distribuição de labels:\n%s", df["risk_label"].value_counts().sort_index().to_string())

    df, encoders = engineer_features(df, fit=True)

    # Garantir colunas presentes
    missing = [c for c in MODEL_FEATURES if c not in df.columns]
    if missing:
        log.warning("Colunas ausentes (serão zeradas): %s", missing)
        for c in missing:
            df[c] = 0

    X = df[MODEL_FEATURES].copy()
    y = df["risk_label"]

    # ── 5. Treino ─────────────────────────────────────────────────────────────
    pipeline, metadata = train(X, y, MODELS_DIR)

    # ── 6. Salvar encoders ────────────────────────────────────────────────────
    enc_path = MODELS_DIR / "encoders.pkl"
    save_encoders(encoders, enc_path)

    # ── 7. Plots de avaliação ─────────────────────────────────────────────────
    _plot_confusion_matrix(metadata["confusion_matrix"])
    _plot_feature_importance(metadata["feature_importance"])

    log.info("✅ Treino concluído! F1-macro: %.4f | Acurácia: %.4f",
             metadata["f1_score"], metadata["accuracy"])
    log.info("Modelo: %s", MODELS_DIR / "modelo_rf.pkl")


def _plot_eda(df: pd.DataFrame):
    figs_dir = DOCS_DIR / "eda"

    # Distribuição de acidentes por hora
    if "hour" in df.columns:
        fig, ax = plt.subplots(figsize=(12, 4))
        df["hour"].value_counts().sort_index().plot(kind="bar", ax=ax, color="#3498DB")
        ax.set_title("Acidentes por Hora do Dia")
        ax.set_xlabel("Hora")
        ax.set_ylabel("Quantidade")
        fig.tight_layout()
        fig.savefig(figs_dir / "acidentes_por_hora.png", dpi=100)
        plt.close(fig)

    # Top 10 causas
    if "causa_acidente" in df.columns:
        fig, ax = plt.subplots(figsize=(12, 5))
        df["causa_acidente"].value_counts().head(10).plot(kind="barh", ax=ax, color="#E74C3C")
        ax.set_title("Top 10 Causas de Acidente")
        fig.tight_layout()
        fig.savefig(figs_dir / "top_causas.png", dpi=100)
        plt.close(fig)

    log.info("Plots EDA salvos em %s", figs_dir)


def _plot_confusion_matrix(cm: list):
    figs_dir = DOCS_DIR / "figures"
    labels = [RISK_LABELS[i] for i in range(4)]
    fig, ax = plt.subplots(figsize=(7, 6))
    sns.heatmap(np.array(cm), annot=True, fmt="d", cmap="Blues",
                xticklabels=labels, yticklabels=labels, ax=ax)
    ax.set_title("Matriz de Confusão")
    ax.set_ylabel("Real")
    ax.set_xlabel("Previsto")
    fig.tight_layout()
    fig.savefig(figs_dir / "confusion_matrix.png", dpi=100)
    plt.close(fig)
    log.info("Matriz de confusão salva em %s", figs_dir / "confusion_matrix.png")


def _plot_feature_importance(importance: dict):
    figs_dir = DOCS_DIR / "figures"
    features = list(importance.keys())[:15]
    values = [importance[k] for k in features]
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.barh(features[::-1], values[::-1], color="#2ECC71")
    ax.set_title("Feature Importance (Top 15)")
    ax.set_xlabel("Importância")
    fig.tight_layout()
    fig.savefig(figs_dir / "feature_importance.png", dpi=100)
    plt.close(fig)
    log.info("Feature importance salvo em %s", figs_dir / "feature_importance.png")


if __name__ == "__main__":
    main()
