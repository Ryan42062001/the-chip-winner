const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const limit = (value) => value === -1 ? "Unlimited" : value ?? "Unavailable";
const waiverPeriod = (days) => Number.isInteger(days) && days >= 0 ? `${days} day${days === 1 ? "" : "s"}` : "Unavailable";
const acquisitionSystem = (type) => type === "WAIVERS_TRADITIONAL" ? "Waivers" : type ?? "Unavailable";

export function renderAcquisitionSettingsCard(waiver = {}, acquisition = {}, currentWeek = null) {
  const budgetRemaining = waiver.usesAcquisitionBudget === true && waiver.budget != null && acquisition.budgetSpent != null
    ? Math.max(0, waiver.budget - acquisition.budgetSpent)
    : null;
  const budgetDisplay = waiver.usesAcquisitionBudget === false ? "Not used" : budgetRemaining;
  const value = (item) => escapeHtml(item ?? "Unavailable");
  return `<article class="panel"><div class="panel-head"><div><p class="eyebrow">ACQUISITIONS</p><h3>Waiver settings and usage</h3></div></div><dl class="settings-list"><div><dt>Player acquisition system</dt><dd>${value(acquisitionSystem(waiver.acquisitionType))}</dd></div><div><dt>Season limit</dt><dd>${value(limit(waiver.acquisitionLimit))}</dd></div><div><dt>Season acquisitions</dt><dd>${value(acquisition.seasonAcquisitions)}</dd></div><div><dt>Weekly limit</dt><dd>${value(limit(waiver.matchupAcquisitionLimit))}</dd></div><div><dt>Week ${value(currentWeek)} acquisitions</dt><dd>${value(acquisition.matchupAcquisitions)}</dd></div><div><dt>Waiver priority</dt><dd>${value(acquisition.waiverRank)}</dd></div><div><dt>Waiver period</dt><dd>${value(waiverPeriod(waiver.waiverProcessDays))}</dd></div><div><dt>Budget remaining</dt><dd>${value(budgetDisplay)}</dd></div></dl><p class="data-note">ESPN-reported limits and counters can suppress impossible moves. A budget is shown only when ESPN explicitly says the league uses an acquisition budget. Waiver priority does not predict whether a claim will succeed.</p></article>`;
}
