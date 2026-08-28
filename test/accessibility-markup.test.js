import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8"); const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("page exposes skip navigation and labeled mobile navigation controls", () => {
  assert.match(html, /class="skip-link" href="#app-content"/); assert.match(html, /aria-controls="primary-sidebar"/); assert.match(html, /aria-expanded="false"/); assert.match(html, /id="app-content"[^>]*tabindex="-1"/);
});

test("styles respect reduced motion preferences", () => { assert.match(css, /prefers-reduced-motion:reduce/); });

test("first-run onboarding has an accessible dialog name, description, and explicit choices", () => {
  assert.match(html, /id="onboarding-dialog"[^>]*aria-labelledby="onboarding-title"[^>]*aria-describedby="onboarding-description"/);
  assert.match(html, /id="onboarding-save-button"/); assert.match(html, /id="onboarding-sample-button"/);
});
