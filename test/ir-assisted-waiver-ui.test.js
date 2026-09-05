import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("waiver UI labels IR-assisted adds as explicit no-drop two-step plans", async () => {
  const source = await readFile(new URL("../src/ui/section-renderer.js", import.meta.url), "utf8");
  assert.match(source, /IR-ASSISTED ADD/);
  assert.match(source, /MOVE TO IR · NO DROP/);
  assert.match(source, /item\.kind === "ir-assisted-add"/);
});

test("Season Plan passes explicit IR-assisted no-drop scenarios into the multiweek planner", async () => {
  const source = await readFile(new URL("../src/ui/section-renderer.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /filter\(\(item\) => item\.kind === "add-drop" && item\.drop\?\.id\)/);
  assert.match(source, /kind: "ir-assisted-add", addPlayerId: item\.add\.id, irPlayerId: item\.irMove\.player\.id/);
  assert.match(source, /move .* to IR · no drop/);
  assert.match(source, /Waiver impact/);
});
