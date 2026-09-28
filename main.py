"""Streamlit demo loading the four reproducible, saved experiment results."""

from datetime import date
import hashlib
from html import escape

import joblib
import pandas as pd
import streamlit as st

from model_pipeline import DATASETS, ROOT, features_for, load_dataset
from ui import apply_style, render_footer, render_hero, render_method, render_result, section_heading

LABELS = {
    "year": "Manufacturing year", "km_driven": "Kilometres driven",
    "mileage": "Mileage (km/l or km/kg, according to fuel)", "engine": "Engine capacity (cc)",
    "max_power": "Maximum power (bhp)", "seats": "Seats", "present_price": "Present/new price (INR)",
    "previous_owners": "Number of previous owners", "fuel_tank_capacity": "Fuel tank capacity (litres)",
    "length": "Length (mm)", "width": "Width (mm)", "height": "Height (mm)",
    "brand": "Brand", "vehicle_name": "Vehicle model / variant", "fuel": "Fuel type",
    "seller_type": "Seller type", "owner": "Ownership history", "transmission": "Transmission",
    "location": "Location", "color": "Color", "drivetrain": "Drivetrain",
}


@st.cache_data
def get_data(key, source_mtime):
    return load_dataset(key)


@st.cache_resource
def load_bundle(key, model_mtime):
    return joblib.load(ROOT / "models" / key / "best_model.joblib")


def prediction_form(key, data, model, model_name):
    spec = DATASETS[key]
    # Filter model choices by brand to avoid impossible brand/model pairs.
    brand = None
    brand_column, vehicle_column = st.columns([1, 2])
    if "brand" in spec["categorical"]:
        with brand_column:
            brand = st.selectbox("Brand", sorted(data["brand"].dropna().unique()), key=f"{key}_brand", format_func=str.title)
    choices = data[data["brand"] == brand] if brand is not None else data
    with vehicle_column if brand is not None else st.container():
        vehicle = st.selectbox("Vehicle model / variant", sorted(choices["vehicle_name"].dropna().unique()), key=f"{key}_vehicle", format_func=str.title)
    example = choices[choices["vehicle_name"] == vehicle].iloc[0]
    values = {"vehicle_name": vehicle}
    if brand is not None:
        values["brand"] = brand
    st.caption("Details are prefilled from a matching listing. Adjust them to describe your vehicle.")
    with st.form(f"{key}_{vehicle}_details"):
        st.markdown('<div class="eyebrow">VEHICLE DETAILS / SPECIFICATIONS</div>', unsafe_allow_html=True)
        columns = st.columns(2)
        for i, feature in enumerate(spec["numeric"]):
            series = data[feature].dropna()
            default = example[feature] if pd.notna(example[feature]) else series.median()
            with columns[i % 2]:
                if feature in ("year", "km_driven", "seats", "previous_owners"):
                    lower = int(series.min()) if feature in ("year", "seats") else 0
                    upper = date.today().year if feature == "year" else None
                    values[feature] = st.number_input(LABELS[feature], min_value=lower, max_value=upper, value=int(default), step=1)
                else:
                    values[feature] = st.number_input(LABELS[feature], min_value=0.0, value=float(default), step=0.1)
        categories = [col for col in spec["categorical"] if col not in values]
        st.markdown('<div class="eyebrow" style="margin:24px 0 8px">OWNERSHIP / CONFIGURATION</div>', unsafe_allow_html=True)
        category_columns = st.columns(2)
        for i, feature in enumerate(categories):
            options = sorted(data[feature].dropna().unique())
            default = example[feature]
            with category_columns[i % 2]:
                values[feature] = st.selectbox(LABELS[feature], options, index=options.index(default) if default in options else 0, format_func=str.title)
        submitted = st.form_submit_button("Estimate resale price", type="primary")
    if submitted:
        sample = pd.DataFrame([values], columns=features_for(key))
        estimate = max(0.0, float(model.predict(sample)[0]))
        render_result(estimate, vehicle, model_name)
        st.success("Your estimate is ready.")
        outside = [LABELS[col] for col in spec["numeric"] if values[col] < data[col].min() or values[col] > data[col].max()]
        if outside:
            st.warning("Outside the dataset's observed range: " + ", ".join(outside))
        st.caption("Estimate learned from historical listings. Actual prices depend on vehicle condition and market changes.")


