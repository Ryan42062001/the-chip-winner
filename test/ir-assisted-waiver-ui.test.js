import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("waiver UI labels IR-assisted adds as explicit no-drop two-step plans", async () => {
  const source = await readFile(new URL("../src/ui/section-renderer.js", import.meta.url), "utf8");
  assert.match(source, /IR-ASSISTED ADD/);
  assert.match(source, /MOVE TO IR · NO DROP/);
  assert.match(source, /item\.kind === "ir-assisted-add"/);
});

test("Season Plan keeps IR-assisted moves out of the add-drop-only multiweek planner", async () => {
  const source = await readFile(new URL("../src/ui/section-renderer.js", import.meta.url), "utf8");
  assert.match(source, /filter\(\(item\) => item\.kind === "add-drop" && item\.drop\?\.id\)/);
});
