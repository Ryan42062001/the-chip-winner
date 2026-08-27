import test from "node:test";
import assert from "node:assert/strict";
import { appReducer, createStore, initialAppState } from "../src/application/store.js";

const snapshot = { teams: [{ id: "a" }, { id: "b" }] };

test("store publishes immutable application transitions", () => {
  const store = createStore(initialAppState, appReducer);
  const actions = [];
  store.subscribe((state, action) => actions.push([state.status, action.type]));
  store.dispatch({ type: "load/start" });
  store.dispatch({ type: "load/success", snapshot, source: "sample" });
  store.dispatch({ type: "team/select", teamId: "b" });
  assert.equal(store.getState().selectedTeamId, "b");
  assert.equal(Object.isFrozen(store.getState()), true);
  assert.deepEqual(actions.map((item) => item[1]), ["load/start", "load/success", "team/select"]);
});

test("store ignores a team that is not present", () => {
  const ready = appReducer(initialAppState, { type: "load/success", snapshot, source: "sample" });
  assert.equal(appReducer(ready, { type: "team/select", teamId: "missing" }), ready);
});

test("store can restore a configured team after snapshot load", () => {
  let state = appReducer(initialAppState, { type: "load/success", snapshot, source: "cache" });
  state = appReducer(state, { type: "team/select", teamId: "b" });
  assert.equal(state.selectedTeamId, "b");
});
