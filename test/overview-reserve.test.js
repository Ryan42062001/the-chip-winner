import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderOverviewReserveSection } from "../src/ui/overview-reserve.js";

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

test("overview reserve renderer shows ESPN IR players as a separate roster section", () => {
  const playerIndex = new Map([["pacheco", {
    id: "pacheco",
    name: "Isiah Pacheco",
    position: "RB",
    proTeam: "DET",
    opponent: "NO",
    projection: 0,
    injury: { status: "INJURED_RESERVE" },
  }]]);

  const html = renderOverviewReserveSection({
    reserve: [{ playerId: "pacheco", lineupSlot: "IR" }],
    playerIndex,
    escapeHtml,
  });

  assert.match(html, /<span>IR<\/span><span>1 PLAYER<\/span>/);
  assert.match(html, /data-player-id="pacheco"/);
  assert.match(html, /Isiah Pacheco/);
  assert.match(html, /INJURED_RESERVE/);
  assert.match(html, /<strong>0\.0<\/strong><small>projected<\/small>/);
});

test("overview reserve renderer stays absent when ESPN reports no IR occupants", () => {
  assert.equal(renderOverviewReserveSection({ reserve: [], playerIndex: new Map(), escapeHtml }), "");
});

test("section renderer decorates the overview with the reserve renderer after the base render", async () => {
  const source = await readFile(new URL("../src/ui/section-renderer.js", import.meta.url), "utf8");
  assert.match(source, /decorateOverviewReserve\(\{ content: deps\.content, state, selectTeamContext, escapeHtml: base\.escapeHtml \}\)/);
});
