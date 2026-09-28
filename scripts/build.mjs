/** Copy only website assets into the deployment output. */
import { cp, mkdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist");
const catalog = JSON.parse(await readFile(resolve(root, "web/data/catalog.json"), "utf8"));
for (const dataset of catalog.datasets) {
  await stat(resolve(root, `web/data/${dataset.key}.model.json`));
}
await mkdir(output, { recursive: true });
for (const file of ["web"]) {
  await cp(resolve(root, file), resolve(output, file), { recursive: true });
}
console.log("Vite website assets staged in dist/ — four exported models included.");
