# Tasteprint ML Lab

This folder is a small Python/ML companion to the main Tasteprint product. It explores one question: **can the shared 10-dimensional Tasteprint preference space recover useful segments without feeding a model demographic or protected-attribute data?**

It is intentionally a portfolio/research sandbox, not a claim that Tasteprint currently runs a trained production model.

## What it demonstrates

- Python data generation and analysis
- pandas / NumPy data pipelines
- scikit-learn preprocessing and KMeans clustering
- PCA for 2D visualization coordinates
- model evaluation with silhouette score and Adjusted Rand Index
- reproducible experiments with fixed random seeds
- unit tests
- responsible-AI documentation that separates synthetic evidence from real-user evidence

## Quick start

```bash
cd ml_lab
python -m venv .venv
```

Activate the environment, then install dependencies:

```bash
pip install -r requirements.txt
```

Generate a synthetic dataset:

```bash
python generate_demo_data.py --rows 1200
```

Train/evaluate the clustering baseline:

```bash
python cluster_preferences.py demo_preferences.csv
```

Run tests:

```bash
python -m unittest test_ml_lab.py
```

The clustering script writes:

- `clustered_preferences.csv` with cluster IDs and PCA coordinates
- `cluster_metrics.json` with model-quality metrics

## Why synthetic data?

Tasteprint's existing product deliberately avoids pretending that calibration or recommendation weights have been learned from users before enough real evidence exists. This ML lab follows the same rule.

The generator creates four overlapping fictional preference profiles on the same 0-100 dimensions used by Tasteprint Passport. `source_profile` is never given to KMeans. It is kept only so the experiment can calculate Adjusted Rand Index afterward and confirm whether the unsupervised model recovers the hidden structure.

With real opt-in data, the same pipeline could be used as a starting point for research, but production use would require consent, privacy review, holdout evaluation, bias checks, monitoring, and a clear reason that ML improves the user experience over the current explainable rules.

## Portfolio talking point

> I built Tasteprint as an explainable recommendation product, then added a separate Python ML lab to test whether its shared preference representation contained recoverable structure. I used synthetic data so I could demonstrate the modeling pipeline without pretending I had real-user evidence that I didn't have.

That distinction is deliberate: the project shows both ML implementation and restraint about what the model can actually claim.
