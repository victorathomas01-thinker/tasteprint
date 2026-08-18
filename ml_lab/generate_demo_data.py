"""Generate synthetic Tasteprint preference vectors for ML experimentation.

This script intentionally creates synthetic data. It is for portfolio/research use and
must not be presented as a model trained on real Tasteprint users.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

DIMENSIONS = [
    "novelty",
    "structure",
    "social_energy",
    "aesthetic_sensitivity",
    "comfort",
    "energy",
    "serenity",
    "sentiment",
    "curiosity",
    "spontaneity",
]

ARCHETYPES = {
    "explorer": [82, 36, 68, 64, 34, 76, 31, 55, 88, 84],
    "curator": [58, 77, 47, 91, 61, 49, 68, 72, 66, 38],
    "anchor": [31, 82, 44, 52, 88, 38, 86, 79, 42, 27],
    "spark": [74, 42, 91, 69, 45, 89, 26, 61, 81, 78],
}


def generate_dataset(rows: int, seed: int) -> pd.DataFrame:
    """Return a reproducible synthetic dataset."""
    if rows < len(ARCHETYPES):
        raise ValueError(f"rows must be at least {len(ARCHETYPES)}")

    rng = np.random.default_rng(seed)
    labels = np.array(list(ARCHETYPES))
    chosen = rng.choice(labels, size=rows, replace=True)

    records = []
    for idx, label in enumerate(chosen):
        mean = np.asarray(ARCHETYPES[label], dtype=float)
        vector = np.clip(rng.normal(mean, 11.5), 0, 100)
        row = {"sample_id": f"demo_{idx:04d}", "source_profile": label}
        row.update({name: round(float(value), 2) for name, value in zip(DIMENSIONS, vector)})
        records.append(row)

    return pd.DataFrame.from_records(records)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic Tasteprint preference data.")
    parser.add_argument("--rows", type=int, default=1200)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path, default=Path("demo_preferences.csv"))
    args = parser.parse_args()

    df = generate_dataset(args.rows, args.seed)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.output, index=False)
    print(f"Wrote {len(df):,} synthetic rows to {args.output}")


if __name__ == "__main__":
    main()
