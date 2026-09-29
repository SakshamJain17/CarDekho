import { baselineImprovement, buildSensitivity } from "./analytics.mjs";
const $ = (id) => document.getElementById(id);
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function showModelEvidence(summary) {
  $("model-scorecards").replaceChildren();
  for (const metric of summary.metrics) {
    const card = element("article", `model-scorecard${metric.selected ? " selected" : ""}`);
    card.append(element("span", "", metric.selected ? "VALIDATION-SELECTED MODEL" : "COMPARISON MODEL"), element("h3", "", metric.model), element("strong", "", metric.test_r2.toFixed(3)), element("small", "", "Independent test R²"), element("p", "", `Test MAE ${money.format(metric.test_mae)} · Test RMSE ${money.format(metric.test_rmse)}`));
    $("model-scorecards").append(card);
  }
  const selected = summary.metrics.find((metric) => metric.selected);
  const rows = [...summary.metrics.map((metric) => ({ name: metric.model, value: metric.test_rmse, selected: metric.selected })), { name: "Median baseline", value: selected.baseline_test_rmse, selected: false }];
  const maximum = Math.max(...rows.map((row) => row.value));
  $("model-performance").replaceChildren(element("span", "eyebrow", "INDEPENDENT TEST RMSE / LOWER IS BETTER"));
  for (const row of rows) {
    const wrapper = element("div", `performance-row${row.selected ? " selected" : ""}`);
    const track = element("div", "performance-track"), fill = element("div", "performance-fill");
    fill.style.width = `${maximum > 0 ? row.value / maximum * 100 : 0}%`; track.append(fill);
    wrapper.append(element("span", "", row.name), track, element("strong", "", money.format(row.value)));
    $("model-performance").append(wrapper);
  }
  const gain = baselineImprovement(selected);
  $("model-performance").append(element("p", "", `${gain === null ? "No baseline comparison available." : `${Math.abs(gain).toFixed(1)}% ${gain >= 0 ? "lower" : "higher"} test RMSE than the development-set median-price baseline.`} ${selected.test_r2 < 0.6 ? "Fit caution: the selected model explains less than 60% of price variation on these test groups. " : ""}These results describe historical listings, not present-day market accuracy.`));
  $("importance-bars").replaceChildren();
  for (const item of [...summary.importance].sort((a, b) => b.importance - a.importance).slice(0, 6)) {
    const wrapper = element("div", "importance-row"), track = element("div", "importance-track"), fill = element("div", "importance-fill");
    fill.style.width = `${Math.max(0, Math.min(100, item.importance * 100))}%`; track.append(fill);
    const label = summary.fields.find((field) => field.name === item.feature)?.label ?? item.feature;
    wrapper.append(element("span", "", label), track, element("strong", "", `${(item.importance * 100).toFixed(1)}%`));
    $("importance-bars").append(wrapper);
  }
}

function svgElement(tag, attributes = {}, text) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}
export function showSensitivity(valuation, model, summary) {
  $("scenario-chart").replaceChildren(); $("scenario-body").replaceChildren();
  if (!valuation) return;
  const field = summary.fields.find((item) => item.name === $("scenario-feature").value);
  if (!field) return;
  $("scenario-feature-label").textContent = field.label;
  let series;
  try { series = buildSensitivity(model, summary.fields, valuation.input, field.name); }
  catch (error) { $("scenario-chart").append(element("p", "notice", error.message)); return; }
  const minX = series[0].value, spanX = series.at(-1).value - minX || 1;
  const prices = [...series.map((row) => row.estimate), valuation.estimate];
  const minY = Math.max(0, Math.min(...prices) * 0.92), maxY = Math.max(...prices) * 1.08 || 1;
  const x = (value) => 70 + (value - minX) / spanX * 590;
  const y = (value) => 205 - (value - minY) / (maxY - minY || 1) * 165;
  const svg = svgElement("svg", { viewBox: "0 0 720 260", role: "img", "aria-labelledby": "sensitivity-svg-title" });
  svg.append(svgElement("title", { id: "sensitivity-svg-title" }, `Sampled model sensitivity to ${field.label}. Exact values are in the table below.`));
  for (let index = 0; index < 4; index++) {
    const value = minY + (maxY - minY) * index / 3;
    svg.append(svgElement("line", { x1: 70, x2: 670, y1: y(value), y2: y(value), class: "chart-grid" }), svgElement("text", { x: 58, y: y(value) + 4, "text-anchor": "end" }, `₹${(value / 100_000).toFixed(1)}L`));
  }
  svg.append(svgElement("line", { x1: 70, x2: 670, y1: y(valuation.estimate), y2: y(valuation.estimate), class: "chart-current" }));
  const path = series.map((row, index) => `${index ? "L" : "M"}${x(row.value)},${y(row.estimate)}`).join(" ");
  svg.append(svgElement("path", { d: path, class: "chart-line" }));
  series.forEach((row, index) => {
    const point = svgElement("circle", { cx: x(row.value), cy: y(row.estimate), r: row.current ? 6 : 4, class: "chart-point" });
    point.append(svgElement("title", {}, `${field.label}: ${number.format(row.value)} · ${money.format(row.estimate)}${row.current ? " · Your input" : ""}`)); svg.append(point);
    if (index % 2 === 0 || index === series.length - 1) svg.append(svgElement("text", { x: x(row.value), y: 229, "text-anchor": "middle" }, number.format(row.value)));
    const tr = element("tr", row.current ? "selected" : "");
    tr.append(element("td", "", `${number.format(row.value)}${row.current ? " · Your input" : ""}`), element("td", "", money.format(row.estimate)), element("td", "", `${row.difference > 0 ? "+" : ""}${money.format(row.difference)}`));
    $("scenario-body").append(tr);
  });
  svg.append(svgElement("text", { x: 365, y: 253, "text-anchor": "middle" }, `${field.label} · within observed dataset range`));
  $("scenario-chart").append(svg);
}
