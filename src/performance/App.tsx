import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Box,
} from "lucide-react";
import { checkHealth, loadProject } from "../ai/services/api";
import type { Project } from "../ai/types";
import { Navbar, Footer } from "../ai/components/layout";
import { Dataset, DataPipeline, Problem } from "../ai/components/data-story";
import {
  ActualVsPredicted,
  FeatureImportance,
  ModelComparison,
} from "../ai/components/models";
import { PricePredictor } from "../ai/components/predictor";
import {
  Architecture,
  BusinessValue,
  Conclusion,
} from "../ai/components/technical";
import { count, money } from "../ai/components/ui";
import HeroFilm, { drivingPoster } from "./HeroFilm";

const CarShowroom = lazy(() => import("../../components/ui/car-showroom"));
const poster = new URL("../web/media/car-concept-poster.jpg", document.baseURI)
  .href;
const descriptions: Record<
  string,
  { kicker: string; copy: string; architecture: string }
> = {
  "Decision Tree": {
    kicker: "THE SINGLE-TREE APPROACH",
    copy: "One tree. A sequence of decisions. A nonlinear starting point that partitions specifications into regions of similar value.",
    architecture: "DEPTH 18 / MINIMUM LEAF 3",
  },
  "Random Forest": {
    kicker: "THE MULTI-TREE APPROACH",
    copy: "Three hundred trees working in parallel. Independent perspectives, averaged into one estimate. The strongest independent test result in this experiment.",
    architecture: "300 ESTIMATORS / MINIMUM LEAF 2",
  },
  "Gradient Boosting": {
    kicker: "THE SEQUENTIAL APPROACH",
    copy: "Each stage learns from earlier errors. The lowest validation RMSE selected this pipeline before the independent test results were calculated.",
    architecture: "300 STAGES / HUBER LOSS / LEARNING RATE 0.04",
  },
};

function Hero({ project }: { project: Project }) {
  return (
    <section id="overview" className="performance-hero">
      <HeroFilm />
      <div className="performance-hero-shade" />
      <div className="performance-hero-copy">
        <span className="performance-eyebrow">
          CARDEKHO AI / PERFORMANCE EDITION
        </span>
        <h1>
          EVERY CAR.
          <br />
          A STORY.
          <br />
          <span>A VALUE.</span>
        </h1>
        <p>
          Look beyond the badge.
          <br />
          Explore the data. Configure the details.
          <br />
          Discover the machine-learning estimate.
        </p>
        <a className="performance-action" href="#predict">
          <span className="performance-hex">
            <ArrowRight size={23} />
          </span>
          <span>
            CONFIGURE YOUR VALUATION
            <small>REAL VEHICLE INPUTS. REAL PYTHON MODELS.</small>
          </span>
        </a>
      </div>
      <div className="performance-hero-bottom">
        <div>
          <strong>{count(project.raw_rows)}</strong>
          <span>HISTORICAL LISTINGS</span>
        </div>
        <div>
          <strong>03</strong>
          <span>REGRESSION APPROACHES</span>
        </div>
        <div>
          <strong>{count(project.split.test)}</strong>
          <span>INDEPENDENT TEST ROWS</span>
        </div>
        <a href="#models">
          <ArrowDown size={18} />
          <span>DISCOVER THE LINE-UP</span>
        </a>
      </div>
    </section>
  );
}