def main():
    st.set_page_config(page_title="CarDekho · Price Intelligence", page_icon="🚗", layout="wide")
    apply_style()
    st.sidebar.markdown('<div class="side-brand">CARDEKHO</div><div class="side-subtitle">VEHICLE PRICE LAB / WORKSPACE</div>', unsafe_allow_html=True)
    key = st.sidebar.selectbox("Dataset", list(DATASETS), format_func=lambda value: DATASETS[value]["label"], index=0, key="dataset")
    source = ROOT / "data" / DATASETS[key]["filename"]
    model_path = ROOT / "models" / key / "best_model.joblib"
    metrics_path = ROOT / "outputs" / key / "model_metrics.csv"
    if not model_path.exists() or not metrics_path.exists():
        st.info("Train the project first: `.venv/bin/python train.py`")
        st.stop()
    try:
        data, audit = get_data(key, source.stat().st_mtime_ns)
        bundle = load_bundle(key, model_path.stat().st_mtime_ns)
        if hashlib.sha256(source.read_bytes()).hexdigest() != bundle["source_sha256"]:
            st.error("The dataset changed after training. Run `python train.py` to refresh the saved results.")
            st.stop()
        metrics = pd.read_csv(metrics_path).sort_values("validation_rmse")
    except (OSError, ValueError, KeyError) as exc:
        st.error(f"Could not load the project: {exc}")
        st.stop()
    selected = metrics.loc[metrics["selected"]].iloc[0]
    st.sidebar.markdown(f'<div class="side-section">VALIDATION-SELECTED MODEL</div><div class="side-model">{escape(bundle["model_name"])}</div>', unsafe_allow_html=True)
    st.sidebar.metric("Independent test R²", f"{selected['test_r2']:.3f}")
    st.sidebar.metric("Test MAE", f"₹{selected['test_mae']:,.0f}")
    st.sidebar.metric("Test RMSE", f"₹{selected['test_rmse']:,.0f}")
    st.sidebar.caption(f"{len(data):,} cleaned records · Prices in INR")
    st.sidebar.markdown('<div class="side-note">Four complementary datasets.<br>One workspace to explore them.<br><br>Change the dataset above to load its saved model and results.</div>', unsafe_allow_html=True)
    render_hero(key, len(data), data["selling_price"].median(), selected["test_r2"])
    prediction, comparison, overview, explanation = st.tabs(["Predict price", "Model comparison", "Dataset overview", "Method & limitations"])
    with prediction:
        section_heading("01", "Your vehicle. Your estimate.", "Choose a model, refine its details, and explore an estimate based on historical vehicle listings.")
        if key == "small":
            st.info("This dataset contains cars and motorcycles. Its source price columns are assumed to be in lakhs; this app displays rupees.")
        prediction_form(key, data, bundle["model"], bundle["model_name"])
    with comparison:
        section_heading("02", "The models, side by side.", "Compare three algorithms on the same dataset. Validation selects the model; a separate test set measures its performance.")
        display = metrics[["model", "selected", "validation_rmse", "test_mae", "test_rmse", "test_r2"]].copy()
        display.columns = ["Model", "Selected", "Validation RMSE (INR)", "Test MAE (INR)", "Test RMSE (INR)", "Test R²"]
        st.dataframe(display, hide_index=True, width="stretch")
        st.image(str(ROOT / "outputs" / key / "charts" / "model_comparison.png"))
        st.markdown(f'<div class="model-note">Selected model: <strong>{escape(bundle["model_name"])}</strong> · Median-price baseline test RMSE: <strong>₹{selected["baseline_test_rmse"]:,.0f}</strong><br>Model selection uses validation RMSE only. A different algorithm may perform better on the independent test set.</div>', unsafe_allow_html=True)
        st.download_button("Download results CSV", metrics.to_csv(index=False), file_name=f"{key}_model_metrics.csv", mime="text/csv")
    with overview:
        section_heading("03", "Look beneath the listings.", "Understand the records, price distribution, and features behind this dataset's predictions.")
        a, b, c = st.columns(3)
        a.metric("Original records", f"{audit['raw_rows']:,}")
        b.metric("Cleaned records", f"{len(data):,}")
        c.metric("Median price", f"₹{data['selling_price'].median():,.0f}")
        st.write(DATASETS[key]["notes"])
        st.image(str(ROOT / "outputs" / key / "charts" / "dataset_and_features.png"))
        with st.expander("Data preview and missing values"):
            st.dataframe(data.head(50), hide_index=True, width="stretch")
            st.dataframe(data.isna().sum().rename("Missing values"))
    with explanation:
        section_heading("04", "Built on evidence.", "Follow the evaluation process and understand what these estimates can—and cannot—tell you.")
        render_method()
        st.write("Identical feature rows stay together. Approximately 60% of groups train the models, 20% select the winner, and 20% provide independent test results. Imputation and encoding are fitted within each training pipeline. Saved demo models are then refitted on all cleaned data.")
        st.write("MAE shows average absolute error in rupees. RMSE emphasizes large errors. R² compares error with predicting the test-set mean. Dataset scores reflect different populations and cannot be compared as a single ranking.")
        st.write("These are historical listing prices. Vehicle condition, accidents and service history are absent. Scores do not establish current-market or future-year accuracy. Small-dataset price units are an explicit assumption. Feature importance describes the fitted trees, not cause and effect.")
        st.image(str(ROOT / "outputs" / key / "charts" / "prediction_diagnostics.png"))
    render_footer()


if __name__ == "__main__":
    main()
