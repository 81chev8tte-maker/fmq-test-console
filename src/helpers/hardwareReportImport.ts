type JsonObject = Record<string, unknown>;

type ImportedHardwareSource = {
  sourceType: "fmq-hardware-report";
  sourceIdentity: string;
  fmqSessionId: string | null;
  reportFormat: string;
  reportVersion: number;
  guidedFormat: string | null;
  guidedVersion: number | null;
  appVersion: string | null;
  commit: string | null;
  generatedAt: string | null;
  player: unknown;
  platform: unknown;
  guidedEvidence: { guitar: unknown; pianoMicrophone: unknown; midi: unknown };
  humanObservations: unknown;
  humanEvidence: unknown;
  warnings: unknown[];
  testsNotPerformed: unknown[];
  completedGuidedPaths: string[];
  pathStatuses: { guitar: string | null; pianoMicrophone: string | null; midi: string | null };
  evidenceFingerprint: string;
  rawFingerprint: string;
  importedAt: string;
  fileName: string | null;
  rawReport: JsonObject;
};

type ParseResult = { ok: true; source: ImportedHardwareSource } | { ok: false; error: string };
type ComparisonResult =
  | { kind: "new" }
  | { kind: "duplicate"; existingIndex: number; reason: string }
  | { kind: "conflict"; existingIndex: number; reason: string };

const isObject = (value: unknown): value is JsonObject => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isObject(value)) return value;
  return Object.keys(value).sort().reduce<JsonObject>((result, key) => {
    result[key] = stableValue(value[key]);
    return result;
  }, {});
};
const fingerprint = (value: unknown) => {
  const text = JSON.stringify(stableValue(value));
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
};
const sensibleVersion = (value: unknown) => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 99;
const validIsoDateIfPresent = (value: unknown) => value == null || (typeof value === "string" && !Number.isNaN(Date.parse(value)));
const guidedSessionIdLooksValid = (value: unknown) => typeof value === "string" && /^FMQ-HW-\d{4}-\d{2}-\d{2}-[A-Za-z0-9._-]+$/.test(value);
const statusOf = (value: unknown) => isObject(value) && typeof value.status === "string" ? value.status : null;
const arrayOrEmpty = (value: unknown) => Array.isArray(value) ? clone(value) : [];
const completedPaths = (guided: JsonObject | null) => {
  if (!guided) return [];
  const completed: string[] = [];
  if (statusOf(guided.guitar) === "complete") completed.push("Guitar");
  if (statusOf(guided.pianoMicrophone) === "complete") completed.push("Piano microphone");
  if (statusOf(guided.midi) === "complete") completed.push("MIDI");
  return completed;
};
const materialEvidence = (report: JsonObject, guided: JsonObject | null) => {
  if (guided) {
    return {
      format: guided.format ?? null,
      version: guided.version ?? null,
      sessionId: guided.sessionId ?? null,
      startedAt: guided.startedAt ?? null,
      completedAt: guided.completedAt ?? null,
      status: guided.status ?? null,
      audioDevice: guided.audioDevice ?? null,
      audioSettings: guided.audioSettings ?? null,
      guitar: guided.guitar ?? null,
      pianoMicrophone: guided.pianoMicrophone ?? null,
      midi: guided.midi ?? null,
      humanObservations: guided.humanObservations ?? null,
      humanEvidence: guided.humanEvidence ?? null,
      warnings: guided.warnings ?? null,
      testsNotPerformed: guided.testsNotPerformed ?? null,
    };
  }
  const withoutGeneratedAt = { ...report };
  delete withoutGeneratedAt.generatedAt;
  return withoutGeneratedAt;
};