function Lineup({ project }: { project: Project }) {
  const [index, setIndex] = useState(() =>
    project.metrics.findIndex((metric) => metric.selected),
  );
  const metric = project.metrics[index],
    info = descriptions[metric.model];
  const move = (direction: number) =>
    setIndex(
      (previous) =>
        (previous + direction + project.metrics.length) %
        project.metrics.length,
    );
  return (
    <section
      id="models"
      className="performance-lineup"
      aria-labelledby="performance-lineup-title"
    >
      <div className="performance-lineup-top">
        <span className="performance-eyebrow">THE MODEL LINE-UP</span>
        <span>01 DATASET / 03 DISTINCT APPROACHES</span>
      </div>
      <div
        className="performance-model-selector"
        role="group"
        aria-label="Explore the regression models"
      >
        {project.metrics.map((item, number) => (
          <button
            key={item.model}
            aria-pressed={index === number}
            onClick={() => setIndex(number)}
          >
            <small>0{number + 1}</small>
            {item.model.toUpperCase()}
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>
      <div className="performance-lineup-content">
        <div className="performance-model-copy" aria-live="polite">
          <span className="performance-eyebrow">{info.kicker}</span>
          <h2 id="performance-lineup-title">{metric.model.toUpperCase()}</h2>
          <p>{info.copy}</p>
          <div className="performance-model-badges">
            <span>
              {metric.selected
                ? "VALIDATION-SELECTED DEFAULT"
                : "INDEPENDENT COMPARISON MODEL"}
            </span>
            {metric.model === "Random Forest" && <span>LOWEST TEST RMSE</span>}
          </div>
          <div className="performance-model-spec">{info.architecture}</div>
        </div>
        <div className="performance-model-visual" aria-hidden="true">
          <span className="performance-visual-label">
            {metric.model === "Random Forest"
              ? "ENSEMBLE / PARALLEL"
              : metric.model === "Decision Tree"
                ? "PARTITION / SINGLE TREE"
                : "ENSEMBLE / SEQUENTIAL"}
          </span>
          <div className={`performance-signal signal-${index}`}>
            {Array.from({ length: 11 }, (_, i) => (
              <i
                key={i}
                style={{ height: `${22 + ((i * 37 + index * 17) % 78)}%` }}
              />
            ))}
          </div>
          <span className="performance-visual-footer">
            ARCHITECTURE MOTIF / NOT A DATA CHART
          </span>
        </div>
      </div>
      <div className="performance-model-bottom">
        <div>
          <strong>{metric.test_r2.toFixed(4)}</strong>
          <span>INDEPENDENT TEST R²</span>
        </div>
        <div>
          <strong>{money(metric.test_mae)}</strong>
          <span>MEAN ABSOLUTE ERROR / INR</span>
        </div>
        <div>
          <strong>{money(metric.test_rmse)}</strong>
          <span>ROOT MEAN SQUARED ERROR / INR</span>
        </div>
        <div className="performance-model-arrows">
          <button aria-label="Previous model" onClick={() => move(-1)}>
            <ChevronLeft />
          </button>
          <button aria-label="Next model" onClick={() => move(1)}>
            <ChevronRight />
          </button>
        </div>
      </div>
      <p className="performance-lineup-note">
        Evaluation source: outputs/v3/model_metrics.csv. Selection uses
        validation—not the test leaderboard. Exploring a model here does not
        silently change the predictor's validation-selected default.
      </p>
    </section>
  );
}

function Showroom() {
  const [open, setOpen] = useState(false);
  return (
    <section className="performance-showroom" id="showroom">
      <div className="performance-showroom-heading">
        <div>
          <span className="performance-eyebrow">EXPLORE THE FORM</span>
          <h2>
            EVERY ANGLE.
            <br />
            <span>A NEW PERSPECTIVE.</span>
          </h2>
        </div>
        <p>
          A live 3D study in light, geometry and finish.
          <br />
          Drag to rotate. Zoom in. Make it yours.
        </p>
      </div>
      {open ? (
        <Suspense
          fallback={
            <div className="performance-showroom-loading" role="status">
              PREPARING THE 3D SHOWROOM…
            </div>
          }
        >
          <CarShowroom assetBase="../web/media/" studio="performance" />
        </Suspense>
      ) : (
        <div className="performance-showroom-preview">
          <img
            src={poster}
            alt="Preview of the separate interactive 3D concept car"
            loading="lazy"
          />
          <button onClick={() => setOpen(true)} className="performance-enter">
            <span className="performance-hex">
              <Box size={24} />
            </span>
            <span>
              ENTER THE 3D SHOWROOM
              <small>LOADS A LOCAL 10.3 MB CONCEPT MODEL</small>
            </span>
          </button>
        </div>
      )}
      <p className="performance-showroom-note">
        CONCEPT VEHICLE / VISUAL EXPERIENCE ONLY
        <span>
          The 3D car is not your selected listing. Paint and camera changes do
          not alter price estimates.
        </span>
      </p>
    </section>
  );
}

export default function App() {
  const [project, setProject] = useState<Project | null>(null),
    [error, setError] = useState(""),
    [apiReady, setApiReady] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError("");
    loadProject()
      .then((data) => {
        if (!cancelled) setProject(data);
      })
      .catch((cause) => {
        if (!cancelled)
          setError(
            cause instanceof Error
              ? cause.message
              : "Project data unavailable.",
          );
      });
    const health = () =>
      checkHealth()
        .then((response) => {
          if (!cancelled) setApiReady(response.status === "ready");
        })
        .catch(() => {
          if (!cancelled) setApiReady(false);
        });
    health();
    const timer = setInterval(health, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [attempt]);
  if (!project)
    return (
      <main className="ai-loading">
        <span className="performance-eyebrow">
          CARDEKHO AI / PERFORMANCE EDITION
        </span>
        <h1>{error ? "DATA UNAVAILABLE." : "PREPARING THE INTELLIGENCE."}</h1>
        <p role={error ? "alert" : "status"}>
          {error || "Loading verified project data…"}
        </p>
        {error && (
          <button className="ai-button" onClick={() => setAttempt(attempt + 1)}>
            RETRY
          </button>
        )}
        <a href="../">Return to the original website ↗</a>
      </main>
    );
  return (
    <>
      <a href="#predict" className="ai-skip-link">
        Skip to predictor
      </a>
      <Navbar />
      <main>
        <Hero project={project} />
        <Lineup project={project} />
        <Showroom />
        <div className="performance-editorial-banner">
          <span>DATA OVER ASSUMPTIONS.</span>
          <a href="#data">
            EXPLORE THE ENGINEERING <ArrowUpRight size={19} />
          </a>
        </div>
        <Problem project={project} />
        <Dataset project={project} />
        <DataPipeline project={project} />
        <ModelComparison project={project} />
        <ActualVsPredicted project={project} />
        <FeatureImportance project={project} />
        <PricePredictor
          project={project}
          apiReady={apiReady}
          allowSharing
          valuationImage={drivingPoster}
          valuationImageAlt="Real driving-footage frame, not the configured vehicle"
          valuationImageCaption="REAL FOOTAGE / NOT YOUR CONFIGURED LISTING"
        />
        <BusinessValue />
        <Architecture project={project} />
        <Conclusion />
      </main>
      <div className="performance-edition-links">
        <span>CHOOSE YOUR EXPERIENCE</span>
        <a href="../">
          Original website <ArrowUpRight size={15} />
        </a>
        <a href="../ai/">
          Editorial AI edition <ArrowUpRight size={15} />
        </a>
      </div>
      <Footer />
    </>
  );
}
