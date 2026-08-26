# Privacy and data handling

The Chip Winner is designed so a private ESPN league can be used without giving the website an ESPN password or cookie.

## What the Chrome companion reads

The companion makes fixed, read-only requests for:

- league settings, teams, rosters, and weekly matchups;
- the league-scoped free-agent and waiver pool;
- the public NFL weekly schedule.

It contains no ESPN transaction, lineup-write, add/drop, waiver-claim, or trade operation.

## Where data goes

ESPN cookies remain inside Chrome's normal request handling. They are never placed in extension messages, website JavaScript, repository files, URLs, or logs.

The normalized league snapshot is sent from the local companion to The Chip Winner page in the same Chrome profile and cached in that browser's local storage. The current static website has no application server, account system, analytics pipeline, or database receiving the snapshot.

## Clearing data

Choose **Use sample** on the website to remove the cached imported or connected snapshot from the browser. Removing the unpacked companion extension revokes its ESPN host access.

## Public repository

Source code, schemas, tests, and synthetic fixtures are public. Real league payloads, ESPN cookies, credentials, and personal league-member data must never be committed. Test fixtures must remain synthetic or sanitized.

## Future changes

Any future server-side storage, analytics, notifications, or ESPN write actions require a separate privacy and security review before release. This document must be updated before those capabilities are enabled.
