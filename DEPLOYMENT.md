# Hosting CarDekho on GitHub and Vercel

The `index.html` website is a Vite-built, independently deployable frontend.
Its cinematic landing hero uses React, TypeScript, Tailwind 4 and CSS motion.
It uses exported versions of the actual selected tree models, including
their fitted numeric imputation and categorical encoding, to predict in
JavaScript. Predictions run in the browser. No Python API, Streamlit server,
API key, or database is required for the hosted website.

The Streamlit application and Python training workflow remain available
locally. All four datasets remain separate; deployment does not merge them.

The separate **CarDekho AI alternative is at `/ai/`**. Unlike the original root
experience, it requires the FastAPI backend for predictions. See README's
alternative setup and deployment instructions: host Python separately, configure
`VITE_CARDEKHO_API_URL` before the Vercel build, and set the backend's allowed
frontend origin with `CARDEKHO_CORS_ORIGINS`. The root remains browser-only.

A third entry, **`/performance/`**, is the separate Lamborghini-inspired
alternative. It uses the same Python API requirements as `/ai/`, and ships in
the same Vite build. Import branch `feat/cardekho-performance-alternative` for a
preview deployment without replacing the main-branch production site.

## Preview locally

From the project directory:

```bash
npm ci --ignore-scripts
npm run dev
```

Open <http://localhost:5173>. The development server compiles the React hero
and serves the existing prediction workspace and exported model assets.

For a production preview:

```bash
npm test
npm run build
npm run preview
```

Visit <http://localhost:4173>. Stop either server with Control+C.
Alternatively serve the built `dist/` folder with
`python3 -m http.server 8000 --directory dist` and visit port 8000.
Do not double-click `index.html`: browsers restrict loading model JSON over
`file://`, and source TSX must be built first. Node.js 22.12+ is used for testing and building; the browser uses
standard JavaScript modules.

## Push the project to GitHub

The project repository is `https://github.com/SakshamJain17/CarDekho`.
For a new local checkout with no Git history, the basic upload commands are:

```bash
git init
git add .
git commit -m "Add four-dataset price lab and deployable website"
git branch -M main
git remote add origin https://github.com/SakshamJain17/CarDekho.git
git push -u origin main
```

These commands are for an empty repository; if the remote already has commits,
clone it or fetch and preserve its existing history before committing changes.

Commit `index.html`, `web/` (including generated JSON models), `scripts/`,
`src/`, `components/`, `styles/`, `lib/`, `tsconfig.json`, `vite.config.ts`, `components.json`,
`tests/web_fixtures/`, `package.json`, `package-lock.json`, `vercel.json`, and
the workflow files. `web/` contains the exported model data needed to predict.
`.gitignore` excludes `.venv`, Node dependencies, `dist/`, local Vercel state,
and local editor configuration and environment-secret files. Saved Python
joblib models are included, alongside the browser-exported models. A checked-out
clone can deploy without training; to retrain the Python models, install
requirements and run `train.py`.

## Deploy on Vercel

1. Sign in to Vercel and create a new project by importing the GitHub repository.
2. Use the repository root as the Root Directory.
3. Choose **Other** for the framework preset.
4. Use the included configuration: build command `npm run build`, output
   directory `dist`, install command `npm ci --ignore-scripts`.
5. Select Node.js 22.x if the dashboard asks for a Node version.
6. Deploy and test the dataset selector and price form on the generated URL.

`vercel.json` supplies those build settings. Only `dist/` is published, so
raw training CSVs and Python joblib files are not served as website assets.
Vercel supports customized build commands and output directories as described
in its [build configuration documentation](https://vercel.com/docs/builds/configure-a-build).

GitHub's **Check website** workflow runs prediction-equivalence tests and
the static build on pushes and pull requests.

## Optional: also host on GitHub Pages

1. Open the repository's Settings → Pages.
2. Select **GitHub Actions** as the publishing source.
3. Open Actions → **Publish GitHub Pages** → Run workflow.
4. Wait for the build and deployment jobs to finish; open the Pages URL.

The optional Pages workflow is manual, so pushing to GitHub for Vercel does
not automatically attempt a second deployment. All website URLs are relative
and support project paths such as `/cardekho-price-lab/`. This workflow follows
the official [GitHub Pages custom-workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## After retraining

```bash
source .venv/bin/activate
python train.py
python export_web.py
python scripts/export_ai_data.py
npm test
npm run build
```

Commit the updated `web/` and `tests/web_fixtures/` files. The web exporter
supports all three candidate tree algorithms if the validation winner changes.
Do not edit model JSON or displayed metrics by hand. Summaries and model data
include matching source hashes, and the UI rejects mismatched exports.

## Cinematic hero and component structure

The current homepage is mounted by `src/main.tsx` above the prediction
workspace. It uses locally hosted original automotive artwork and an opt-in
Three.js showroom (`components/ui/car-showroom.tsx`). The old unused Ferrari
demo entry and unreferenced legacy frame-sequence component were removed during
cleanup. Neither was used by the current homepage or either alternative.

- `components/ui/`: reusable components, aligned with shadcn's `ui` alias.
- `styles/index.css`: Tailwind 4 imports, supplied design tokens, shadcn
  variables and landing styles. Broken four-hyphen aliases in the pasted
  stylesheet were corrected to real, non-circular CSS variables.
- `web/site.css`: existing workspace styles.
- `lib/utils.ts`: standard `cn()` utility using clsx and tailwind-merge.
- `components.json`: shadcn-compatible aliases and CSS configuration.
- `tsconfig.json` and `vite.config.ts`: TypeScript and runtime `@/` aliases.

The `components/ui` folder gives shared components a predictable home. No global
state provider is required. React refs and local hooks manage the showroom;
CSS and intersection observers manage presentation effects and reduced-motion
preferences. Lucide icons provide the landing-page arrows.

The project has already been configured manually using the official
[Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite)
and [shadcn Vite structure](https://ui.shadcn.com/docs/installation/vite).
To add further shadcn components, run `npx shadcn@latest add button` (or another
component name). For a fresh project, create a Vite React/TypeScript scaffold,
install Tailwind with its Vite plugin, configure the `@/` aliases, and run
`npx shadcn@latest init` as described in those guides. Do not re-scaffold this
existing project.

The showroom loads only after entering the 3D experience. It supports drag/
keyboard rotation, zoom, paint finishes and camera reset, pauses offscreen,
respects reduced motion, and falls back to a local poster when WebGL is not
available. Its concept model is illustrative, not the configured listing.
Credits and licenses are in `web/media/ASSET_CREDITS.md`.

## Deployment checks and limitations

- Prediction-equivalence tests compare 26 inputs per dataset with the saved
  sklearn pipelines, including missing numeric values and unknown categories.
- The default v3 model is roughly 0.15 MB. The basic-dataset Random Forest is
  roughly 9.6 MB before transport compression and loads only when selected;
  its first load may take longer on a slow connection. Model loads are cached
  for the browser session and the form stays disabled until loading completes.
- Selected-model test metrics refer to independent evaluation pipelines;
  the deployed pipelines are refitted on the full cleaned data.
- The exported selected models are public website assets. Only four winners
  are shipped to browsers; all 12 fitted Python pipelines remain local outputs.
- Historic-price and small-dataset-unit limitations are shown in both apps.
- The source repository exists at `SakshamJain17/CarDekho`. Import it into
  Vercel if not already connected. The alternative branch can be deployed as
  a preview without replacing the main-branch production homepage.
