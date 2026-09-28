export type Field = { name: string; label: string; type: "number" | "select"; min: number; max: number; default: number; integer?: boolean; options: string[] };
export type Vehicle = Record<string, string | number>;
export type Metric = { model: string; selected: boolean; validation_rmse: number; test_r2: number; test_mae: number; test_rmse: number; baseline_test_rmse: number; train_rows: number; validation_rows: number; test_rows: number };
export type Point = { row_index: number; actual_inr: number; predicted_inr: number };
export type Project = {
  name: string; filename: string; source_sha256: string; raw_rows: number; source_variables: number; raw_columns: string[]; target: string;
  selected_model: string; fields: Field[]; profiles: Vehicle[]; metrics: Metric[]; preview: Record<string, string | number | null>[];
  audit: { clean_rows: number; raw_exact_duplicates: number; feature_count: number; missing_feature_cells: number };
  metadata: { trained_at_utc: string; packages: Record<string, string> };
  split: { train: number; validation: number; test: number; seeds: number[]; method: string };
  feature_importance: { model: string; aggregation: string; items: { feature: string; importance: number }[] };
  test_predictions: Record<string, Point[]>; price_distribution: { price_lakh: number; count: number }[];
};
export type Prediction = { predicted_price: number; model: string; inputs: Vehicle; warnings: string[]; source_sha256: string; estimate_only: boolean };
export type ModelPrediction = { model: string; predicted_price: number };
export type SensitivityPoint = { value: number; predicted_price: number };
