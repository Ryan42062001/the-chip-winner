export function bindShellEvents({ content, store, appSection, render, openPlayerDetail, alertPreferences, showNotice }) {
const sidebar = document.querySelector(".sidebar"); const menu = document.querySelector(".mobile-menu");
window.addEventListener("hashchange", () => { store.dispatch({ type: "section/select", section: appSection() }); render(); content.focus({ preventScroll: true }); });
menu.addEventListener("click", (event) => { const open = sidebar.classList.toggle("open"); event.currentTarget.setAttribute("aria-expanded", String(open)); event.currentTarget.setAttribute("aria-label", open ? "Close navigation" : "Open navigation"); });
document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", () => { sidebar.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); }));
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && sidebar.classList.contains("open")) { sidebar.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); menu.setAttribute("aria-label", "Open navigation"); menu.focus(); } });
content.addEventListener("click", (event) => { if (event.target.closest("[data-dismiss-alert]")) return; const row = event.target.closest("[data-player-id]"); if (row) openPlayerDetail(row.dataset.playerId); });
content.addEventListener("click", (event) => { const dismiss = event.target.closest("[data-dismiss-alert]"); if (dismiss) { event.stopPropagation(); alertPreferences.dismiss(dismiss.dataset.dismissAlert); render(); showNotice("Alert dismissed for this week."); } if (event.target.closest("#restore-alerts-button")) { alertPreferences.restoreAll(); render(); showNotice("Dismissed alerts restored."); } });
content.addEventListener("keydown", (event) => { if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-player-id]")) { event.preventDefault(); openPlayerDetail(event.target.dataset.playerId); } });
}
