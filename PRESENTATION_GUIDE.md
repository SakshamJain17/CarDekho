# CarDekho presentation guide

Suggested talk length: 7–10 minutes, followed by a live demonstration.

## 1. Problem and objective

"Our goal is to estimate a used vehicle's listing price from its available details and compare three regression algorithms. The estimate is a decision aid based on historical examples."

## 2. Four datasets, four experiments

Show `outputs/data_audit.csv`. Explain the basic listings, detailed v3 listings, richer v4 listings and small mixed vehicle dataset. They have different columns, price distributions and vehicle populations, so we evaluate them separately. Mention the explicit lakh-unit assumption in the small dataset.

## 3. Data preparation

Explain removal of exact duplicates, numeric parsing of engine/power/mileage, missing-value imputation and categorical encoding. The raw CSVs remain unchanged. Torque is excluded because its formatting and units vary.

## 4. Fair evaluation

"Identical feature rows stay in one split so repeated listings cannot inflate our results. We use approximately 60% training, 20% validation and 20% test groups. Validation RMSE selects the winner; the untouched test set evaluates performance. All preprocessing is fitted inside the pipeline."

## 5. The three models

- Decision Tree: interpretable splits that learn nonlinear relationships; prone to overfitting.
- Random Forest: averages many trees to reduce instability.
- Gradient Boosting: sequentially adds trees to improve predictions; our Huber loss reduces sensitivity to extreme errors.

All use fixed, reproducible parameters. Do not claim hyperparameter optimization or repeated cross-validation.

## 6. Results

Use the generated `outputs/PROJECT_REPORT.md` for exact figures and each dataset's `charts/model_comparison.png` for visuals. MAE is average absolute error, RMSE penalizes large errors, and R² compares against the test-set mean. Show the median-price baseline. Compare algorithms within a dataset; avoid claiming that a higher R² on one dataset means it is universally better.

## 7. Error analysis

Show `prediction_diagnostics.png`: points near the diagonal indicate accurate predictions; large residuals expose difficult listings. Show the price distribution to explain luxury outliers. Feature importance is descriptive, not causal.

## 8. Live demo

1. Run `.venv/bin/streamlit run main.py` from the project directory.
2. Use v3 first. Show the selected model and independent test metrics.
3. Choose a brand and model, adjust the prefilled vehicle details, and click **Estimate resale price**.
4. Switch to v4 and demonstrate location and extra specifications.
5. Open the model comparison, dataset overview and method tabs.
6. Explain that the app loads saved models; it does not retrain on each launch.

## 9. Limitations and next steps

Historical asking prices do not guarantee current transaction values. Vehicle condition, accident history and service records are missing. The small mixed dataset provides less stable evidence. Next steps include a confirmed data dictionary, more recent records, temporal evaluation, tuning with cross-validation and uncertainty estimation.

## Questions to prepare for

**Why three algorithms?** To compare a single tree, an averaging ensemble and a sequential ensemble under the same evaluation conditions.

**Why not combine all four datasets?** Their features, populations and price distributions differ, and there may be overlap. Separate experiments preserve these distinctions and avoid forcing missing specifications into a pooled model.

**Why can another model have a better test score than the selected model?** We choose using validation data before examining test results. Reselecting on test performance would undermine independent evaluation.

**How do you handle unknown categories?** The encoder supports unseen categories; predictions remain possible, but evidence for unseen vehicle types is limited.

**What is saved?** Three fitted pipelines plus a best-model bundle per dataset, test predictions, metrics, cleaned tables, source hashes, metadata and charts.

**Why did the results change from the first demo?** The earlier prototype used one dataset and a simple random split. The final evaluation groups identical feature rows and separates model selection from testing, giving a more defensible estimate of performance.
