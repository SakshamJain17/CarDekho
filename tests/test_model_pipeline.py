"""Verify unit conversion, leakage prevention and portable prediction pipelines."""

import unittest

import numpy as np
import pandas as pd

from model_pipeline import DATASETS, ROOT, build_pipeline, candidate_models, features_for, load_dataset, split_indices


class PipelineTests(unittest.TestCase):
    def test_small_dataset_price_conversion(self):
        raw = pd.read_csv(ROOT / "data" / DATASETS["small"]["filename"])
        cleaned, _ = load_dataset("small")
        self.assertAlmostEqual(cleaned.iloc[0]["selling_price"], raw.iloc[0]["Selling_Price"] * 100_000)
        self.assertAlmostEqual(cleaned.iloc[0]["present_price"], raw.iloc[0]["Present_Price"] * 100_000)
        self.assertEqual(cleaned.iloc[0]["previous_owners"], raw.iloc[0]["Owner"])

    def test_feature_groups_never_cross_splits(self):
        for key in DATASETS:
            with self.subTest(dataset=key):
                data, _ = load_dataset(key)
                train, validation, test = split_indices(data, key)
                self.assertEqual(len(train) + len(validation) + len(test), len(data))
                groups = pd.util.hash_pandas_object(data[features_for(key)], index=False)
                sets = [set(groups.iloc[idx]) for idx in (train, validation, test)]
                self.assertFalse(sets[0] & sets[1])
                self.assertFalse(sets[0] & sets[2])
                self.assertFalse(sets[1] & sets[2])

    def test_unknown_categories_and_missing_measurements_predict(self):
        for key in DATASETS:
            with self.subTest(dataset=key):
                data, _ = load_dataset(key)
                model = build_pipeline(candidate_models()["Decision Tree"], key)
                model.fit(data[features_for(key)], data["selling_price"])
                sample = data[features_for(key)].iloc[[0]].copy()
                sample[DATASETS[key]["categorical"]] = "never-seen-category"
                sample[DATASETS[key]["numeric"][0]] = np.nan
                self.assertTrue(np.isfinite(model.predict(sample)).all())

    def test_measurement_parsing(self):
        data, audit = load_dataset("v3")
        self.assertEqual(data.iloc[0]["engine"], 1248.0)
        self.assertEqual(data.iloc[0]["max_power"], 74.0)
        self.assertEqual(data.iloc[0]["mileage"], 23.4)
        self.assertGreater(audit["raw_exact_duplicates"], 0)
        self.assertFalse(data.duplicated().any())


if __name__ == "__main__":
    unittest.main()
