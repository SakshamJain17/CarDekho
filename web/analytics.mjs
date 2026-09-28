import { predict } from "./inference.mjs";

/** Explore the saved estimator, never retrain or invent a future price. */
export function buildSensitivity(model, fields, input, featureName) {
  const field = fields.find((entry) => entry.name === featureName && entry.type === "number");
  if (!field) throw new Error("Choose a numeric model feature.");
  const current = Number(input[featureName]);
  if (![current, field.min, field.max].every(Number.isFinite)) throw new Error("Sensitivity requires finite feature values.");
  if (current < field.min || current > field.max) throw new Error("This input is outside the observed range. Choose an in-range value to explore sensitivity.");
  const radius = featureName === "year" ? 3 : featureName === "km_driven" ? Math.max(20_000, current * 0.25) : Math.max(Math.abs(current) * 0.3, (field.max - field.min) * 0.03);
  const lower = Math.max(field.min, current - radius), upper = Math.min(field.max, current + radius);
  const values = [...new Set([...Array.from({ length: 7 }, (_, index) => {
    const value = lower + (upper - lower) * index / 6;
    return field.integer ? Math.round(value) : Number(value.toPrecision(6));
  }), current])].filter((value) => value >= field.min && value <= field.max).sort((a, b) => a - b);
  const baseline = Math.max(0, predict(model, input));
  return values.map((value) => {
    const estimate = Math.max(0, predict(model, { ...input, [featureName]: value }));
    return { value, estimate, difference: estimate - baseline, current: value === current };
  });
}

export function baselineImprovement(metric) {
  if (!(metric.baseline_test_rmse > 0) || !Number.isFinite(metric.test_rmse)) return null;
  return (1 - metric.test_rmse / metric.baseline_test_rmse) * 100;
}
