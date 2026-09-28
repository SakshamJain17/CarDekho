import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { predict } from "../web/inference.mjs";

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
