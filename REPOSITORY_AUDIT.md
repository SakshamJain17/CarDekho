# Repository audit — CarDekho AI alternative

## Existing architecture (inspected before implementation)

- Frontend: React 19 / TypeScript / Vite 6, Tailwind 4, conventional CSS, GSAP, Lucide. Root `index.html` combines a React landing experience with a working JavaScript valuation workspace. `components/ui/car-showroom.tsx` provides an optional Three.js concept-car experience.
- Python app: `main.py` / `ui.py` / Streamlit; no existing HTTP prediction API.
- ML: `model_pipeline.py` normalizes four independent datasets; `train.py` trains Decision Tree, Random Forest and Gradient Boosting. All models use identical feature-hash-grouped train/validation/test splits, approximately 60/20/20, seeds 42/43. Winner selection uses validation RMSE. Held-out test predictions are retained before final full-data refits for demonstration.
- Artifacts: 16 current joblib bundles under `models/{v3,v4,basic,small}`; genuine metrics, test predictions, cleaned data and charts under `outputs/`. An older prototype remains under `artifacts/`; it is not the current production model.
- Data: four original CSVs in `data/`; existing GitHub `archive/` copies are identical. Primary v3 has 8,128 raw records, 13 source columns, 6,926 cleaned records and 12 modeled features. Torque is excluded; year is used directly, not car age. Brand is derived from name.
- Original browser inference: `export_web.py` exports fitted tree structures to `web/data`; `web/inference.mjs` reproduces sklearn predictions. This remains solely for the preserved root website. The new alternative will NOT import or use this inference engine.
- Configuration: `package.json`, `package-lock.json`, `requirements.txt`, `vite.config.ts`, `tsconfig.json`, `components.json`, `vercel.json`, `.streamlit/config.toml`, GitHub Actions. No secrets are required for current ML. `.env*` and Streamlit secrets are excluded from Git.
- Assets: original generated automotive hero artwork, licensed Khronos concept GLB/poster and local Basis decoder; credits under `web/media/ASSET_CREDITS.md`. No new Ferrari/Lamborghini imagery or branding will be copied.
- Routing: current root page only. The alternative will be a separate Vite HTML entry at `/ai/`.

## Intended changes

Add `ai/index.html`, modular `src/ai/` React components/styles/services, `backend/app.py`, backend requirements/tests and a reproducible presentation-data exporter. Extend Vite's multi-page inputs and development proxy without changing the root page. Reuse saved pipelines, metadata and evaluation files. Update documentation and testing configuration only where needed.

The alternative uses FastAPI `/api/health`, `/api/project`, `/api/predict`, `/api/predict-all-models`, and `/api/sensitivity`; Python loads the three existing v3 model bundles once during application startup. Recharts renders genuine evaluation and feature-importance data. Public presentation data is generated from repository outputs and checked for provenance; predictions require a running Python API.

## Truthful deviations from the supplied example brief

The repository has Decision Tree, not Linear Regression. Its evaluation is grouped 60/20/20, not a simple 80/20 split. Gradient Boosting is validation-selected for v3, while Random Forest has the lowest independent test RMSE; test results do not retroactively change the selection. Train R² was not exported and will be explicitly shown as unavailable, rather than recomputed using full-data deployment models. API inputs use exact training features; a UI car-age control maps to year using the current calendar year and is labeled accordingly.

## Preservation / cleanup

Current website source, Python training/prediction files, all saved models, original CSVs, evaluation outputs and licensed assets are preserved. No working ML files will be removed. Cleanup is restricted to task-created temporary/generated files; duplicate data and old artifacts are documented rather than deleted because the request explicitly prioritizes preservation.

Final cleanup also removes `components/demo.tsx`: an unreferenced sample that
loaded an external Ferrari frame sequence. Neither current entry imports it;
the deleted sample is recoverable from Git history. Unused imports and outdated demo documentation
were cleaned up. No CSV, fitted model, training script or evaluation output was
deleted or retrained.

## Performance edition follow-up

The Lamborghini reference request creates a third independent entry at
`/performance/`, on `feat/cardekho-performance-alternative`. The existing root
and `/ai/` source, styles, routes and default predictions are unchanged. New
source is isolated under `src/performance/`; existing data/chart/predictor modules
are reused rather than duplicated. The shared 3D showroom accepts an optional
asset base for nested routes and an opt-in performance studio; its default
camera, paint, materials and lighting remain identical for the homepage.
Original generated graphite/yellow artwork is stored locally with its prompt.

Requested final cleanup removes `components/ui/hero-scrub.tsx`, confirmed to have
no source imports, and the now-unused GSAP dependency. Both are recoverable from
Git history. Existing styling scaffolding stays because the homepage imports it.
Duplicate CSV archives and historical model artifacts are retained as user data,
not treated as disposable files. No training, data or model file is modified.

## Real-footage follow-up

The user rejected the generated supercar image. `/performance/` now uses a
locally hosted, licensed real-driving MP4 with a real-frame poster, pause/play,
an accessible intro-film dialog and offscreen/hidden-tab playback suspension.
Reduced-motion/data-saver preferences suppress automatic video downloads.
Generated imagery is also removed from that edition's valuation panel via
optional presenter props whose defaults preserve `/ai/`. The rejected PNG was
moved out of the project to `/tmp/cardekho-retired-performance-hero-39ccacd.png`
and is recoverable from Git history. Root and `/ai/` presentation defaults,
Python pipelines, APIs, data, models and metric outputs remain unchanged.
