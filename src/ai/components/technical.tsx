import { ArrowUpRight } from "lucide-react";
import type { Project } from "../types";
import { Reveal, SectionHeader, count } from "./ui";
export function BusinessValue() {
  return (
    <section className="ai-section ai-light">
      <Reveal>
        <SectionHeader number="11" label="BUSINESS VALUE">
          FROM MODEL
          <br />
          <span>TO MARKETPLACE.</span>
        </SectionHeader>
        <div className="ai-business-grid">
          {[
            {
              name: "BUYERS",
              copy: "A data-driven reference point before evaluating the asking price of a used vehicle.",
            },
            {
              name: "SELLERS",
              copy: "A preliminary starting point before listing, to be adjusted for actual condition and market context.",
            },
            {
              name: "MARKETPLACES",
              copy: "A pricing-support layer before inspection—not a substitute for a qualified appraisal.",
            },
          ].map((item, index) => (
            <article key={item.name}>
              <span>0{index + 1}</span>
              <h3>{item.name}</h3>
              <p>{item.copy}</p>
              <ArrowUpRight size={24} />
            </article>
          ))}
        </div>
        <div className="ai-business-applications">
          <span>BUSINESS APPLICATION</span>
          <p>
            Lead valuation / Listing guidance / Dealer assistance / Inventory
            analysis
          </p>
        </div>
      </Reveal>
    </section>
  );
}
export function Architecture({ project }: { project: Project }) {
  const details = [
    {
      name: "DATASET",
      copy: `${project.filename}: ${count(project.raw_rows)} original rows, ${project.source_variables} source columns, ${count(project.audit.clean_rows)} cleaned records, ${project.audit.feature_count} model features. Target: selling_price, in INR. Other datasets remain separate in the original app.`,
    },
    {
      name: "PREPROCESSING",
      copy: `Brand from name; year directly modeled; numeric mileage/engine/power extraction; ${count(project.audit.raw_exact_duplicates)} source duplicates removed. Median numeric imputation and most-frequent category filling occur inside the fitted pipeline. One-hot encoding pools rare categories. Torque is not a predictor.`,
    },
    {
      name: "MODEL TRAINING",
      copy: "Decision Tree: max_depth 18, min_samples_leaf 3. Random Forest: 300 estimators, min_samples_leaf 2. Gradient Boosting: 300 estimators, learning rate 0.04, depth 3, Huber loss. Fixed parameters; no hyperparameter search is claimed.",
    },
    {
      name: "EVALUATION",
      copy: `Group-separated ~60/20/20 split, seeds ${project.split.seeds.join(" / ")}. ${project.split.test} independent test rows per algorithm. Validation RMSE chooses the winner before testing. MAE/RMSE/R² come from saved evaluation outputs. Train R² was not exported.`,
    },
    {
      name: "DEPLOYMENT",
      copy: "The alternative uses React → HTTP JSON → FastAPI → saved scikit-learn preprocessing/estimator → INR price. Models load once at startup. The served demo pipelines were refitted on all cleaned data only after independent evaluation; reported test predictions come from pre-refit evaluation models. The original browser-only site is preserved separately.",
    },
  ];
  return (
    <section className="ai-section">
      <Reveal>
        <SectionHeader number="12" label="PROJECT ARCHITECTURE">
          UNDER
          <br />
          <span>THE HOOD.</span>
        </SectionHeader>
        <div className="ai-architecture">
          <div>
            <span>LIVE INFERENCE</span>
            {[
              "REACT / VITE",
              "POST /api/predict",
              "FASTAPI / VALIDATION",
              "SAVED SCIKIT-LEARN PIPELINE",
              project.selected_model.toUpperCase(),
              "ESTIMATED PRICE / INR",
            ].map((node, index) => (
              <div className="ai-architecture-node" key={node}>
                <small>0{index + 1}</small>
                <strong>{node}</strong>
                <ArrowUpRight size={15} />
              </div>
            ))}
          </div>
          <div>
            <span>TRAINING & EVALUATION</span>
            {[
              project.filename.toUpperCase(),
              "model_pipeline.py / GROUPED SPLITS",
              "train.py / SAME FEATURES",
              "HELD-OUT OUTPUTS / METRICS",
              "models/v3/*.joblib",
              "STARTUP MODEL CACHE",
            ].map((node, index) => (
              <div className="ai-architecture-node" key={node}>
                <small>0{index + 1}</small>
                <strong>{node}</strong>
                <ArrowUpRight size={15} />
              </div>
            ))}
          </div>
        </div>
        <div className="ai-technical-details">
          <SectionHeader number="13" label="TECHNICAL DETAILS">
            THE METHOD.
            <br />
            <span>NOT THE MYTH.</span>
          </SectionHeader>
          {details.map((item) => (
            <details className="ai-accordion" key={item.name}>
              <summary>{item.name}</summary>
              <p>{item.copy}</p>
            </details>
          ))}
        </div>
        <p className="ai-note">
          Model provenance: source SHA-256 <code>{project.source_sha256}</code>.
          Saved with scikit-learn {project.metadata.packages["scikit-learn"]}.
          No target value is sent as a predictor.
        </p>
      </Reveal>
    </section>
  );
}
export function Conclusion() {
  return (
    <section className="ai-conclusion">
      <Reveal>
        <span className="ai-eyebrow">14 / THE FINAL PERSPECTIVE</span>
        <h2>
          FROM RAW DATA
          <br />
          TO <span>REAL VALUE.</span>
        </h2>
        <p>
          Three genuine regression approaches. One shared evaluation process. A
          real Python-powered configurator that makes the journey from data to
          estimate visible.
        </p>
        <a className="ai-button" href="#predict">
          TRY THE PREDICTOR <ArrowUpRight size={19} />
        </a>
      </Reveal>
    </section>
  );
}
