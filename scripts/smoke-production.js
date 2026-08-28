import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const siteUrl = process.env.SITE_URL || "https://ryan42062001.github.io/the-chip-winner/";
const baseUrl = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;

async function fetchReady(path = "") {
  let lastStatus = "no response";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const response = await fetch(new URL(`${path}${path.includes("?") ? "&" : "?"}release-check=${Date.now()}`, baseUrl), { cache: "no-store" });
      lastStatus = response.status;
      if (response.ok) return response;
    } catch (error) { lastStatus = error.message; }
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }
  throw new Error(`Production asset ${path || "/"} did not become ready (${lastStatus}).`);
}

const html = await (await fetchReady()).text();
for (const expected of ["The Chip Winner", `src/app.js?v=${version}`, `src/styles.css?v=${version}`]) {
  if (!html.includes(expected)) throw new Error(`Production page does not contain expected release marker: ${expected}.`);
}
for (const path of [`src/app.js?v=${version}`, `src/styles.css?v=${version}`, "src/data/sample-espn-snapshot.json"]) await fetchReady(path);

console.log(`Production release ${version} is available at ${baseUrl}`);
