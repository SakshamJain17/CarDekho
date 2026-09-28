import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { predict } from "../web/inference.mjs";
import { buildSensitivity, baselineImprovement } from "../web/analytics.mjs";

const json = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
for (const key of ["v3", "v4", "basic", "small"]) {
  test(`${key}: browser predictions match saved sklearn pipeline`, async () => {
    const model = await json(`../web/data/${key}.model.json`);
    const cases = await json(`web_fixtures/${key}.json`);
    for (const fixture of cases) {
      const prediction = predict(model, fixture.input);
      assert.ok(Math.abs(prediction - fixture.expected) < 0.00001, `Expected ${fixture.expected}, received ${prediction}`);
    }
    const summary = await json(`../web/data/${key}.json`);
    assert.equal(model.source_sha256, summary.source_sha256);
    assert.equal(model.model_name, summary.model_name);
    assert.equal(summary.metrics.filter((row) => row.selected).length, 1);
  });
}
test("invalid numeric inputs are rejected", async () => {
  const model = await json("../web/data/v3.model.json");
  const summary = await json("../web/data/v3.json");
  assert.throws(() => predict(model, { ...summary.profiles[0], year: "invalid" }), /Invalid numeric/);
});
for (const key of ["v3", "v4", "basic", "small"]) {
  test(`${key}: sensitivity uses actual predictions, stays in range and preserves inputs`, async () => {
    const model = await json(`../web/data/${key}.model.json`);
    const summary = await json(`../web/data/${key}.json`);
    const input = summary.profiles[0], original = JSON.stringify(input);
    const field = summary.fields.find((entry) => entry.name === "year");
    const series = buildSensitivity(model, summary.fields, input, "year");
    assert.ok(series.length >= 2);
    assert.equal(series.filter((entry) => entry.current).length, 1);
    for (const row of series) {
      assert.ok(row.value >= field.min && row.value <= field.max);
      assert.ok(Number.isInteger(row.value));
      assert.equal(row.estimate, Math.max(0, predict(model, { ...input, year: row.value })));
    }
    assert.equal(JSON.stringify(input), original);
    assert.throws(() => buildSensitivity(model, summary.fields, input, "fuel"), /numeric/);
    assert.throws(() => buildSensitivity(model, summary.fields, { ...input, year: field.max + 10 }, "year"), /outside/);
  });
}
test("baseline improvement is an error reduction, not a confidence score", () => {
  assert.equal(baselineImprovement({ baseline_test_rmse: 100, test_rmse: 50 }), 50);
  assert.equal(baselineImprovement({ baseline_test_rmse: 100, test_rmse: 150 }), -50);
  assert.equal(baselineImprovement({ baseline_test_rmse: 0, test_rmse: 50 }), null);
});
