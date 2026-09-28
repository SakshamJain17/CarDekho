# CarDekho used-car price predictor

For the React-enhanced HTML website and GitHub/Vercel hosting, read `DEPLOYMENT.md`.
`index.html` loads the exported selected models and runs real predictions
directly in the browser. The Python/Streamlit workflow below remains available.

```bash
npm ci --ignore-scripts
npm run dev
```

Open <http://localhost:5173>. The React/TypeScript landing hero uses GSAP and
Tailwind 4; reusable UI components live in `components/ui/`. For a production
preview, run `npm run build` followed by `npm run preview` (port 4173).
The static site requires no Python prediction
server. After retraining, regenerate the website assets with `python export_web.py`.

Four independent experiments using all four supplied CarDekho CSVs. Each
compares Decision Tree, Random Forest and Gradient Boosting, selects its model
on validation RMSE, evaluates it on independent test groups, and saves all
three trained pipelines. The Streamlit app loads saved results for a fast demo.

## Datasets

| Key | Source file | Scope |
|---|---|---|
| `v3` | `Car details v3.csv` | Detailed car listings, engine/power/mileage |
| `v4` | `car details v4.csv` | Newer listings, location/dimensions/drivetrain |
| `basic` | `CAR DETAILS FROM CAR DEKHO.csv` | Basic car details |
| `small` | `car data.csv` | Cars and motorcycles, present price |

The datasets are kept separate: they have different features and vehicle
populations. Small-dataset prices are assumed to be INR lakhs and converted
to rupees; this assumption is clearly labeled because no data dictionary
was supplied. Other dataset price columns are treated as INR.

## Models

The project trains and evaluates:

1. Decision Tree Regressor
2. Random Forest Regressor
3. Gradient Boosting Regressor

Within each dataset, all models use the same feature set and group-separated
split: approximately 60% training, 20% validation and 20% test. Identical
feature rows stay together, even if listing prices differ. Imputation and
encoding are learned inside each training pipeline. The lowest validation
RMSE selects the winner before any test metrics are calculated. All three
models are finally refitted on the full cleaned dataset for demonstration.

## Setup

Python 3.9 or newer is required.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

## Train and save all models

```bash
python train.py
```

This reproduces 12 experiments and fills `models/` and `outputs/`:

- `models/<dataset>/decision_tree.joblib`, `random_forest.joblib`, `gradient_boosting.joblib`
- `models/<dataset>/best_model.joblib`: validation-selected model
- `outputs/<dataset>/model_metrics.csv`: validation and independent test results
- `outputs/<dataset>/test_predictions.csv`: held-out predictions for all three models
- `outputs/<dataset>/cleaned_data.csv`, `feature_importance.csv`, `metadata.json`
- `outputs/<dataset>/charts/`: comparison, diagnostics and dataset/feature charts
- `outputs/all_model_metrics.csv`, `data_audit.csv`, `PROJECT_REPORT.md`

To refresh just one experiment: `python train.py --dataset v4`.
Run the default all-dataset command to regenerate the aggregate report.
The old `artifacts/` files are prototype results retained for reference; the
finished application uses `models/` and `outputs/` exclusively.

Metadata includes source SHA-256 hashes, library versions, training time,
feature definitions and cleaning counts. Only load joblib files you trust.

## Run the web application

```bash
streamlit run main.py
```

Open <http://localhost:8501>. Switch datasets in the sidebar. The app provides
vehicle-specific inputs, a three-model comparison, data overview, and method
and limitations tabs. Brand and model choices are linked. Inputs outside the
observed numeric range are flagged. No models are retrained on app launch.

The interface references the local PTSD / ByteCoders website's monochrome
palette, oversized typography, glass panels and subtle motion. It includes
a responsive vehicle illustration, grouped vehicle inputs, valuation cards,
and matching dark charts. Styling lives in `assets/style.css`; presentation
components live in `ui.py`. The optional Google-hosted Bricolage font falls
back to Arial if unavailable. Reduced-motion preferences are respected.

## Can the four datasets be integrated?

Yes, with a separate pooled experiment. Normalize price units, manufacturer
and model names, and ownership categories. Use common features (vehicle
identity, year, kilometres, fuel, seller, transmission and ownership), or
explicitly handle missing specifications. Identify motorcycles before
building a car-only model, or preserve a vehicle-type feature in a mixed
vehicle model. Remove cross-source duplicates and keep repeated vehicles
in one evaluation split. Dataset labels alone should not substitute for
vehicle information at prediction time.

The existing four experiments are separate benchmarks, not a technical
requirement. A pooled model may gain coverage but could lose detail or learn
source-specific patterns; its performance must be measured, not assumed.
The styling update does not merge the datasets or alter trained models.

## Run tests

```bash
python -m unittest discover -s tests -v
```

## Project structure

```text
CarDekho/
├── data/                   # Four original CSVs
├── main.py                 # Streamlit interface
├── model_pipeline.py       # Schema adapters, grouped splits, model evaluation
├── train.py                # All experiments, export, charts and report
├── models/                 # Four bundles per dataset (16 total)
├── outputs/                # Metrics, data audit, charts and generated report
├── PRESENTATION_GUIDE.md   # Talking points, demo flow and viva questions
├── tests/test_model_pipeline.py
├── requirements.txt
└── README.md
```

## Presenting the project

Use `outputs/PROJECT_REPORT.md` for exact results and methodology, and
`PRESENTATION_GUIDE.md` for a 7–10 minute talk and live-demo steps. These
are historical listing-price models, not verified current-market valuations.
Scores across different datasets are not directly comparable. No tuning or
cross-validation results are claimed. Earlier prototype scores are obsolete.