const validateAndBuild = (parsed: unknown, fileName?: string | null): ParseResult => {
  if (!isObject(parsed)) return { ok: false, error: "This file does not contain a JSON object." };
  if (parsed.format !== "family-music-quest-hardware-report") return { ok: false, error: "This is not a recognized Family Music Quest Hardware Report." };
  if (!sensibleVersion(parsed.version)) return { ok: false, error: "The FMQ Hardware Report version is missing or invalid." };
  if (!validIsoDateIfPresent(parsed.generatedAt)) return { ok: false, error: "The FMQ Hardware Report generatedAt value is not a valid date." };
  if (parsed.appVersion != null && typeof parsed.appVersion !== "string") return { ok: false, error: "The FMQ Hardware Report appVersion is not recognizable." };

  let guided: JsonObject | null = null;
  if (parsed.guidedAcceptance != null) {
    if (!isObject(parsed.guidedAcceptance)) return { ok: false, error: "The FMQ guidedAcceptance section is not a JSON object." };
    guided = parsed.guidedAcceptance;
    if (guided.format !== "family-music-quest-guided-hardware-acceptance") return { ok: false, error: "The guidedAcceptance section is not a recognized FMQ guided hardware report." };
    if (!sensibleVersion(guided.version)) return { ok: false, error: "The FMQ guided hardware report version is missing or invalid." };
    if (!guidedSessionIdLooksValid(guided.sessionId)) return { ok: false, error: "The FMQ guided hardware session ID is missing or not recognizable." };
    if (guided.warnings != null && !Array.isArray(guided.warnings)) return { ok: false, error: "The FMQ guided warnings field is not an array." };
    if (guided.testsNotPerformed != null && !Array.isArray(guided.testsNotPerformed)) return { ok: false, error: "The FMQ guided testsNotPerformed field is not an array." };
  }

  const rawReport = clone(parsed);
  const fmqSessionId = guided && typeof guided.sessionId === "string" ? guided.sessionId : null;
  const evidenceFingerprint = fingerprint(materialEvidence(rawReport, guided));
  const rawFingerprint = fingerprint(rawReport);
  const sourceIdentity = fmqSessionId ? `guided:${fmqSessionId}` : `report:${evidenceFingerprint}`;
  return {
    ok: true,
    source: {
      sourceType: "fmq-hardware-report",
      sourceIdentity,
      fmqSessionId,
      reportFormat: String(parsed.format),
      reportVersion: Number(parsed.version),
      guidedFormat: guided && typeof guided.format === "string" ? guided.format : null,
      guidedVersion: guided && sensibleVersion(guided.version) ? Number(guided.version) : null,
      appVersion: typeof parsed.appVersion === "string" ? parsed.appVersion : (guided && typeof guided.appVersion === "string" ? guided.appVersion : null),
      commit: typeof parsed.commit === "string" ? parsed.commit : (guided && typeof guided.commit === "string" ? guided.commit : null),
      generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : null,
      player: clone(parsed.player ?? guided?.player ?? null),
      platform: clone(parsed.platform ?? guided?.platform ?? null),
      guidedEvidence: { guitar: clone(guided?.guitar ?? null), pianoMicrophone: clone(guided?.pianoMicrophone ?? null), midi: clone(guided?.midi ?? null) },
      humanObservations: clone(guided?.humanObservations ?? null),
      humanEvidence: clone(guided?.humanEvidence ?? null),
      warnings: arrayOrEmpty(guided?.warnings),
      testsNotPerformed: arrayOrEmpty(guided?.testsNotPerformed),
      completedGuidedPaths: completedPaths(guided),
      pathStatuses: { guitar: statusOf(guided?.guitar), pianoMicrophone: statusOf(guided?.pianoMicrophone), midi: statusOf(guided?.midi) },
      evidenceFingerprint,
      rawFingerprint,
      importedAt: new Date().toISOString(),
      fileName: fileName || null,
      rawReport,
    },
  };
};

const compare = (existing: ImportedHardwareSource[], candidate: ImportedHardwareSource): ComparisonResult => {
  const rawIndex = existing.findIndex((source) => source.rawFingerprint === candidate.rawFingerprint);
  if (rawIndex >= 0) return { kind: "duplicate", existingIndex: rawIndex, reason: "This exact FMQ report is already imported." };
  const identityIndex = existing.findIndex((source) => source.sourceIdentity === candidate.sourceIdentity);
  if (identityIndex < 0) return { kind: "new" };
  if (existing[identityIndex].evidenceFingerprint === candidate.evidenceFingerprint) {
    return { kind: "duplicate", existingIndex: identityIndex, reason: "This FMQ hardware session is already imported; only export-time or other non-evidence details differ." };
  }
  return { kind: "conflict", existingIndex: identityIndex, reason: "This FMQ session ID is already imported, but the guided evidence has materially changed." };
};

const parseText = (text: string, fileName?: string | null): ParseResult => {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { ok: false, error: "The selected file is not valid JSON." }; }
  return validateAndBuild(parsed, fileName);
};

export const hardwareReportImport = { parseText, compare, fingerprint };
