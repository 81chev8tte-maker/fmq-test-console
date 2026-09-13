# FMQ Test Console agent guidance

This repository contains only the adult **FMQ Test Console** QA companion. Family Music Quest production truth remains in `81chev8tte-maker/tuckers-guitar-trainer`; consult its current governance and hardware/testing documentation before changing mirrored test procedures.

The Test Console may guide tests and record, import, preserve, and export evidence. It must never determine an FMQ Issue-level PASS/BLOCKER decision and must never automatically modify FMQ GitHub Issues or status labels. Do not copy FMQ scoring, detector, input, progression, audio, save, or other product/runtime logic into this repository.

Keep the app local-first and browser-only by default. Do not add backend services, authentication, cloud sync, databases, telemetry, or GitHub-write automation without explicit Project Manager approval. Public repository fixtures must be synthetic/original/redistributable; never commit real child, family, or hardware evidence.

Test-pack definitions mirror authoritative FMQ procedures. Keep explicit revision IDs and preserve immutable session snapshots so later catalog changes cannot rewrite old evidence. Because GitHub Pages projects may share the `81chev8tte-maker.github.io` origin, all browser storage, future IndexedDB names, service-worker scopes, and cache names must be strictly Test Console namespaced (`fmq-test-console.*` or an equally explicit Test Console prefix) and must never touch FMQ production storage/cache names.

Keep releases focused. Automated tests verify application behavior but do not replace real Chromebook/hardware acceptance of Family Music Quest.
