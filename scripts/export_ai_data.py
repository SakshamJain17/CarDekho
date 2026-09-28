"""Export genuine v3 presentation data, never a JavaScript prediction model."""
import hashlib
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from model_pipeline import DATASETS, load_dataset
from train import feature_importance


def main():
    source = ROOT / "data" / DATASETS["v3"]["filename"]
    raw = pd.read_csv(source)
    cleaned, audit = load_dataset("v3")
    metadata = json.loads((ROOT / "outputs/v3/metadata.json").read_text())
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if digest != metadata["source_sha256"]:
        raise ValueError("Source data changed since training; retrain before exporting.")
    metrics = pd.read_csv(ROOT / "outputs/v3/model_metrics.csv").to_dict("records")
    predictions = pd.read_csv(ROOT / "outputs/v3/test_predictions.csv")
    forest = joblib.load(ROOT / "models/v3/random_forest.joblib")
    if forest["source_sha256"] != digest:
        raise ValueError("Random Forest provenance does not match the dataset.")
    summary = json.loads((ROOT / "web/data/v3.json").read_text())
    counts, edges = np.histogram(cleaned["selling_price"], bins=18)
    preview = raw.head(6).astype(object).where(pd.notna(raw.head(6)), None).to_dict("records")
    payload = {
        "name": "CarDekho AI", "dataset": "v3", "filename": source.name,
        "source_sha256": digest, "raw_columns": raw.columns.tolist(),
        "raw_rows": len(raw), "source_variables": len(raw.columns),
        "audit": audit, "target": "selling_price", "metadata": metadata,
        "metrics": metrics, "selected_model": metadata["model_name"],
        "preview": preview, "fields": summary["fields"], "profiles": summary["profiles"],
        "feature_importance": {"model": "Random Forest", "aggregation": "sum of fitted one-hot columns for each original feature", "items": feature_importance(forest["model"], "v3").to_dict("records")},
        "test_predictions": {name: frame[["row_index", "actual_inr", "predicted_inr"]].to_dict("records") for name, frame in predictions.groupby("model", sort=False)},
        "price_distribution": [{"price_lakh": float((edges[i] + edges[i + 1]) / 200_000), "count": int(count)} for i, count in enumerate(counts)],
        "split": {"method": "feature-hash group separation", "train": int(metrics[0]["train_rows"]), "validation": int(metrics[0]["validation_rows"]), "test": int(metrics[0]["test_rows"]), "seeds": [42, 43]},
    }
    destination = ROOT / "web/data/ai-project.json"
    destination.write_text(json.dumps(payload, allow_nan=False, separators=(",", ":")), encoding="utf-8")
    print(f"Exported genuine v3 project data: {len(raw)} raw records, {len(metrics)} models, {len(predictions)} held-out predictions.")


if __name__ == "__main__":
    main()
