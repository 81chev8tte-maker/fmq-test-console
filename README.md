# FMQ Test Console

FMQ Test Console is a small adult QA companion for **Family Music Quest (FMQ)**. It guides hardware/usability test procedures on a phone or other browser, records manual observations and provenance, imports FMQ Hardware Report JSON, and preserves evidence for review.

> Test Console records evidence only. Final FMQ acceptance decision: **NOT DETERMINED BY THIS TOOL.**

Family Music Quest production behavior, acceptance criteria, and Issue state remain authoritative in `81chev8tte-maker/tuckers-guitar-trainer` and with the Family Music Quest Project Manager.

## Architecture boundary

- Standalone Vite + React + TypeScript static application.
- Browser-local storage only; no backend, auth, database, cloud sync, telemetry, or GitHub writes.
- Durable sessions use the namespaced localStorage key `fmq-test-console.sessions.v1`.
- Test packs are revisioned procedure snapshots. Existing sessions keep the exact instructions/revisions they used.
- Imported FMQ-generated evidence stays distinct from Test Console manual observations.
- Public fixtures are synthetic. Real child/hardware evidence must not be committed.

The eventual GitHub Pages target is `https://81chev8tte-maker.github.io/fmq-test-console/`. G1 configures the build base path but does not add a service worker or publish/install the app.

Browser storage is origin-scoped, not path-scoped. Existing Floot-origin localStorage does **not** migrate automatically to GitHub Pages, and sibling GitHub Pages projects can share the same origin. Test Console code must therefore keep storage/cache names strictly Test Console namespaced.

## Local development

Requires a current Node.js LTS release.

```sh
npm ci
npm run dev
```

Verification:

```sh
npm test
npm run typecheck
npm run build
```

The production build is emitted to `dist/` with Vite base path `/fmq-test-console/`.
