const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const limit = (value) => value === -1 ? "Unlimited" : value ?? "Unavailable";

export function renderAcquisitionSettingsCard(waiver = {}, acquisition = {}, currentWeek = null) {
  const budgetRemaining = waiver.budget != null && acquisition.budgetSpent != null ? Math.max(0, waiver.budget - acquisition.budgetSpent) : null;
  const value = (item) => escapeHtml(item ?? "Unavailable");
  return `<article class="panel"><div class="panel-head"><div><p class="eyebrow">ACQUISITIONS</p><h3>Waiver settings and usage</h3></div></div><dl class="settings-list"><div><dt>Season limit</dt><dd>${value(limit(waiver.acquisitionLimit))}</dd></div><div><dt>Season acquisitions</dt><dd>${value(acquisition.seasonAcquisitions)}</dd></div><div><dt>Weekly limit</dt><dd>${value(limit(waiver.matchupAcquisitionLimit))}</dd></div><div><dt>Week ${value(currentWeek)} acquisitions</dt><dd>${value(acquisition.matchupAcquisitions)}</dd></div><div><dt>Waiver priority</dt><dd>${value(acquisition.waiverRank)}</dd></div><div><dt>Processing days</dt><dd>${value(waiver.waiverProcessDays)}</dd></div><div><dt>Budget remaining</dt><dd>${value(budgetRemaining)}</dd></div></dl><p class="data-note">ESPN-reported limits and counters can suppress impossible moves. Waiver priority does not predict whether a claim will succeed.</p></article>`;
}
