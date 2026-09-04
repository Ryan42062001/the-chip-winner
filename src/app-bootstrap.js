import "./app.js";
import { ProjectionIdentityMapProvider } from "./providers/projections/projection-identity-map.js";
import { fantasyProsProfileUrlForEspnPlayer } from "./providers/projections/fantasypros-manual-import.js";

const identityMapProvider = new ProjectionIdentityMapProvider();
const espnPlayerSelect = document.querySelector("#manual-espn-player");
const profileUrlInput = document.querySelector("#manual-profile-url");

function syncKnownFantasyProsProfile() {
  const identityMap = identityMapProvider.readCache();
  profileUrlInput.value = fantasyProsProfileUrlForEspnPlayer(identityMap, espnPlayerSelect.value) || "";
}

espnPlayerSelect.addEventListener("change", syncKnownFantasyProsProfile);
new MutationObserver(syncKnownFantasyProsProfile).observe(espnPlayerSelect, { childList: true });
