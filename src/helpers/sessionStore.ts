import { testPackCatalog } from "./testPackCatalog";
import { hardwareReportImport } from "./hardwareReportImport";

const STORAGE_KEY = "fmq-test-console.sessions.v1";

type SessionSetup = {
  fmqVersion: string;
  testDateTime: string;
  tester: "adult" | "tucker" | "both";
  targetDevice: string;
  browserMode: "installed-pwa" | "chrome-tab" | "other";
  guitarInput: "not-testing" | "internal-mic" | "usb-direct" | "other";
  pianoInput: "not-testing" | "internal-mic" | "midi" | "on-screen" | "other";
  notes: string;
};

type PackSnapshot = {
  id: string;
  title: string;
  issueRefs: string[];
  revisionId: string;
  snapshotDate: string;
  statusContext: string;
  purpose: string;
  setup: string[];
  steps: Array<{ id: string; instruction: string; expected: string }>;
  structuredEvidence?: {
    kind: "piano40";
    title: string;
    note: string;
    fields: Array<{ key: string; label: string; input: "count" | "text"; help: string }>;
  };
  completionRule: string;
  referenceOnly?: boolean;
};

type StepObservation = {
  result: "pass" | "problem" | "not-tested" | null;
  actualBehavior: string;
  notes: string;
  reproductionFrequency: "always" | "sometimes" | "once" | "unknown";
  provenance: "adult" | "child" | "both";
  evidenceLabel: string;
  structured: Record<string, string>;
  updatedAt: string;
};

