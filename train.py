"""Reproduce all 12 experiments, export models and a presentation report."""

import argparse
import hashlib
import json
import platform
from datetime import datetime, timezone
from importlib.metadata import version
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from model_pipeline import DATASETS, ROOT, features_for, load_dataset, train_experiment

MODEL_SLUGS = {"Decision Tree": "decision_tree", "Random Forest": "random_forest", "Gradient Boosting": "gradient_boosting"}


def feature_importance(model, key):
    spec = DATASETS[key]
    values = model.named_steps["regressor"].feature_importances_
    encoder = model.named_steps["preprocessor"].named_transformers_["categorical"].named_steps["onehot"]
    result = dict(zip(spec["numeric"], values[:len(spec["numeric"])]))
    start = len(spec["numeric"])
    for feature, categories, infrequent in zip(spec["categorical"], encoder.categories_, encoder.infrequent_categories_):
        width = len(categories) - (len(infrequent) - 1 if infrequent is not None else 0)
        result[feature] = float(values[start:start + width].sum())
        start += width
    return pd.DataFrame({"feature": result.keys(), "importance": result.values()}).sort_values("importance", ascending=False)


def make_charts(data, key, metrics, predictions, importance, directory):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.rcParams.update({
        "figure.dpi": 140, "figure.facecolor": "#141416", "axes.facecolor": "#141416",
        "text.color": "#f5f5f4", "axes.labelcolor": "#c4c6c9", "axes.edgecolor": "#45454a",
        "xtick.color": "#999ca2", "ytick.color": "#999ca2", "font.size": 10,
        "axes.spines.top": False, "axes.spines.right": False,
        "savefig.facecolor": "#141416",
    })
    charts = directory / "charts"
    charts.mkdir(exist_ok=True)
    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    axes[0].bar(metrics["model"], metrics["test_rmse"], color="#d9dcde", width=0.6)
    axes[0].set_ylabel("Test RMSE (INR)")
    axes[0].tick_params(axis="x", labelrotation=15)
    axes[1].bar(metrics["model"], metrics["test_r2"], color="#92959e", width=0.6)
    axes[1].set_ylabel("Test R²")
    axes[1].tick_params(axis="x", labelrotation=15)
    fig.suptitle(DATASETS[key]["label"])
    fig.tight_layout()
    fig.savefig(charts / "model_comparison.png")
    plt.close(fig)
    selected = metrics.loc[metrics["selected"], "model"].iloc[0]
    p = predictions[predictions["model"] == selected]
    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    axes[0].scatter(p["actual_inr"], p["predicted_inr"], s=12, alpha=0.5, color="#d9dcde")
    maximum = max(p["actual_inr"].max(), p["predicted_inr"].max())
    axes[0].plot([0, maximum], [0, maximum], "--", color="grey")
    axes[0].set(xlabel="Actual price (INR)", ylabel="Predicted price (INR)", title=f"{selected}: test predictions")
    axes[1].hist(p["predicted_inr"] - p["actual_inr"], bins=35, color="#92959e")
    axes[1].set(xlabel="Prediction minus actual (INR)", ylabel="Listings", title="Test residuals")
    fig.tight_layout()
    fig.savefig(charts / "prediction_diagnostics.png")
    plt.close(fig)
    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    axes[0].hist(data["selling_price"] / 100_000, bins=40, color="#d9dcde")
    axes[0].set(xlabel="Price (INR lakhs)", ylabel="Listings", title="Price distribution")
    top = importance.head(10).iloc[::-1]
    axes[1].barh(top["feature"], top["importance"], color="#92959e")
    axes[1].set(xlabel="Aggregated impurity importance", title=f"{selected}: feature importance")
    fig.tight_layout()
    fig.savefig(charts / "dataset_and_features.png")
    plt.close(fig)


