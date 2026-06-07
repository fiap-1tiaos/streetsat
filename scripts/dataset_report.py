import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.config import PRF_DIR
from src.data.prf_loader import load_prf_data

def report_header(df):
    print("")
    print("=" * 40)
    print("RELATÓRIO DO DATASET PRF")
    print("=" * 40)

    print(f"\nTotal de registros: {len(df)}")

def report_period(df):
    if "data_inversa" in df.columns:
        print("\nPeríodo:")
        print(f"{df['data_inversa'].min()} até {df['data_inversa'].max()}")

def report_ufs(df):
    if "uf" in df.columns:
        print(f"\nUFs encontradas: {df['uf'].nunique()}")

def report_roads(df):
    if "br" in df.columns:
        print("\nTop 10 rodovias:")

        top_roads = df["br"].value_counts().head(10)

        for road, count in top_roads.items():
            print(f"BR-{road}: {count}")

def report_victims(df):
    if "mortos" in df.columns:
        total_mortos = (df["mortos"] > 0).sum()
        print(f"\nAcidentes com mortos: {total_mortos}")

    if "feridos_graves" in df.columns:
        total_graves = (df["feridos_graves"] > 0).sum()
        print(f"Acidentes com feridos graves: {total_graves}")


def report_nulls(df):
    print("\nValores nulos:")

    nulls = df.isnull().sum()

    for coluna, total in nulls.items():
        if total > 0:
            print(f"{coluna}: {total}")

def main():
    csv_files = sorted(PRF_DIR.glob("*.csv"))

    if not csv_files:
        print("Nenhum CSV encontrado.")
        return

    df = load_prf_data(csv_files)

    report_header(df)
    report_period(df)
    report_ufs(df)
    report_roads(df)
    report_victims(df)
    report_nulls(df)

if __name__ == "__main__":
    main()

