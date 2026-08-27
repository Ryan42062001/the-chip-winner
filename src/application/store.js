export function createStore(initialState, reducer) {
  let state = Object.freeze({ ...initialState });
  const listeners = new Set();
  return Object.freeze({
    getState: () => state,
    dispatch(action) {
      const next = reducer(state, action);
      if (next !== state) {
        state = Object.freeze(next);
        listeners.forEach((listener) => listener(state, action));
      }
      return action;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  });
}

export const initialAppState = Object.freeze({
  status: "idle",
  snapshot: null,
  previousSnapshot: null,
  selectedTeamId: null,
  section: "overview",
  source: null,
  rankingSet: null,
  rankingReconciliation: null,
  error: null
});

export function appReducer(state, action) {
  switch (action.type) {
    case "load/start": return { ...state, status: "loading", error: null };
    case "load/success": return { ...state, status: "ready", snapshot: action.snapshot, previousSnapshot: action.previousSnapshot ?? null, source: action.source, selectedTeamId: action.snapshot.teams[0]?.id || null, error: null };
    case "rankings/load": return { ...state, rankingSet: action.rankingSet, rankingReconciliation: action.reconciliation };
    case "rankings/clear": return { ...state, rankingSet: null, rankingReconciliation: null };
    case "load/error": return { ...state, status: "error", error: action.error };
    case "team/select": return state.snapshot?.teams.some((team) => team.id === action.teamId) ? { ...state, selectedTeamId: action.teamId } : state;
    case "section/select": return { ...state, section: action.section };
    default: return state;
  }
}
