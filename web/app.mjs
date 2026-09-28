import { predict } from "./inference.mjs";
import { showModelEvidence, showSensitivity } from "./evidence.mjs";

const $ = (id) => document.getElementById(id);
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-IN");
const title = (value) => String(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
const state = { summary: null, model: null, sequence: 0, valuation: null };
const models = new Map();

async function fetchJSON(path) {
  const response = await fetch(new URL(path, document.baseURI), { cache: "no-cache" });
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
  return response.json();
}

function setText(id, value) { $(id).textContent = value; }
function clearResult() { $("result").hidden = true; $("scenario-panel").hidden = true; state.valuation = null; }
function reportError(message) {
  $("error-message").textContent = message;
  $("error-message").hidden = false;
}

function fillOptions(select, options, selected) {
  select.replaceChildren();
  for (const option of options) {
    const element = document.createElement("option");
    element.value = option;
    element.textContent = title(option);
    select.append(element);
  }
  if (options.includes(selected)) select.value = selected;
}

function cell(row, text) {
  const element = document.createElement("td");
  element.textContent = text;
  row.append(element);
  return element;
}

function showSummary(summary) {
  showModelEvidence(summary);
  const selected = summary.metrics.find((row) => row.selected);
  if (!selected) throw new Error("The dataset has no selected model.");
  setText("selected-model", summary.model_name);
  setText("test-r2", selected.test_r2.toFixed(3));
  setText("test-mae", currency.format(selected.test_mae));
  setText("test-rmse", currency.format(selected.test_rmse));
  setText("profile-code", `VEHICLE PROFILE / ${summary.key.toUpperCase()}`);
  setText("stage-code", `CD / ${summary.key.toUpperCase()}`);
  setText("active-code", summary.key.toUpperCase());
  setText("stage-title", summary.label);
  setText("clean-rows", number.format(summary.audit.clean_rows));
  setText("median-price", `₹${(summary.median_price / 100_000).toFixed(2)} lakh`);
  setText("overview-r2", selected.test_r2.toFixed(3));
  setText("raw-rows", number.format(summary.audit.raw_rows));
  setText("duplicates", number.format(summary.audit.raw_exact_duplicates + summary.audit.normalized_duplicates_removed));
  setText("feature-count", summary.audit.feature_count);
  setText("dataset-notes", summary.notes);
  $("unit-notice").hidden = summary.key !== "small";
  $("comparison-chart").src = `web/charts/${summary.key}/model_comparison.png`;
  $("dataset-chart").src = `web/charts/${summary.key}/dataset_and_features.png`;
  $("diagnostics-chart").src = `web/charts/${summary.key}/prediction_diagnostics.png`;
  $("download-metrics").href = `web/data/${summary.key}.metrics.csv`;
  $("download-metrics").download = `${summary.key}_model_metrics.csv`;
  setText("baseline-note", `Selected model: ${summary.model_name}. Median-price baseline test RMSE: ${currency.format(selected.baseline_test_rmse)}. Selection uses validation RMSE only; a different algorithm may perform better on the independent test set.`);
  $("metrics-body").replaceChildren();
  for (const metric of [...summary.metrics].sort((a, b) => a.validation_rmse - b.validation_rmse)) {
    const row = document.createElement("tr");
    if (metric.selected) row.className = "selected";
    [metric.model, metric.selected ? "Selected" : "—", currency.format(metric.validation_rmse), currency.format(metric.test_mae), currency.format(metric.test_rmse), metric.test_r2.toFixed(4)].forEach((value) => cell(row, value));
    $("metrics-body").append(row);
  }
  $("feature-body").replaceChildren();
  for (const field of summary.fields) {
    const row = document.createElement("tr");
    cell(row, field.label);
    cell(row, field.type === "number" ? "Numeric" : "Category");
    cell(row, field.type === "number" ? `${number.format(field.min)} – ${number.format(field.max)}` : `${number.format(field.options.length)} options`);
    $("feature-body").append(row);
  }
}

function buildForm(summary) {
  const hasBrand = summary.fields.some((field) => field.name === "brand");
  $("brand-wrapper").hidden = !hasBrand;
  document.querySelector(".identity-grid").classList.toggle("single", !hasBrand);
  if (hasBrand) fillOptions($("brand"), summary.fields.find((field) => field.name === "brand").options);
  $("brand").disabled = !hasBrand;
  $("numeric-fields").replaceChildren();
  $("categorical-fields").replaceChildren();
  for (const field of summary.fields.filter((item) => !["brand", "vehicle_name"].includes(item.name))) {
    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    const id = `field-${field.name}`;
    label.htmlFor = id;
    label.textContent = field.label;
    let input;
    if (field.type === "number") {
      input = document.createElement("input");
      input.type = "number";
      input.step = field.integer ? "1" : "any";
      input.min = field.name === "year" ? "1886" : field.name === "seats" ? "1" : "0";
      if (field.name === "year") input.max = String(new Date().getFullYear());
      input.inputMode = "decimal";
      input.required = true;
    } else {
      input = document.createElement("select");
      fillOptions(input, field.options);
    }
    input.id = id;
    input.name = field.name;
    wrapper.append(label, input);
    $(field.type === "number" ? "numeric-fields" : "categorical-fields").append(wrapper);
  }
  changeBrand();
}

function changeBrand() {
  const summary = state.summary;
  if (!summary) return;
  const profiles = summary.profiles.filter((profile) => !profile.brand || profile.brand === $("brand").value);
  const vehicles = [...new Set(profiles.map((profile) => profile.vehicle_name))].sort();
  fillOptions($("vehicle"), vehicles);
  $("vehicle").disabled = false;
  setDefaults();
}

function setDefaults() {
  const summary = state.summary;
  if (!summary) return;
  const example = summary.profiles.find((profile) => profile.vehicle_name === $("vehicle").value && (!profile.brand || profile.brand === $("brand").value));
  if (!example) return;
  for (const field of summary.fields) {
    const input = $("prediction-form").elements.namedItem(field.name);
    if (!input) continue;
    input.value = example[field.name] ?? field.default ?? field.options[0];
  }
  clearResult();
}

async function loadDataset(entry) {
  const sequence = ++state.sequence;
  state.summary = null;
  state.model = null;
  clearResult();
  $("error-message").hidden = true;
  $("vehicle-fields").disabled = true;
  $("brand").disabled = true;
  $("vehicle").disabled = true;
  setText("estimate-button", "Loading trained model…");
  setText("load-status", "LOADING WORKSPACE");
  try {
    const summary = await fetchJSON(entry.summary_url);
    if (sequence !== state.sequence) return;
    state.summary = summary;
    showSummary(summary);
    buildForm(summary);
    setText("load-status", `LOADING MODEL · ${(summary.model_bytes / 1_000_000).toFixed(1)} MB`);
    const cacheKey = `${summary.model_url}:${summary.source_sha256}`;
    if (!models.has(cacheKey)) {
      models.set(cacheKey, fetchJSON(summary.model_url).catch((error) => { models.delete(cacheKey); throw error; }));
    }
    const model = await models.get(cacheKey);
    if (sequence !== state.sequence) return;
    if (model.dataset !== summary.key || model.source_sha256 !== summary.source_sha256 || model.model_name !== summary.model_name) {
      throw new Error("The exported model and dataset metadata differ. Re-export the website assets.");
    }
    state.model = model;
    $("vehicle-fields").disabled = false;
    setText("estimate-button", "Estimate resale price ↗");
    setText("load-status", "MODEL READY · BROWSER INFERENCE");
  } catch (error) {
    if (sequence !== state.sequence) return;
    setText("load-status", "WORKSPACE UNAVAILABLE");
    reportError(`${error.message} Reload the page or choose another dataset.`);
  }
}

$("prediction-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.model || !state.summary) return;
  if (!$("prediction-form").reportValidity()) return;
  try {
    const input = Object.fromEntries(state.summary.fields.map((field) => {
      const value = field.name === "brand" ? $("brand").value : field.name === "vehicle_name" ? $("vehicle").value : $("prediction-form").elements.namedItem(field.name).value;
      return [field.name, field.type === "number" ? Number(value) : value];
    }));
    const estimate = Math.max(0, predict(state.model, input));
    state.valuation = { input, estimate };
    const selected = state.summary.metrics.find((metric) => metric.selected);
    setText("result-mae", currency.format(selected.test_mae));
    setText("result-r2", selected.test_r2.toFixed(3));
    setText("result-price", currency.format(estimate));
    setText("result-description", `₹${(estimate / 100_000).toFixed(2)} lakh · ${title(input.vehicle_name)} · Estimated using ${state.model.model_name}`);
    const outside = state.summary.fields.filter((field) => field.type === "number" && (input[field.name] < field.min || input[field.name] > field.max)).map((field) => field.label);
    $("range-warning").hidden = !outside.length;
    setText("range-warning", `Outside the dataset's observed range: ${outside.join(", ")}`);
    $("result").hidden = false;
    $("scenario-feature").replaceChildren();
    for (const field of state.summary.fields.filter((item) => item.type === "number" && item.max > item.min)) {
      const option = document.createElement("option"); option.value = field.name; option.textContent = field.label;
      $("scenario-feature").append(option);
    }
    $("scenario-panel").hidden = !$("scenario-feature").options.length;
    showSensitivity(state.valuation, state.model, state.summary);
    $("error-message").hidden = true;
    $("result").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  } catch (error) { reportError(error.message); }
});
$("brand").addEventListener("change", changeBrand);
$("vehicle").addEventListener("change", setDefaults);
$("prediction-form").addEventListener("input", clearResult);
$("prediction-form").addEventListener("change", clearResult);
$("scenario-feature").addEventListener("change", () => showSensitivity(state.valuation, state.model, state.summary));
$("download-valuation").addEventListener("click", () => {
  if (!state.valuation || !state.summary) return;
  const record = { created_at: new Date().toISOString(), dataset: state.summary.key, model: state.summary.model_name, source_sha256: state.summary.source_sha256, ...state.valuation, independent_test_metrics: state.summary.metrics.find((metric) => metric.selected), limitations: "Historical listing estimate, not a current-market appraisal. Dataset evaluation metrics are not a prediction confidence interval." };
  const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = `cardekho-${state.summary.key}-valuation.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
function activateTab(tab, focus = false) {
  for (const item of tabs) {
    const active = item === tab;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
    $(item.getAttribute("aria-controls")).hidden = !active;
  }
  if (focus) tab.focus();
}
for (const tab of tabs) {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(tab);
    const targets = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
    if (Object.hasOwn(targets, event.key)) { event.preventDefault(); activateTab(tabs[targets[event.key]], true); }
  });
}
$("menu-button").addEventListener("click", () => {
  const open = $("sidebar").classList.toggle("open");
  $("menu-button").setAttribute("aria-expanded", String(open));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    $("sidebar").classList.remove("open");
    $("menu-button").setAttribute("aria-expanded", "false");
  }
});

async function init() {
  if (location.protocol === "file:") {
    reportError("Run npm run dev and open http://localhost:5173, or build and serve dist/. Source React/TypeScript cannot run from a file URL or Live Server.");
    return;
  }
  try {
    const catalog = await fetchJSON("web/data/catalog.json");
    $("dataset").replaceChildren();
    for (const entry of catalog.datasets) {
      const option = document.createElement("option");
      option.value = entry.key;
      option.textContent = entry.label;
      $("dataset").append(option);
    }
    $("dataset").disabled = false;
    $("dataset").addEventListener("change", () => {
      loadDataset(catalog.datasets.find((entry) => entry.key === $("dataset").value));
      $("sidebar").classList.remove("open");
      $("menu-button").setAttribute("aria-expanded", "false");
    });
    await loadDataset(catalog.datasets[0]);
  } catch (error) { reportError(error.message); }
}
init();
