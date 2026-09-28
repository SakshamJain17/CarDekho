"""Four independent CarDekho experiments with group-separated evaluation."""

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeRegressor

ROOT = Path(__file__).resolve().parent
TARGET = "selling_price"
COMMON_NUMERIC = ["year", "km_driven"]
COMMON_CATEGORICAL = ["brand", "vehicle_name", "fuel", "seller_type", "transmission", "owner"]
DATASETS = {
    "v3": {
        "filename": "Car details v3.csv", "label": "Car details v3",
        "numeric": COMMON_NUMERIC + ["mileage", "engine", "max_power", "seats"],
        "categorical": COMMON_CATEGORICAL,
        "notes": "Detailed car listings. Mileage keeps its original km/l or km/kg unit; fuel is a feature. Torque is excluded because its units and formatting vary.",
    },
    "v4": {
        "filename": "car details v4.csv", "label": "Car details v4",
        "numeric": COMMON_NUMERIC + ["engine", "max_power", "seats", "length", "width", "height", "fuel_tank_capacity"],
        "categorical": COMMON_CATEGORICAL + ["location", "color", "drivetrain"],
        "notes": "Includes location, dimensions and drivetrain, but no mileage. Torque is excluded. Some luxury vehicles create large price outliers.",
    },
    "basic": {
        "filename": "CAR DETAILS FROM CAR DEKHO.csv", "label": "Basic CarDekho listings",
        "numeric": COMMON_NUMERIC, "categorical": COMMON_CATEGORICAL,
        "notes": "Basic vehicle details without engine, power or mileage specifications.",
    },
    "small": {
        "filename": "car data.csv", "label": "Small vehicle dataset (cars + motorcycles)",
        "numeric": COMMON_NUMERIC + ["present_price", "previous_owners"],
        "categorical": ["vehicle_name", "fuel", "seller_type", "transmission"],
        "notes": "Contains cars and motorcycles. Selling_Price and Present_Price are treated as INR lakhs and multiplied by 100,000. This is an explicit assumption inferred from the values; no supplied data dictionary confirms units. Owner is preserved as a numeric count. Present price must be known at prediction time.",
    },
}
DATA_PATH = ROOT / "data" / DATASETS["v3"]["filename"]
NUMERIC_FEATURES = DATASETS["v3"]["numeric"]
CATEGORICAL_FEATURES = DATASETS["v3"]["categorical"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def features_for(key):
    spec = DATASETS[key]
    return spec["numeric"] + spec["categorical"]


def _number_from_text(series):
    return pd.to_numeric(
        series.astype("string").str.extract(r"(\d+(?:\.\d+)?)")[0], errors="coerce"
    ).astype(float)


def load_dataset(key, path=None):
    """Normalize each schema without merging unrelated populations."""
    spec = DATASETS[key]
    path = Path(path) if path is not None else ROOT / "data" / spec["filename"]
    raw = pd.read_csv(path)
    data = raw.drop_duplicates().copy()
    if key == "v4":
        data = data.rename(columns={
            "Make": "brand", "Model": "vehicle_name", "Price": TARGET,
            "Year": "year", "Kilometer": "km_driven", "Fuel Type": "fuel",
            "Transmission": "transmission", "Location": "location", "Color": "color",
            "Owner": "owner", "Seller Type": "seller_type", "Engine": "engine",
            "Max Power": "max_power", "Drivetrain": "drivetrain", "Length": "length",
            "Width": "width", "Height": "height", "Seating Capacity": "seats",
            "Fuel Tank Capacity": "fuel_tank_capacity",
        })
    elif key == "small":
        data = data.rename(columns={
            "Car_Name": "vehicle_name", "Year": "year", "Selling_Price": TARGET,
            "Present_Price": "present_price", "Kms_Driven": "km_driven",
            "Fuel_Type": "fuel", "Seller_Type": "seller_type",
            "Transmission": "transmission", "Owner": "previous_owners",
        })
        for col in [TARGET, "present_price"]:
            data[col] = pd.to_numeric(data[col], errors="coerce") * 100_000
    else:
        if "name" not in data:
            raise ValueError("Missing name column")
        data["vehicle_name"] = data["name"]
        data["brand"] = data["name"].astype("string").str.split().str[0]
    required = set(features_for(key) + [TARGET])
    missing = required.difference(data.columns)
    if missing:
        raise ValueError(f"{spec['filename']} is missing columns: {sorted(missing)}")
    for col in spec["numeric"] + [TARGET]:
        if col in ("mileage", "engine", "max_power"):
            data[col] = _number_from_text(data[col])
            data.loc[data[col] <= 0, col] = np.nan
        else:
            data[col] = pd.to_numeric(data[col], errors="coerce")
    for col in spec["categorical"]:
        data[col] = data[col].map(
            lambda value: str(value).strip().lower() if pd.notna(value) else np.nan
        ).replace("", np.nan)
    data = data.replace([np.inf, -np.inf], np.nan)
    valid = data[TARGET].notna() & (data[TARGET] > 0)
    for col in COMMON_NUMERIC:
        valid &= data[col].notna()
    valid &= (data["km_driven"] >= 0) & data["year"].between(1886, 2100)
    invalid_rows = int((~valid).sum())
    data = data.loc[valid, features_for(key) + [TARGET]].copy()
    before = len(data)
    data = data.drop_duplicates().reset_index(drop=True)
    audit = {
        "dataset": key, "filename": spec["filename"], "raw_rows": len(raw),
        "raw_exact_duplicates": int(raw.duplicated().sum()),
        "invalid_rows_removed": invalid_rows,
        "normalized_duplicates_removed": before - len(data), "clean_rows": len(data),
        "feature_count": len(features_for(key)),
        "missing_feature_cells": int(data[features_for(key)].isna().sum().sum()),
        "price_unit": "INR", "notes": spec["notes"],
    }
    return data, audit


def load_and_clean_data(path=DATA_PATH):
    return load_dataset("v3", path)[0]


def split_indices(data, key):
    """Identical feature rows stay in one split even if their prices differ."""
    groups = pd.util.hash_pandas_object(data[features_for(key)], index=False)
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    development, test = next(splitter.split(data, groups=groups))
    inner = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=43)
    train_pos, valid_pos = next(inner.split(data.iloc[development], groups=groups.iloc[development]))
    return development[train_pos], development[valid_pos], test


