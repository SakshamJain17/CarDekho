import { ArrowDown, ArrowUpRight } from "lucide-react";
import { heroImage } from "../services/api";
import type { Project } from "../types";
import { Counter, Reveal, SectionHeader, count } from "./ui";

export function Hero({ project }: { project: Project }) {
  return (
    <section id="overview" className="ai-hero">
      <img
        src={heroImage}
        alt="Original red grand touring concept artwork in an architectural automotive studio"
        width="1672"
        height="941"
        fetchPriority="high"
      />
      <div className="ai-hero-shade" />
      <div className="ai-hero-copy">
        <span className="ai-eyebrow">
          <i /> 01 / MACHINE LEARNING × AUTOMOTIVE INTELLIGENCE
        </span>
        <h1>
          KNOW THE
          <br />
          MACHINE.
          <br />
          <span>KNOW THE VALUE.</span>
        </h1>
        <p>
          A machine-learning system that estimates used-car resale value from
          real vehicle characteristics and historical CarDekho data.
        </p>
        <div className="ai-hero-actions">
          <a href="#predict" className="ai-button">
            PREDICT A PRICE <ArrowUpRight size={19} />
          </a>
          <a href="#models" className="ai-text-link">
            EXPLORE THE MODELS <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
      <div className="ai-hero-bottom">
        <div>
          <strong>{count(project.raw_rows)}</strong>
          <span>SOURCE RECORDS</span>
        </div>
        <div>
          <strong>03</strong>
          <span>REAL MODELS</span>
        </div>
        <div>
          <strong>01</strong>
          <span>PYTHON PREDICTION API</span>
        </div>
        <a href="#problem">
          <ArrowDown size={18} /> SCROLL TO DISCOVER
        </a>
      </div>
      <span className="ai-art-label">
        ORIGINAL CONCEPT ART / NOT THE CONFIGURED VEHICLE
      </span>
    </section>
  );
}
export function Problem({ project }: { project: Project }) {
  return (
    <section id="problem" className="ai-section ai-light">
      <Reveal>
        <div className="ai-editorial">
          <SectionHeader number="02" label="THE QUESTION">
            USED-CAR PRICING
            <br />
            <span>ISN’T LINEAR.</span>
          </SectionHeader>
          <div className="ai-editorial-copy">
            <p>
              Age, kilometres, brand, power, fuel, transmission and ownership
              interact. The badge alone cannot tell the whole story.
            </p>
            <h3>
              CAN MACHINE LEARNING
              <br />
              ESTIMATE RESALE VALUE?
            </h3>
            <p>
              We compare three regression approaches on the same independent
              groups—not three different splits chosen to flatter the results.
            </p>
          </div>
        </div>
        <div className="ai-facts">
          <div>
            <strong>
              <Counter value={project.raw_rows} />
            </strong>
            <span>ORIGINAL VEHICLE RECORDS</span>
          </div>
          <div>
            <strong>
              <Counter value={project.source_variables} />
            </strong>
            <span>SOURCE VARIABLES / INCLUDING TARGET</span>
          </div>
          <div>
            <strong>03</strong>
            <span>REGRESSION MODELS</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
export function Dataset({ project }: { project: Project }) {
  return (
    <section id="data" className="ai-section">
      <Reveal>
        <SectionHeader
          number="03"
          label="THE DATASET"
          copy="Real source data. Real technical detail. No invented dataset statistics."
        >
          THE DATA BEHIND
          <br />
          <span>THE MACHINE.</span>
        </SectionHeader>
        <div className="ai-dataset-meta">
          <div>
            <span>SOURCE</span>
            <strong>{project.filename}</strong>
          </div>
          <div>
            <span>CLEANED ROWS</span>
            <strong>{count(project.audit.clean_rows)}</strong>
          </div>
          <div>
            <span>TARGET / INR</span>
            <strong>{project.target}</strong>
          </div>
          <div>
            <span>MODEL FEATURES</span>
            <strong>{project.audit.feature_count}</strong>
          </div>
        </div>
        <div className="ai-spec-strip">
          {project.raw_columns.map((column, index) => (
            <div key={column}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{column.replaceAll("_", " ")}</strong>
            </div>
          ))}
        </div>
        <div className="ai-table-scroll">
          <table>
            <caption>
              Original v3 CSV preview · first six source records
            </caption>
            <thead>
              <tr>
                {project.raw_columns.map((column) => (
                  <th key={column}>{column.replaceAll("_", " ")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {project.preview.map((row, index) => (
                <tr key={index}>
                  {project.raw_columns.map((column) => (
                    <td key={column}>{row[column] ?? "Missing"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ai-why-v3">
          <span className="ai-eyebrow">WHY V3?</span>
          <h3>
            OWNERSHIP MEETS
            <br />
            ENGINEERING.
          </h3>
          <p>
            Mileage, displacement, maximum power and seating complement
            ownership and usage data. Torque remains in the source preview but
            is excluded from training because its units and formatting vary. The
            other three datasets stay available in the original experience.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
export function DataPipeline({ project }: { project: Project }) {
  const steps = [
    "CSV INGESTION",
    "DUPLICATE REMOVAL",
    "UNIT EXTRACTION",
    "BRAND DERIVATION",
    "GROUPED SPLITS",
    "FIT PREPROCESSING",
    "MODEL TRAINING",
    "INDEPENDENT TEST",
    "PYTHON API",
  ];
  return (
    <section className="ai-section ai-pipeline-section">
      <Reveal>
        <SectionHeader number="04" label="THE PIPELINE">
          RAW DATA.
          <br />
          <span>ENGINEERED SIGNAL.</span>
        </SectionHeader>
        <div className="ai-pipeline">
          {steps.map((step, index) => (
            <div key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
              <ArrowUpRight size={17} />
            </div>
          ))}
        </div>
        <div className="ai-transform-grid">
          <div>
            <code>name → brand</code>
            <span>First word, normalized to lower case</span>
          </div>
          <div>
            <code>"23.4 kmpl" → 23.4</code>
            <span>Extract numeric mileage; fuel carries unit context</span>
          </div>
          <div>
            <code>"1248 CC" → 1248</code>
            <span>Engine displacement in source units</span>
          </div>
          <div>
            <code>"74 bhp" → 74</code>
            <span>Numeric maximum power</span>
          </div>
          <div>
            <code>missing numeric → median</code>
            <span>Learned inside each training pipeline</span>
          </div>
          <div>
            <code>category → one-hot</code>
            <span>Rare-category pooling; unknown categories supported</span>
          </div>
        </div>
        <div className="ai-split">
          <div>
            <strong>~60%</strong>
            <span>TRAIN / {count(project.split.train)} ROWS</span>
          </div>
          <div>
            <strong>~20%</strong>
            <span>VALIDATE / {count(project.split.validation)} ROWS</span>
          </div>
          <div>
            <strong>~20%</strong>
            <span>TEST / {count(project.split.test)} ROWS</span>
          </div>
        </div>
        <p className="ai-note">
          Identical modeled feature rows stay in the same group. Seeds{" "}
          {project.split.seeds.join(" / ")}. Year is modeled directly; the
          configurator converts displayed car age back to year. No car-age
          feature or 80/20 split is invented.
        </p>
      </Reveal>
    </section>
  );
}
