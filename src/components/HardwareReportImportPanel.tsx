import { useState } from "react";
import { AlertTriangle, CheckCircle2, FileJson2, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { FileDropzone } from "./FileDropzone";
import { hardwareReportImport } from "../helpers/hardwareReportImport";
import { sessionStore } from "../helpers/sessionStore";
import styles from "./HardwareReportImportPanel.module.css";
type ConsoleSession = ReturnType<typeof sessionStore.createSession>;
type ImportedSource = ConsoleSession["importedSources"][number];
const displayDate = (value: string | null) => { if (!value) return "Not supplied"; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString(); };
const stringifyListItem = (value: unknown) => { if (typeof value === "string") return value; try { return JSON.stringify(value); } catch { return String(value); } };
export const HardwareReportImportPanel = ({ session, onSessionChange }: { session: ConsoleSession; onSessionChange: (session: ConsoleSession) => void; }) => {
  const [message, setMessage] = useState<{ kind: "success" | "info" | "error" | "warning"; text: string } | null>(null);
  const [pendingConflict, setPendingConflict] = useState<ImportedSource | null>(null); const [reading, setReading] = useState(false);
  const handleFile = async (files: File[]) => {
    const file = files[0]; if (!file) return; setReading(true); setPendingConflict(null); setMessage(null);
    try {
      const text = await file.text(); const parsed = hardwareReportImport.parseText(text, file.name);
      if (!parsed.ok) { setMessage({ kind: "error", text: parsed.error }); return; }
      const comparison = hardwareReportImport.compare(session.importedSources, parsed.source);
      if (comparison.kind === "duplicate") { setMessage({ kind: "info", text: `${comparison.reason} No second evidence source was added.` }); return; }
      if (comparison.kind === "conflict") { setPendingConflict(parsed.source); setMessage({ kind: "warning", text: `${comparison.reason} Review and deliberately replace the existing imported revision if this newer export is the one you want to retain.` }); return; }
      onSessionChange(sessionStore.addImportedSource(session, parsed.source));
      setMessage({ kind: "success", text: `Imported FMQ-generated evidence from ${parsed.source.fmqSessionId || file.name}. Manual Test Console observations were not changed.` });
    } catch { setMessage({ kind: "error", text: "The selected file could not be read. The current Test Console session was left unchanged." }); }
    finally { setReading(false); }
  };
  const replaceConflict = () => { if (!pendingConflict) return; onSessionChange(sessionStore.replaceImportedSource(session, pendingConflict.sourceIdentity, pendingConflict)); setMessage({ kind: "success", text: `Replaced the imported revision for ${pendingConflict.fmqSessionId || "this FMQ report source"}. Manual observations were preserved.` }); setPendingConflict(null); };
  return <section className={styles.panel} data-testid="hardware-report-import"><div className={styles.headingRow}><div><p className={styles.kicker}>External source evidence</p><h3>FMQ Hardware Report JSON</h3></div><Badge variant="outline">Local file only</Badge></div><div className={styles.separationNotice}><ShieldCheck size={18} /><p><strong>FMQ-generated / guided evidence stays separate.</strong> Importing never creates an Adult/Child observation, never changes a guided runner result, and never determines FMQ acceptance.</p></div><FileDropzone accept=".json,application/json" maxFiles={1} maxSize={5 * 1024 * 1024} disabled={reading} icon={<FileJson2 size={34} />} title={reading ? "Reading FMQ report…" : "Import FMQ Hardware Report JSON"} subtitle="Choose the JSON downloaded/exported by Family Music Quest. The file is read locally in this browser." onFilesSelected={handleFile} />
    {message && <div className={`${styles.message} ${styles[message.kind]}`} role={message.kind === "error" ? "alert" : "status"}>{message.kind === "warning" ? <AlertTriangle size={18} /> : message.kind === "success" ? <CheckCircle2 size={18} /> : <FileJson2 size={18} />}<span>{message.text}</span></div>}
    {pendingConflict && <div className={styles.conflictCard} data-testid="import-conflict"><div><strong>Updated export detected</strong><p>Source session <code>{pendingConflict.fmqSessionId || pendingConflict.sourceIdentity}</code> has materially different guided evidence from the copy already stored here.</p></div><div className={styles.conflictActions}><Button variant="outline" onClick={() => { setPendingConflict(null); setMessage({ kind: "info", text: "Kept the currently imported FMQ source unchanged." }); }}>Keep current import</Button><Button onClick={replaceConflict}><RefreshCw size={16} /> Replace with this export</Button></div></div>}
    {session.importedSources.length > 0 && <div className={styles.sourceList}>{session.importedSources.map((source) => <article key={source.sourceIdentity} className={styles.sourceCard}><div className={styles.sourceTopRow}><Badge variant="secondary">FMQ-generated / guided evidence</Badge><code>{source.evidenceFingerprint}</code></div><h4>{source.fmqSessionId || "FMQ report without guided session ID"}</h4><dl className={styles.summaryGrid}><div><dt>FMQ version</dt><dd>{source.appVersion || "Not supplied"}{source.commit ? ` · ${source.commit.slice(0, 8)}` : ""}</dd></div><div><dt>Generated</dt><dd>{displayDate(source.generatedAt)}</dd></div><div><dt>Guided report</dt><dd>{source.guidedVersion ? `v${source.guidedVersion}` : "Not supplied"}</dd></div><div><dt>Completed guided paths</dt><dd>{source.completedGuidedPaths.length ? source.completedGuidedPaths.join(", ") : "None reported complete"}</dd></div></dl><div className={styles.pathStatuses}><span>Guitar: <strong>{source.pathStatuses.guitar || "not supplied"}</strong></span><span>Piano mic: <strong>{source.pathStatuses.pianoMicrophone || "not supplied"}</strong></span><span>MIDI: <strong>{source.pathStatuses.midi || "not supplied"}</strong></span></div><div className={styles.sourceDetails}><p><strong>Tests not performed ({source.testsNotPerformed.length})</strong></p>{source.testsNotPerformed.length ? <ul>{source.testsNotPerformed.map((item, index) => <li key={index}>{stringifyListItem(item)}</li>)}</ul> : <span>None listed</span>}</div>{source.warnings.length > 0 && <div className={styles.warningList}><strong>FMQ warnings</strong><ul>{source.warnings.map((warning, index) => <li key={index}>{stringifyListItem(warning)}</li>)}</ul></div>}<p className={styles.rawNote}>Complete validated source JSON, FMQ human observations/evidence, player/platform metadata, and unknown additive fields are retained locally with this source for later reporting.</p></article>)}</div>}
  </section>;
};
