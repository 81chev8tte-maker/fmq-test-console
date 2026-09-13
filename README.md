# FMQ Test Console

FMQ Test Console is a small adult QA companion for **Family Music Quest (FMQ)**. It guides hardware/usability test procedures on a phone or other browser, records manual observations and provenance, imports FMQ Hardware Report JSON, and preserves and exports evidence for review.

> Test Console records evidence only. Final FMQ acceptance decision: **NOT DETERMINED BY THIS TOOL.**

Family Music Quest production behavior, acceptance criteria, and Issue state remain authoritative in `81chev8tte-maker/tuckers-guitar-trainer` and with the Family Music Quest Project Manager.

## Permanent standalone architecture

- Standalone Vite + React + TypeScript PWA deployed at `https://81chev8tte-maker.github.io/fmq-test-console/`.
- Browser-local storage only; no backend, auth, database, cloud sync, telemetry, or GitHub writes.
- Durable sessions use the namespaced localStorage key `fmq-test-console.sessions.v1`.
- Test packs are revisioned procedure snapshots. Existing sessions keep the exact instructions/revisions they used.
- Imported FMQ-generated evidence stays distinct from Test Console manual observations.
- Public fixtures are synthetic. Real child/hardware evidence must not be committed.

The Test Console and Family Music Quest GitHub Pages apps share the `81chev8tte-maker.github.io` origin but use separate application paths, service-worker scopes, cache identities, and application storage namespaces. Test Console is confined to `/fmq-test-console/`; it must not register a root service worker or manage `/tuckers-guitar-trainer/` resources.

Browser storage is origin-scoped rather than path-scoped. The Test Console therefore keeps its own storage/cache names explicitly namespaced, but **clearing site data for `81chev8tte-maker.github.io` may still affect both sibling applications** because the browser may clear origin-wide storage.

The PWA app shell and bundled Test Console code are precached after a successful online visit so locally stored sessions, guided packs, report preview, and evidence export generation can continue without a network connection. Google-hosted font files are not given a separate runtime cache; system font fallbacks are acceptable offline.

## Service-worker isolation

- Vite base, manifest `id`, manifest `start_url`, manifest `scope`, and service-worker scope are `/fmq-test-console/`.
- Generated service worker URL is `/fmq-test-console/sw.js`.
- Workbox cache identity is `fmq-test-console`.
- Updates use conservative waiting behavior: a new service worker is not configured to force `skipWaiting` or `clientsClaim` over an active evidence session.
- No Test Console code references, precaches, intercepts, purges, or otherwise manages `/tuckers-guitar-trainer/`.

## GitHub Pages deployment

`.github/workflows/pages.yml` builds and deploys only `dist/` from `main` using GitHub's official Pages Actions. The workflow runs `npm ci`, tests, typecheck, the production build, generated-PWA isolation verification, and both npm audits before uploading the Pages artifact.

For a repository that has not previously enabled Pages, set **Settings → Pages → Build and deployment → Source → GitHub Actions** after this workflow is merged. Do not select a branch/folder publishing source.

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
npm run verify:pwa
npm audit
npm audit --omit=dev
```

The production build is emitted to `dist/` with Vite base path `/fmq-test-console/`.