def make_preprocessor(key="v3"):
    spec = DATASETS[key]
    return ColumnTransformer([
        ("numeric", SimpleImputer(strategy="median"), spec["numeric"]),
        ("categorical", Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", min_frequency=2, sparse_output=False)),
        ]), spec["categorical"]),
    ])


def candidate_models():
    return {
        "Decision Tree": DecisionTreeRegressor(max_depth=18, min_samples_leaf=3, random_state=42),
        "Random Forest": RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=42, n_jobs=-1),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=300, learning_rate=0.04, max_depth=3, loss="huber", random_state=42),
    }


def build_pipeline(regressor, key="v3"):
    return Pipeline([("preprocessor", make_preprocessor(key)), ("regressor", regressor)])


def score(y, predictions):
    return {
        "mae": float(mean_absolute_error(y, predictions)),
        "rmse": float(mean_squared_error(y, predictions) ** 0.5),
        "r2": float(r2_score(y, predictions)),
    }


def train_experiment(data, key):
    """Select on validation RMSE, test on untouched groups, refit for deployment."""
    features = features_for(key)
    X, y = data[features], data[TARGET]
    train, validation, test = split_indices(data, key)
    development = np.concatenate([train, validation])
    results, candidates = [], candidate_models()
    # Finish selection before any test metrics are computed.
    for name, regressor in candidates.items():
        model = build_pipeline(clone(regressor), key)
        model.fit(X.iloc[train], y.iloc[train])
        metrics = score(y.iloc[validation], model.predict(X.iloc[validation]))
        results.append({"dataset": key, "model": name, **{f"validation_{k}": v for k, v in metrics.items()}})
    best_name = min(results, key=lambda row: row["validation_rmse"])["model"]
    baseline = score(y.iloc[test], np.full(len(test), y.iloc[development].median()))
    models, predictions = {}, []
    for row in results:
        name = row["model"]
        model = build_pipeline(clone(candidates[name]), key)
        model.fit(X.iloc[development], y.iloc[development])
        estimated = model.predict(X.iloc[test])
        row.update({f"test_{k}": v for k, v in score(y.iloc[test], estimated).items()})
        row.update({"selected": name == best_name, "train_rows": len(train), "validation_rows": len(validation), "test_rows": len(test), "baseline_test_mae": baseline["mae"], "baseline_test_rmse": baseline["rmse"]})
        predictions.append(pd.DataFrame({"dataset": key, "model": name, "row_index": test, "actual_inr": y.iloc[test].to_numpy(), "predicted_inr": estimated}))
        # Export a fresh pipeline fitted on all data only after evaluation.
        deployed = build_pipeline(clone(candidates[name]), key).fit(X, y)
        models[name] = deployed
    return best_name, models, pd.DataFrame(results), pd.concat(predictions, ignore_index=True)
