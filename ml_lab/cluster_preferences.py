"""Cluster Tasteprint preference vectors and report model quality.

The script uses KMeans as a transparent unsupervised-learning baseline. Ground-truth
`source_profile` labels are used only after fitting to measure whether the synthetic
clusters are recoverable; they are never passed into the model.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import adjusted_rand_score, silhouette_score
from sklearn.preprocessing import StandardScaler

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


def fit_clusters(df: pd.DataFrame, clusters: int = 4, seed: int = 42) -> tuple[pd.DataFrame, dict]:
    """Fit a standardized KMeans model and return predictions plus metrics."""
    missing = [column for column in DIMENSIONS if column not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")
    if len(df) < clusters:
        raise ValueError("Dataset must contain at least as many rows as clusters.")

    x = df[DIMENSIONS].astype(float)
    scaled = StandardScaler().fit_transform(x)

    model = KMeans(n_clusters=clusters, n_init=20, random_state=seed)
    cluster_ids = model.fit_predict(scaled)

    pca = PCA(n_components=2, random_state=seed)
    coords = pca.fit_transform(scaled)

    result = df.copy()
    result["cluster"] = cluster_ids
    result["pca_x"] = coords[:, 0]
    result["pca_y"] = coords[:, 1]

    metrics = {
        "rows": int(len(df)),
        "clusters": int(clusters),
        "silhouette_score": round(float(silhouette_score(scaled, cluster_ids)), 4),
        "pca_explained_variance_2d": round(float(pca.explained_variance_ratio_.sum()), 4),
    }

    if "source_profile" in df.columns:
        truth = pd.Categorical(df["source_profile"]).codes
        metrics["adjusted_rand_index"] = round(float(adjusted_rand_score(truth, cluster_ids)), 4)

    return result, metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Cluster Tasteprint preference vectors.")
    parser.add_argument("input", type=Path, nargs="?", default=Path("demo_preferences.csv"))
    parser.add_argument("--clusters", type=int, default=4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path, default=Path("clustered_preferences.csv"))
    parser.add_argument("--metrics", type=Path, default=Path("cluster_metrics.json"))
    args = parser.parse_args()

    df = pd.read_csv(args.input)
    result, metrics = fit_clusters(df, clusters=args.clusters, seed=args.seed)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.metrics.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(args.output, index=False)
    args.metrics.write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(metrics, indent=2))
    print(f"Wrote clustered rows to {args.output}")


if __name__ == "__main__":
    main()
