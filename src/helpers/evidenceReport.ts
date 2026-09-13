import { sessionStore } from "./sessionStore";
type ConsoleSession = ReturnType<typeof sessionStore.createSession>;
const DISCLAIMER = "Test Console records evidence only. Final FMQ acceptance decision: NOT DETERMINED BY THIS TOOL.";
const AUTHORITY = "Current Family Music Quest repository/GitHub state and Project Manager judgment remain authoritative.";
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const labelTester = (value: ConsoleSession["setup"]["tester"]) => value === "tucker" ? "Tucker / Child" : value === "both" ? "Both" : "Dad / Adult";
const labelMode = (value: ConsoleSession["setup"]["browserMode"]) => value === "chrome-tab" ? "Chrome tab" : value === "other" ? "Other" : "Installed PWA";
const labelInput = (value: string) => value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
const labelFrequency = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const labelProvenance = (value: string) => value === "child" ? "Child" : value === "both" ? "Both" : "Adult";
const labelDisposition = (value: string | null | undefined) => value === "pass" ? "PASS" : value === "problem" ? "PROBLEM" : value === "not-tested" ? "NOT TESTED" : "UNRECORDED";
const safeJson = (value: unknown) => JSON.stringify(value ?? null, null, 2);
const safeFilePart = (value: string) => value.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "") || "session";
const uniqueImportedSources = (session: ConsoleSession) => {
  const seen = new Set<string>();
  return session.importedSources.filter((source) => { const key = source.sourceIdentity || source.rawFingerprint; if (seen.has(key)) return false; seen.add(key); return true; });
};
const observationKey = (packId: string, stepId: string) => `${packId}::${stepId}`;
const structuredLines = (session: ConsoleSession, pack: ConsoleSession["packSnapshots"][number], stepId: string) => {
  const observation = session.observations[observationKey(pack.id, stepId)];
  if (!observation || Object.keys(observation.structured || {}).length === 0) return [];
  const labels = new Map((pack.structuredEvidence?.fields ?? []).map((field) => [field.key, field.label]));
  return Object.entries(observation.structured).filter(([, value]) => String(value).trim() !== "").map(([key, value]) => `    - ${labels.get(key) ?? key}: ${value}`);
};
const buildTextReport = (session: ConsoleSession) => {
  const lines: string[] = [];
  const progress = sessionStore.getProgress(session);
  const problems = session.packSnapshots.flatMap((pack) => pack.steps.flatMap((step) => {
    const observation = session.observations[observationKey(pack.id, step.id)];
    return observation?.result === "problem" ? [{ pack, step, observation }] : [];
  }));
  lines.push("FAMILY MUSIC QUEST — TEST CONSOLE EVIDENCE REPORT", "", "SESSION");
  lines.push(`Test Console session ID: ${session.id}`);
  lines.push(`FMQ version/build under test: ${session.setup.fmqVersion}`);
  lines.push(`Test date/time: ${session.setup.testDateTime}`);
  lines.push(`Tester: ${labelTester(session.setup.tester)}`);
  lines.push(`Target device: ${session.setup.targetDevice}`);
  lines.push(`Browser/PWA mode: ${labelMode(session.setup.browserMode)}`);
  lines.push(`Guitar input: ${labelInput(session.setup.guitarInput)}`);
  lines.push(`Piano input: ${labelInput(session.setup.pianoInput)}`);
  if (session.setup.notes.trim()) lines.push(`Setup notes: ${session.setup.notes.trim()}`);
  lines.push(`Evidence progress: ${progress.recorded} / ${progress.total} steps recorded${progress.total > 0 && progress.recorded === progress.total ? " — evidence entry complete" : ""}`);
  lines.push("", "TEST PACKS");
  session.packSnapshots.forEach((pack, index) => {
    const packProgress = sessionStore.getProgress(session, pack.id);
    lines.push(`${index + 1}. ${pack.title}`, `   Issues: ${pack.issueRefs.join(", ") || "None"}`, `   Frozen revision: ${pack.revisionId}`, `   Evidence progress: ${packProgress.recorded} / ${packProgress.total} recorded`);
  });
  lines.push("", "MANUAL TEST CONSOLE EVIDENCE", "PASS / PROBLEM / NOT TESTED are step observations only. UNRECORDED means no disposition was entered.", "", "PROBLEM OBSERVATIONS — TRIAGE FIRST");
  if (problems.length) problems.forEach(({ pack, step }, index) => lines.push(`${index + 1}. ${pack.title} [${pack.issueRefs.join(", ")}] — ${step.instruction}`));
  else lines.push("None recorded in this Test Console session.");
  session.packSnapshots.forEach((pack) => {
    lines.push("", `${pack.title} [${pack.issueRefs.join(", ")}]`, `Frozen revision: ${pack.revisionId}`);
    pack.steps.forEach((step, index) => {
      const observation = session.observations[observationKey(pack.id, step.id)];
      const disposition = labelDisposition(observation?.result);
      lines.push(`  Step ${index + 1}: ${step.instruction}`, `  Disposition: ${disposition}${disposition === "PASS" ? " (step observation only)" : ""}`, `  Expected: ${step.expected}`);
      if (!observation?.result) lines.push("  Actual: UNRECORDED");
      else {
        lines.push(`  Actual: ${observation.actualBehavior.trim() || "(not supplied)"}`, `  Reproduction: ${labelFrequency(observation.reproductionFrequency)}`, `  Provenance: ${labelProvenance(observation.provenance)}`);
        if (observation.notes.trim()) lines.push(`  Notes: ${observation.notes.trim()}`);
        if (observation.evidenceLabel.trim()) lines.push(`  Evidence label/file: ${observation.evidenceLabel.trim()}`);
        const structured = structuredLines(session, pack, step.id);
        if (structured.length) { lines.push("  Structured evidence:"); lines.push(...structured); }
      }
    });
  });
  lines.push("", "IMPORTED FMQ-GENERATED / GUIDED EVIDENCE");
  const imported = uniqueImportedSources(session);
  if (!imported.length) lines.push("No FMQ Hardware Report was imported into this Test Console session.");
  else imported.forEach((source, index) => {
    lines.push("", `Source ${index + 1}: FMQ-generated / guided evidence`, `FMQ Hardware session ID: ${source.fmqSessionId ?? "Not supplied"}`, `FMQ app version/build: ${source.appVersion ?? "Not supplied"}`, `FMQ commit: ${source.commit ?? "Not supplied"}`, `Report generated: ${source.generatedAt ?? "Not supplied"}`, `Guided report version: ${source.guidedVersion ?? "Not supplied"}`, `Guitar path status: ${source.pathStatuses.guitar ?? "Not supplied"}`, `Piano microphone path status: ${source.pathStatuses.pianoMicrophone ?? "Not supplied"}`, `MIDI path status: ${source.pathStatuses.midi ?? "Not supplied"}`, `Completed guided paths: ${source.completedGuidedPaths.length ? source.completedGuidedPaths.join(", ") : "None recorded"}`, `Player/profile metadata: ${safeJson(source.player)}`, `Platform metadata: ${safeJson(source.platform)}`, `Warnings: ${source.warnings.length ? source.warnings.map(String).join(" | ") : "None"}`, `Tests not performed: ${source.testsNotPerformed.length ? source.testsNotPerformed.map(String).join(" | ") : "None"}`, "FMQ human observations (original FMQ values/provenance):", safeJson(source.humanObservations), "FMQ human evidence (original FMQ values/provenance):", safeJson(source.humanEvidence));
  });
  lines.push("", "GOVERNANCE", DISCLAIMER, AUTHORITY);
  return lines.join("\n");
};
const buildJsonEnvelope = (session: ConsoleSession, generatedAt = new Date().toISOString()) => {
  const progress = sessionStore.getProgress(session);
  return {
    format: "family-music-quest-test-console-evidence", version: 1, generatedAt,
    governance: { evidenceOnly: true, disclaimer: DISCLAIMER, authority: AUTHORITY },
    session: { schemaVersion: session.schemaVersion, id: session.id, createdAt: session.createdAt, updatedAt: session.updatedAt, setup: clone(session.setup), cursor: clone(session.cursor), progress: { recorded: progress.recorded, total: progress.total, evidenceEntryComplete: progress.total > 0 && progress.recorded === progress.total } },
    frozenTestPackSnapshots: clone(session.packSnapshots), manualObservations: clone(session.observations), importedFmqEvidence: clone(uniqueImportedSources(session)),
  };
};
const fileNames = (session: ConsoleSession) => { const base = `fmq-test-console-${safeFilePart(session.id)}`; return { text: `${base}.txt`, json: `${base}.json` }; };
export const evidenceReport = { disclaimer: DISCLAIMER, authority: AUTHORITY, buildTextReport, buildJsonEnvelope, buildJsonText: (session: ConsoleSession, generatedAt = new Date().toISOString()) => JSON.stringify(buildJsonEnvelope(session, generatedAt), null, 2), fileNames };
