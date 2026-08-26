# ESPN Companion extension

This unpacked Chrome extension lets the public The Chip Winner site read a private ESPN league through the ESPN session already active in Chrome.

## Security boundary

- The extension requests access only to ESPN's read API.
- The content bridge runs only on the deployed Chip Winner URL and local development URL.
- Cookies never enter website JavaScript or extension messages.
- The service worker accepts fixed operations and constructs the ESPN URL itself.
- League and season IDs must contain only digits.
- The extension performs no ESPN write operations.

## Install for development

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the `extensions/espn-companion` folder.
5. Sign in to ESPN in the same Chrome profile.
6. Reload The Chip Winner website and choose **Connect ESPN**.

Chrome may display the normal warning for a developer-mode unpacked extension. Do not package or publish this extension until its permissions and distribution process have been reviewed.
