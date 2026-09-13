export function snapshotSourceLabel(state) {
const snapshot = state?.snapshot;
if (state?.source === "sync") return "Encrypted mobile snapshot";
if (snapshot?.meta?.kind === "live-companion") {
return state?.refreshRecovery?.status === "failed" ? "Last valid ESPN snapshot · refresh failed" : "Live ESPN snapshot";
}
if (state?.source === "cache") return "Imported snapshot";
return "Sample snapshot";
}

export function describeEspnRefreshFailure(message) {
const detail = String(message || "ESPN refresh failed.").trim();
if (/not detected/i.test(detail)) return `${detail} See the setup guide in the repository.`;
if (/companion/i.test(detail) && /(outdated|valid version|reload|reinstall)/i.test(detail)) return detail;
if (/^Save a valid ESPN connection/i.test(detail) || /^Please wait \d+ seconds before refreshing/i.test(detail)) return detail;
return `${detail} Refresh failed. Check network connectivity, Chrome companion availability, and ESPN sign-in in this Chrome profile, then retry.`;
}
