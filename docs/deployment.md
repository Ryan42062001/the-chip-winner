# Deployment and rollback

The public site is deployed from `master` to GitHub Pages by `.github/workflows/deploy-pages.yml`. The test job must pass before the deploy job can publish an artifact.

## Normal release check

1. Run `npm install` after dependency changes.
2. Run `npm run check` locally.
3. Commit and push to `master`.
4. Confirm the **Deploy website** workflow completed successfully.
5. Open `https://ryan42062001.github.io/the-chip-winner/` in a private window and verify the visible release.

The release gate covers 173 automated tests, 20 model-safety fixtures, secret scanning, companion least-privilege rules, static assets, desktop/mobile browser journeys, and automated WCAG 2.2 A/AA checks.

## Safe rollback

Use a normal revert commit; never force-push `master`.

1. Identify the first bad commit with `git log --oneline` and the last successful workflow in GitHub Actions.
2. Run `git revert <bad-commit-sha>` locally. Revert multiple commits newest-first when necessary.
3. Run `npm install` and `npm run check` against the reverted tree.
4. Push the revert commit to `master`.
5. Confirm the new workflow succeeds and verify the public URL in a private window.

If the workflow itself is broken, revert the workflow-changing commit locally, run every still-available check, and push the revert. GitHub Pages keeps serving the last successful artifact until another deployment succeeds.

## Extension rollback

The unpacked Chrome companion is not deployed by GitHub Pages. If a companion update causes a problem:

1. Revert the extension commit in the repository and keep its manifest version internally consistent.
2. In `chrome://extensions`, remove the current unpacked companion.
3. Check out the verified revision, choose **Load unpacked**, and select `extensions/espn-companion`.
4. Reload The Chip Winner and confirm League Setup reports a compatible companion version.

Never distribute a reverted companion that expands permissions or restores ESPN write behavior.

## Incident notes

Record the failed commit, affected behavior, first report time, rollback commit, workflow URL, and follow-up test. Do not include ESPN cookies, private mobile links, league snapshots, or imported ranking files in issues or logs.
