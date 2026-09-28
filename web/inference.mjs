/** Exact traversal of the fitted sklearn tree ensembles exported by export_web.py. */
export function encodeFeatures(model, input) {
  const features = new Float32Array(model.encoded_width);
  model.numeric_features.forEach((name, i) => {
    const raw = input[name];
    const value = raw === null || raw === undefined || raw === "" ? model.numeric_fill[i] : Number(raw);
    if (!Number.isFinite(value)) throw new Error(`Invalid numeric value for ${name}.`);
    // sklearn's tree estimators convert their feature matrices to float32.
    features[i] = value;
  });
  for (const category of model.categorical) {
    const value = input[category.feature] ?? category.fill;
    const index = Object.hasOwn(category.positions, value) ? category.positions[value] : category.unknown_position;
    if (index !== null && index !== undefined) features[index] = 1;
  }
  return features;
}

export function treePrediction(tree, features) {
  let index = 0;
  for (let steps = 0; steps <= tree.length; steps++) {
    const node = tree[index];
    if (!node) throw new Error("Invalid model tree.");
    if (node.length === 1) return node[0];
    index = features[node[0]] <= node[1] ? node[2] : node[3];
  }
  throw new Error("Invalid model traversal.");
}

export function predict(model, input) {
  if (model.version !== 1 || !model.trees.length) throw new Error("Unsupported model export.");
  const features = encodeFeatures(model, input);
  let estimate;
  if (model.kind === "random_forest") {
    estimate = model.trees.reduce((sum, tree) => sum + treePrediction(tree, features), 0) / model.trees.length;
  } else if (model.kind === "gradient_boosting") {
    estimate = model.initial;
    for (const tree of model.trees) estimate += model.learning_rate * treePrediction(tree, features);
  } else if (model.kind === "decision_tree") {
    estimate = treePrediction(model.trees[0], features);
  } else {
    throw new Error("Unsupported prediction algorithm.");
  }
  if (!Number.isFinite(estimate)) throw new Error("The model produced an invalid estimate.");
  return estimate;
}
