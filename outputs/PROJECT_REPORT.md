# CarDekho project report

## Objective

Estimate vehicle resale prices and compare Decision Tree, Random Forest and Gradient Boosting on four supplied datasets. Experiments remain separate because schemas, vehicle populations and observation periods differ.

## Data audit

| Dataset | Raw rows | Clean rows | Exact duplicates | Features |
|---|---:|---:|---:|---:|
| Car details v3 | 8128 | 6926 | 1202 | 12 |
| Car details v4 | 2059 | 2059 | 0 | 18 |
| Basic CarDekho listings | 4340 | 3577 | 763 | 8 |
| Small vehicle dataset (cars + motorcycles) | 301 | 299 | 2 | 8 |

## Method

Exact duplicates are removed before splitting. Identical modeled feature rows stay in a single group, including when their asking prices differ. Groups are split approximately 60% training, 20% validation and 20% test with fixed seeds 42 and 43. Median imputation and one-hot encoding are fitted inside each training pipeline. Rare categories are pooled; unknown categories are supported. Hyperparameters are fixed rather than tuned.

The lowest validation RMSE selects the model for each dataset. All candidates are then fitted on training plus validation data and evaluated on the same untouched test groups. The selected flag is never changed based on test performance. A development-set median-price predictor provides a baseline. Finally all three pipelines are refitted on the entire cleaned dataset and saved for demonstration; test predictions always come from the earlier evaluation models.

## Selected models and independent test results

| Dataset | Validation-selected model | Test MAE (INR) | Test RMSE (INR) | Test R² | Baseline RMSE (INR) |
|---|---|---:|---:|---:|---:|
| v3 | Gradient Boosting | 82,801 | 181,661 | 0.8721 | 518,471 |
| v4 | Gradient Boosting | 254,968 | 506,752 | 0.9206 | 1,953,576 |
| basic | Random Forest | 149,918 | 394,762 | 0.4930 | 570,397 |
| small | Gradient Boosting | 74,724 | 249,563 | 0.7363 | 486,920 |

## Dataset-specific decisions

- **Car details v3:** Detailed car listings. Mileage keeps its original km/l or km/kg unit; fuel is a feature. Torque is excluded because its units and formatting vary.
- **Car details v4:** Includes location, dimensions and drivetrain, but no mileage. Torque is excluded. Some luxury vehicles create large price outliers.
- **Basic CarDekho listings:** Basic vehicle details without engine, power or mileage specifications.
- **Small vehicle dataset (cars + motorcycles):** Contains cars and motorcycles. Selling_Price and Present_Price are treated as INR lakhs and multiplied by 100,000. This is an explicit assumption inferred from the values; no supplied data dictionary confirms units. Owner is preserved as a numeric count. Present price must be known at prediction time.

## Interpretation and limitations

MAE is the average absolute price error; RMSE puts more weight on large errors; R² measures improvement relative to the test-set mean. Scores across datasets are not an apples-to-apples ranking because their price ranges, features and populations differ. A validation-selected winner may have worse test results than another candidate: this is valid independent evaluation, not a reason to reselect using test data.

Prices are historical asking/listing prices, not verified transaction values or current market valuations. Random group splits do not measure future-year or geographic generalization. Vehicle condition, service history and accidents are absent. The small dataset has few rows and mixed cars/motorcycles, making its scores less stable. Its lakh-unit conversion remains an explicit assumption until a data dictionary is provided. No hyperparameter search or repeated cross-validation is claimed. Feature importance is impurity-based, aggregated over categories, and not a causal explanation.

## Reproducibility and deliverables

Run `python train.py` to reproduce all 12 experiments. `models/<dataset>/` contains all three full-data pipelines and `best_model.joblib`; `outputs/<dataset>/` contains cleaned data, metrics, held-out predictions, feature importance, metadata and three chart images. `outputs/all_model_metrics.csv` contains all comparisons. `outputs/data_audit.csv` records cleaning decisions. Original CSVs in `data/` are preserved.