def write_report(metrics, audits):
    selected = metrics[metrics["selected"]]
    lines = ["# CarDekho project report", "", "## Objective", "", "Estimate vehicle resale prices and compare Decision Tree, Random Forest and Gradient Boosting on four supplied datasets. Experiments remain separate because schemas, vehicle populations and observation periods differ.", "", "## Data audit", "", "| Dataset | Raw rows | Clean rows | Exact duplicates | Features |", "|---|---:|---:|---:|---:|"]
    for a in audits:
        lines.append(f"| {DATASETS[a['dataset']]['label']} | {a['raw_rows']} | {a['clean_rows']} | {a['raw_exact_duplicates']} | {a['feature_count']} |")
    lines += ["", "## Method", "", "Exact duplicates are removed before splitting. Identical modeled feature rows stay in a single group, including when their asking prices differ. Groups are split approximately 60% training, 20% validation and 20% test with fixed seeds 42 and 43. Median imputation and one-hot encoding are fitted inside each training pipeline. Rare categories are pooled; unknown categories are supported. Hyperparameters are fixed rather than tuned.", "", "The lowest validation RMSE selects the model for each dataset. All candidates are then fitted on training plus validation data and evaluated on the same untouched test groups. The selected flag is never changed based on test performance. A development-set median-price predictor provides a baseline. Finally all three pipelines are refitted on the entire cleaned dataset and saved for demonstration; test predictions always come from the earlier evaluation models.", "", "## Selected models and independent test results", "", "| Dataset | Validation-selected model | Test MAE (INR) | Test RMSE (INR) | Test R² | Baseline RMSE (INR) |", "|---|---|---:|---:|---:|---:|"]
    for _, r in selected.iterrows():
        lines.append(f"| {r['dataset']} | {r['model']} | {r['test_mae']:,.0f} | {r['test_rmse']:,.0f} | {r['test_r2']:.4f} | {r['baseline_test_rmse']:,.0f} |")
    lines += ["", "## Dataset-specific decisions", ""]
    for key, spec in DATASETS.items():
        lines += [f"- **{spec['label']}:** {spec['notes']}"]
    lines += ["", "## Interpretation and limitations", "", "MAE is the average absolute price error; RMSE puts more weight on large errors; R² measures improvement relative to the test-set mean. Scores across datasets are not an apples-to-apples ranking because their price ranges, features and populations differ. A validation-selected winner may have worse test results than another candidate: this is valid independent evaluation, not a reason to reselect using test data.", "", "Prices are historical asking/listing prices, not verified transaction values or current market valuations. Random group splits do not measure future-year or geographic generalization. Vehicle condition, service history and accidents are absent. The small dataset has few rows and mixed cars/motorcycles, making its scores less stable. Its lakh-unit conversion remains an explicit assumption until a data dictionary is provided. No hyperparameter search or repeated cross-validation is claimed. Feature importance is impurity-based, aggregated over categories, and not a causal explanation.", "", "## Reproducibility and deliverables", "", "Run `python train.py` to reproduce all 12 experiments. `models/<dataset>/` contains all three full-data pipelines and `best_model.joblib`; `outputs/<dataset>/` contains cleaned data, metrics, held-out predictions, feature importance, metadata and three chart images. `outputs/all_model_metrics.csv` contains all comparisons. `outputs/data_audit.csv` records cleaning decisions. Original CSVs in `data/` are preserved."]
    (ROOT / "outputs" / "PROJECT_REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", choices=["all"] + list(DATASETS), default="all")
    args = parser.parse_args()
    keys = list(DATASETS) if args.dataset == "all" else [args.dataset]
    all_metrics, audits = [], []
    for key in keys:
        print(f"Training {key}...", flush=True)
        data, audit = load_dataset(key)
        best_name, models, metrics, predictions = train_experiment(data, key)
        model_dir, output_dir = ROOT / "models" / key, ROOT / "outputs" / key
        model_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)
        source = ROOT / "data" / DATASETS[key]["filename"]
        metadata = {"dataset": key, "model_name": best_name, "features": features_for(key), "training_rows": len(data), "trained_at_utc": datetime.now(timezone.utc).isoformat(), "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(), "price_unit": "INR", "selection": "lowest validation RMSE", "audit": audit, "python_version": platform.python_version(), "packages": {name: version(name) for name in ("pandas", "numpy", "scikit-learn", "joblib", "matplotlib", "streamlit")}}
        for name, model in models.items():
            bundle = {**metadata, "model_name": name, "model": model}
            joblib.dump(bundle, model_dir / f"{MODEL_SLUGS[name]}.joblib", compress=3)
            if name == best_name:
                joblib.dump(bundle, model_dir / "best_model.joblib", compress=3)
        importance = feature_importance(models[best_name], key)
        data.to_csv(output_dir / "cleaned_data.csv", index=False)
        metrics.to_csv(output_dir / "model_metrics.csv", index=False)
        predictions.to_csv(output_dir / "test_predictions.csv", index=False)
        importance.to_csv(output_dir / "feature_importance.csv", index=False)
        (output_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        make_charts(data, key, metrics, predictions, importance, output_dir)
        audits.append(audit)
        all_metrics.append(metrics)
        print(metrics[["model", "validation_rmse", "test_mae", "test_rmse", "test_r2", "selected"]].to_string(index=False), flush=True)
        print(f"Selected {best_name}\n", flush=True)
    if args.dataset == "all":
        metrics = pd.concat(all_metrics, ignore_index=True)
        metrics.to_csv(ROOT / "outputs" / "all_model_metrics.csv", index=False)
        pd.DataFrame(audits).to_csv(ROOT / "outputs" / "data_audit.csv", index=False)
        write_report(metrics, audits)
    print("Models and outputs saved successfully.")


if __name__ == "__main__":
    main()
