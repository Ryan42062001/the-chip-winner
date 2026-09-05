import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("weekly projection update control is hidden by default and browser source hosts are scoped in CSP", async () => {
  const [html, packageText] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8")
  ]);
  const { version } = JSON.parse(packageText);
  assert.match(html, /id="weekly-projection-update-button"[^>]*hidden/);
  assert.match(html, /https:\/\/raw\.githubusercontent\.com/);
  assert.match(html, /https:\/\/api\.github\.com/);
  assert.match(html, new RegExp(`src/weekly-projection-update-controller\\.js\\?v=${version.replaceAll(".", "\\.")}`));
});
