import { useEffect, useState } from "react";
import type { Project } from "./types";
import { checkHealth, loadProject } from "./services/api";
import { Navbar, Footer } from "./components/layout";
import { Hero, Problem, Dataset, DataPipeline } from "./components/data-story";
import {
  ActualVsPredicted,
  FeatureImportance,
  ModelComparison,
  ModelShowcase,
} from "./components/models";
import { PricePredictor } from "./components/predictor";
import {
  Architecture,
  BusinessValue,
  Conclusion,
} from "./components/technical";

export default function App() {
  const [project, setProject] = useState<Project | null>(null),
    [error, setError] = useState(""),
    [apiReady, setApiReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
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
              : "Project data failed to load.",
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
    const timer = window.setInterval(health, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [attempt]);
  if (!project)
    return (
      <main className="ai-loading">
        <span className="ai-wordmark">
          CARDEKHO <b>AI</b>
        </span>
        <h1>{error ? "DATA UNAVAILABLE." : "PREPARING THE INTELLIGENCE."}</h1>
        <p role={error ? "alert" : "status"}>
          {error || "Reading verified dataset and model outputs…"}
        </p>
        {error && (
          <button className="ai-button" onClick={() => setAttempt(attempt + 1)}>
            RETRY
          </button>
        )}
        <a href="../">Open the original experience ↗</a>
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
        <Problem project={project} />
        <Dataset project={project} />
        <DataPipeline project={project} />
        <ModelShowcase project={project} />
        <ModelComparison project={project} />
        <ActualVsPredicted project={project} />
        <FeatureImportance project={project} />
        <PricePredictor project={project} apiReady={apiReady} />
        <BusinessValue />
        <Architecture project={project} />
        <Conclusion />
      </main>
      <Footer />
    </>
  );
}
