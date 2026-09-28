"""Export fitted tree ensembles for equivalent, browser-only inference."""

import json
import shutil

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor

from main import LABELS
from model_pipeline import DATASETS, ROOT, features_for, load_dataset

WEB_DATA = ROOT / "web" / "data"


def safe_value(value):
    if pd.isna(value):
        return None
    if isinstance(value, (np.integer, np.floating)):
        return value.item()
    return value


def export_model(bundle, key):
    model = bundle["model"]
    preprocessing = model.named_steps["preprocessor"]
    imputer = preprocessing.named_transformers_["numeric"]
    categorical = preprocessing.named_transformers_["categorical"]
    encoder = categorical.named_steps["onehot"]
    mappings, offset = [], len(DATASETS[key]["numeric"])
    for feature, categories, infrequent, fill in zip(
        DATASETS[key]["categorical"], encoder.categories_,
        encoder.infrequent_categories_, categorical.named_steps["imputer"].statistics_,
    ):
        pooled = set(infrequent) if infrequent is not None else set()
        regular = [value for value in categories if value not in pooled]
        positions = {str(value): offset + i for i, value in enumerate(regular)}
        for value in pooled:
            positions[str(value)] = offset + len(regular)
        width = len(regular) + bool(pooled)
        mappings.append({"feature": feature, "positions": positions, "fill": str(fill), "unknown_position": None})
        offset += width
    estimator = model.named_steps["regressor"]
    if isinstance(estimator, GradientBoostingRegressor):
        kind = "gradient_boosting"
        trees = estimator.estimators_.ravel()
        initial = float(estimator.init_.constant_[0, 0])
        learning_rate = estimator.learning_rate
    elif isinstance(estimator, RandomForestRegressor):
        kind = "random_forest"
        trees = estimator.estimators_
        initial, learning_rate = 0.0, 1.0
    elif isinstance(estimator, DecisionTreeRegressor):
        kind = "decision_tree"
        trees = [estimator]
        initial, learning_rate = 0.0, 1.0
    else:
        raise ValueError(f"Unsupported selected model: {type(estimator).__name__}")
    nodes = []
    for tree_model in trees:
        tree = tree_model.tree_
        # Leaves contain a single output; branches contain their feature and children.
        nodes.append([
            [float(tree.value[i, 0, 0])] if tree.children_left[i] == -1 else
            [int(tree.feature[i]), float(tree.threshold[i]), int(tree.children_left[i]), int(tree.children_right[i])]
            for i in range(tree.node_count)
        ])
    return {
        "version": 1, "dataset": key, "model_name": bundle["model_name"],
        "source_sha256": bundle["source_sha256"], "kind": kind,
        "numeric_features": DATASETS[key]["numeric"],
        "numeric_fill": [float(value) for value in imputer.statistics_],
        "categorical": mappings, "encoded_width": offset,
        "initial": initial, "learning_rate": learning_rate, "trees": nodes,
    }


def export_dataset(key):
    data, audit = load_dataset(key)
    bundle = joblib.load(ROOT / "models" / key / "best_model.joblib")
    exported = export_model(bundle, key)
    model_file = WEB_DATA / f"{key}.model.json"
    model_file.write_text(json.dumps(exported, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    fields = []
    for feature in DATASETS[key]["numeric"]:
        values = data[feature].dropna()
        fields.append({"name": feature, "label": LABELS[feature], "type": "number", "min": float(values.min()), "max": float(values.max()), "default": float(values.median()), "integer": feature in ("year", "km_driven", "seats", "previous_owners")})
    for feature in DATASETS[key]["categorical"]:
        fields.append({"name": feature, "label": LABELS[feature], "type": "select", "options": sorted(data[feature].dropna().unique().tolist())})
    identities = ["brand", "vehicle_name"] if "brand" in data else ["vehicle_name"]
    profiles = [{feature: safe_value(row[feature]) for feature in features_for(key)} for _, row in data.drop_duplicates(identities).iterrows()]
    path = ROOT / "outputs" / key
    metrics = pd.read_csv(path / "model_metrics.csv").to_dict(orient="records")
    summary = {
        "key": key, "label": DATASETS[key]["label"], "notes": DATASETS[key]["notes"],
        "audit": audit, "median_price": float(data["selling_price"].median()),
        "model_name": bundle["model_name"], "source_sha256": bundle["source_sha256"],
        "model_url": f"web/data/{key}.model.json", "model_bytes": model_file.stat().st_size,
        "fields": fields, "profiles": profiles, "metrics": metrics,
        "importance": pd.read_csv(path / "feature_importance.csv").to_dict(orient="records"),
    }
    (WEB_DATA / f"{key}.json").write_text(json.dumps(summary, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    destination = ROOT / "web" / "charts" / key
    destination.mkdir(parents=True, exist_ok=True)
    for file in (path / "charts").glob("*.png"):
        shutil.copy2(file, destination / file.name)
    shutil.copy2(path / "model_metrics.csv", WEB_DATA / f"{key}.metrics.csv")
    # A sample of held-out input rows plus edge cases checks JavaScript equivalence.
    predictions = pd.read_csv(path / "test_predictions.csv")
    indices = predictions["row_index"].drop_duplicates().head(25).tolist()
    samples = data.loc[indices, features_for(key)].copy()
    unseen = data[features_for(key)].iloc[[0]].copy()
    unseen[DATASETS[key]["categorical"]] = "unknown-category"
    unseen[DATASETS[key]["numeric"][0]] = np.nan
    samples = pd.concat([samples, unseen], ignore_index=True)
    expected = bundle["model"].predict(samples)
    cases = [{"input": {feature: safe_value(row[feature]) for feature in features_for(key)}, "expected": float(expected[i])} for i, (_, row) in enumerate(samples.iterrows())]
    (ROOT / "tests" / "web_fixtures" / f"{key}.json").write_text(json.dumps(cases, allow_nan=False), encoding="utf-8")
    print(f"{key}: exported {bundle['model_name']} ({model_file.stat().st_size / 1_000_000:.2f} MB)")
    return {"key": key, "label": summary["label"], "summary_url": f"web/data/{key}.json"}


def main():
    WEB_DATA.mkdir(parents=True, exist_ok=True)
    (ROOT / "tests" / "web_fixtures").mkdir(parents=True, exist_ok=True)
    datasets = [export_dataset(key) for key in DATASETS]
    (WEB_DATA / "catalog.json").write_text(json.dumps({"datasets": datasets}, indent=2), encoding="utf-8")
    shutil.copy2(ROOT / "outputs" / "PROJECT_REPORT.md", WEB_DATA / "PROJECT_REPORT.md")
    shutil.copy2(ROOT / "PRESENTATION_GUIDE.md", WEB_DATA / "PRESENTATION_GUIDE.md")


if __name__ == "__main__":
    main()
