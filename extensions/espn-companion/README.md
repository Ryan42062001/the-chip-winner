# ESPN Companion extension

This unpacked Chrome extension lets the public The Chip Winner site read a private ESPN league through the ESPN session already active in Chrome.

Current reviewed companion version: **0.2.2**.

## Security boundary

- The extension requests access only to ESPN's reviewed read API hosts and declares no general Chrome permissions.
- The content bridge runs only on the deployed Chip Winner URL and local development URL.
- Page messages must come from the same window and same origin.
- The service worker rejects runtime messages that were not sent by this extension itself.
- Cookies never enter website JavaScript or extension messages, and the extension does not call Chrome's cookie API.
- The service worker accepts only the fixed ping/fetch operations and constructs the ESPN URL itself.
- League and season IDs must contain only digits.
- The reviewed ESPN league views are fixed in the service worker.
- The companion does not persist ESPN responses, log them, execute dynamic code, or perform ESPN write operations.

`scripts/audit-extension.js` makes these assumptions release-blocking. If the permissions, origins, hosts, message surface, or runtime capabilities change, that audit should fail until the new boundary is deliberately reviewed.

## Install for development

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the `extensions/espn-companion` folder.
5. Confirm Chrome shows version **0.2.2** or newer.
6. Sign in to ESPN in the same Chrome profile.
7. Reload The Chip Winner website and choose **Connect ESPN**.

Chrome may display the normal warning for a developer-mode unpacked extension. Do not package or publish this extension until its permissions, privacy disclosures, and distribution process have been reviewed.
