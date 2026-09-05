import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("weekly projection update control is hidden by default and browser source hosts are scoped in CSP", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="weekly-projection-update-button"[^>]*hidden/);
  assert.match(html, /https:\/\/raw\.githubusercontent\.com/);
  assert.match(html, /https:\/\/api\.github\.com/);
  assert.match(html, /src\/weekly-projection-update-controller\.js\?v=0\.9\.62/);
});