type SessionCursor = { packId: string; stepId: string };
type ImportedHardwareSource = Extract<ReturnType<typeof hardwareReportImport.parseText>, { ok: true }>["source"];
type ConsoleSession = {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  updatedAt: string;
  setup: SessionSetup;
  packSnapshots: PackSnapshot[];
  observations: Record<string, StepObservation>;
  cursor: SessionCursor;
  importedSources: ImportedHardwareSource[];
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const hasStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);
const monotonicNow = (after?: string) => {
  const afterMs = after ? Date.parse(after) : Number.NaN;
  const minimum = Number.isFinite(afterMs) ? afterMs + 1 : 0;
  return new Date(Math.max(Date.now(), minimum)).toISOString();
};
const makeSessionId = (existingIds: Set<string>) => {
  let id = "";
  do {
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    id = `FMQ-TC-${stamp}-${suffix}`;
  } while (existingIds.has(id));
  return id;
};
const observationKey = (packId: string, stepId: string) => `${packId}::${stepId}`;
const defaultProvenance = (tester: SessionSetup["tester"]): StepObservation["provenance"] => tester === "tucker" ? "child" : tester === "both" ? "both" : "adult";
const emptyObservation = (session: ConsoleSession): StepObservation => ({
  result: null, actualBehavior: "", notes: "", reproductionFrequency: "unknown",
  provenance: defaultProvenance(session.setup.tester), evidenceLabel: "", structured: {}, updatedAt: session.updatedAt,
});
const loadSessions = (): ConsoleSession[] => {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ConsoleSession => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<ConsoleSession>;
      return candidate.schemaVersion === 1 && typeof candidate.id === "string" && typeof candidate.updatedAt === "string"
        && Array.isArray(candidate.packSnapshots) && Boolean(candidate.cursor) && Boolean(candidate.setup) && Boolean(candidate.observations);
    }).map((session) => ({ ...session, importedSources: Array.isArray(session.importedSources) ? clone(session.importedSources) : [] }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch { return []; }
};
const writeSessions = (sessions: ConsoleSession[]) => { if (hasStorage()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); };
const getProgress = (session: ConsoleSession, packId?: string) => {
  const packs = packId ? session.packSnapshots.filter((pack) => pack.id === packId) : session.packSnapshots;
  const total = packs.reduce((sum, pack) => sum + pack.steps.length, 0);
  const recorded = packs.reduce((sum, pack) => sum + pack.steps.filter((step) => Boolean(session.observations[observationKey(pack.id, step.id)]?.result)).length, 0);
  return { recorded, total };
};
const isSessionComplete = (session: ConsoleSession) => { const { recorded, total } = getProgress(session); return total > 0 && recorded === total; };
const getFlatSteps = (session: ConsoleSession) => session.packSnapshots.flatMap((pack) => pack.steps.map((step) => ({ pack, step })));
const getCursorIndex = (session: ConsoleSession) => getFlatSteps(session).findIndex(({ pack, step }) => pack.id === session.cursor.packId && step.id === session.cursor.stepId);
const getCursorItem = (session: ConsoleSession) => {
  const items = getFlatSteps(session);
  const index = getCursorIndex(session);
  return { item: index >= 0 ? items[index] : items[0] ?? null, index: index >= 0 ? index : 0, total: items.length };
};
const saveSession = (session: ConsoleSession) => {
  const sessions = loadSessions();
  const existingIndex = sessions.findIndex((item) => item.id === session.id);
  const next = clone(session);
  if (existingIndex >= 0) sessions[existingIndex] = next; else sessions.push(next);
  sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  writeSessions(sessions);
  return sessions;
};
const createSession = (setup: SessionSetup, selectedPackIds: string[]): ConsoleSession => {
  const selectedPacks = testPackCatalog.filter((pack) => selectedPackIds.includes(pack.id));
  if (selectedPacks.length === 0) throw new Error("At least one test pack is required.");
  const existingSessions = loadSessions();
  const existingIds = new Set(existingSessions.map((session) => session.id));
  const now = monotonicNow(existingSessions[0]?.updatedAt);
  const packSnapshots = selectedPacks.map((pack) => clone(pack) as PackSnapshot);
  const firstPack = packSnapshots[0];
  const firstStep = firstPack.steps[0];
  return { schemaVersion: 1, id: makeSessionId(existingIds), createdAt: now, updatedAt: now, setup: clone(setup), packSnapshots, observations: {}, cursor: { packId: firstPack.id, stepId: firstStep.id }, importedSources: [] };
};
const updateObservation = (session: ConsoleSession, packId: string, stepId: string, patch: Partial<StepObservation>): ConsoleSession => {
  const now = monotonicNow(session.updatedAt);
  const key = observationKey(packId, stepId);
  const current = session.observations[key] ?? emptyObservation(session);
  return { ...session, updatedAt: now, observations: { ...session.observations, [key]: { ...current, ...patch, structured: patch.structured ? { ...current.structured, ...patch.structured } : current.structured, updatedAt: now } } };
};
const updateCursor = (session: ConsoleSession, cursor: SessionCursor): ConsoleSession => ({ ...session, cursor: { ...cursor }, updatedAt: monotonicNow(session.updatedAt) });
const moveCursor = (session: ConsoleSession, delta: -1 | 1): ConsoleSession => {
  const items = getFlatSteps(session); const currentIndex = getCursorIndex(session); const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = Math.min(Math.max(safeIndex + delta, 0), Math.max(items.length - 1, 0)); const next = items[nextIndex];
  return next ? updateCursor(session, { packId: next.pack.id, stepId: next.step.id }) : session;
};
const openPack = (session: ConsoleSession, packId: string): ConsoleSession => {
  const pack = session.packSnapshots.find((candidate) => candidate.id === packId); if (!pack) return session;
  const firstIncomplete = pack.steps.find((step) => !session.observations[observationKey(pack.id, step.id)]?.result);
  const target = firstIncomplete ?? pack.steps[0]; return target ? updateCursor(session, { packId: pack.id, stepId: target.id }) : session;
};
const getLastActiveUnfinished = (sessions: ConsoleSession[]) => [...sessions].filter((session) => !isSessionComplete(session)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
const addImportedSource = (session: ConsoleSession, source: ImportedHardwareSource): ConsoleSession => {
  const alreadyPresent = session.importedSources.some((existing) => existing.rawFingerprint === source.rawFingerprint || existing.sourceIdentity === source.sourceIdentity);
  if (alreadyPresent) return session;
  return { ...session, importedSources: [...session.importedSources, clone(source)], updatedAt: monotonicNow(session.updatedAt) };
};
const replaceImportedSource = (session: ConsoleSession, sourceIdentity: string, source: ImportedHardwareSource): ConsoleSession => {
  const index = session.importedSources.findIndex((existing) => existing.sourceIdentity === sourceIdentity); if (index < 0) return session;
  const importedSources = [...session.importedSources]; importedSources[index] = clone(source);
  return { ...session, importedSources, updatedAt: monotonicNow(session.updatedAt) };
};

export const sessionStore = {
  storageKey: STORAGE_KEY, createSession, loadSessions, saveSession, getProgress, isSessionComplete, getLastActiveUnfinished,
  getCursorItem, getObservation: (session: ConsoleSession, packId: string, stepId: string) => session.observations[observationKey(packId, stepId)] ?? emptyObservation(session),
  updateObservation, updateCursor, moveCursor, openPack, addImportedSource, replaceImportedSource,
};
