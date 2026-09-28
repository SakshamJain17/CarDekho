"""Check exported results and run predictions through all four app flows."""

import hashlib
import unittest

import joblib
import numpy as np
import pandas as pd
from streamlit.testing.v1 import AppTest

from model_pipeline import DATASETS, ROOT, features_for, load_dataset, score


class SavedProjectTests(unittest.TestCase):
    def test_all_exports_and_test_metrics_match(self):
        for key, spec in DATASETS.items():
            with self.subTest(dataset=key):
                directory = ROOT / "outputs" / key
                metrics = pd.read_csv(directory / "model_metrics.csv")
                predictions = pd.read_csv(directory / "test_predictions.csv")
                self.assertEqual(len(metrics), 3)
                self.assertEqual(int(metrics["selected"].sum()), 1)
                winner = metrics.loc[metrics["validation_rmse"].idxmin(), "model"]
                self.assertEqual(metrics.loc[metrics["selected"], "model"].iloc[0], winner)
                data, _ = load_dataset(key)
                for slug in ("decision_tree", "random_forest", "gradient_boosting", "best_model"):
                    bundle = joblib.load(ROOT / "models" / key / f"{slug}.joblib")
                    self.assertEqual(bundle["features"], features_for(key))
                    self.assertEqual(bundle["source_sha256"], hashlib.sha256((ROOT / "data" / spec["filename"]).read_bytes()).hexdigest())
                    self.assertTrue(np.isfinite(bundle["model"].predict(data[features_for(key)].iloc[[0]])).all())
                    if slug == "best_model":
                        self.assertEqual(bundle["model_name"], winner)
                for _, row in metrics.iterrows():
                    subset = predictions[predictions["model"] == row["model"]]
                    actual = data.loc[subset["row_index"], "selling_price"].to_numpy()
                    np.testing.assert_allclose(actual, subset["actual_inr"])
                    recalculated = score(subset["actual_inr"], subset["predicted_inr"])
                    for metric, value in recalculated.items():
                        self.assertAlmostEqual(row[f"test_{metric}"], value, places=6)
                importance = pd.read_csv(directory / "feature_importance.csv")
                self.assertAlmostEqual(importance["importance"].sum(), 1.0)
                self.assertEqual(len(list((directory / "charts").glob("*.png"))), 3)

    def test_all_four_app_prediction_forms(self):
        app = AppTest.from_file(str(ROOT / "main.py"), default_timeout=30).run()
        for key in DATASETS:
            with self.subTest(dataset=key):
                app.selectbox(key="dataset").set_value(key).run()
                self.assertFalse(app.exception, [item.message for item in app.exception])
                self.assertFalse(app.error, [item.value for item in app.error])
                self.assertEqual(len(app.tabs), 4)
                self.assertEqual(len(app.number_input), len(DATASETS[key]["numeric"]))
                submit = next(button for button in app.button if button.label == "Estimate resale price")
                submit.click().run()
                self.assertFalse(app.exception, [item.message for item in app.exception])
                self.assertTrue(any("Your estimate is ready." in item.value for item in app.success))


if __name__ == "__main__":
    unittest.main()
