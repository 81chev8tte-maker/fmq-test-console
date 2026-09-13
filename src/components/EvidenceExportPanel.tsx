import { useMemo, useState } from "react";
import { Braces, ClipboardCopy, Download, Eye, FileText, Share2, ShieldCheck } from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { evidenceReport } from "../helpers/evidenceReport";
import { localEvidenceActions } from "../helpers/localEvidenceActions";
import { sessionStore } from "../helpers/sessionStore";
import styles from "./EvidenceExportPanel.module.css";

type ConsoleSession = ReturnType<typeof sessionStore.createSession>;
type ActionOutcome = { ok: true; message: string } | { ok: false; error: string };
type Feedback = { kind: "success" | "error"; text: string } | null;

const feedbackFor = (result: ActionOutcome): Feedback => result.ok
  ? { kind: "success", text: result.message }
  : { kind: "error", text: result.error };

export const EvidenceExportPanel = ({ session }: { session: ConsoleSession }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const textReport = useMemo(() => evidenceReport.buildTextReport(session), [session]);
  const fileNames = useMemo(() => evidenceReport.fileNames(session), [session]);
  const progress = useMemo(() => sessionStore.getProgress(session), [session]);
  const canShare = localEvidenceActions.canShare();

  const copyReport = async () => setFeedback(feedbackFor(await localEvidenceActions.copyText(textReport)));
  const downloadText = () => setFeedback(feedbackFor(localEvidenceActions.downloadText(fileNames.text, textReport, "text/plain;charset=utf-8")));
  const downloadJson = () => setFeedback(feedbackFor(localEvidenceActions.downloadText(fileNames.json, evidenceReport.buildJsonText(session), "application/json;charset=utf-8")));
  const shareReport = async () => setFeedback(feedbackFor(await localEvidenceActions.shareText(`FMQ Test Console evidence — ${session.id}`, textReport)));

  return <section className={styles.panel} data-testid="evidence-export-panel">
    <div className={styles.headingRow}>
      <div><p className={styles.kicker}>Checkpoint 4 · local evidence export</p><h3>PM / GitHub evidence report</h3></div>
      <Badge variant="outline">Session {session.id}</Badge>
    </div>

    <div className={styles.evidenceKinds} aria-label="Evidence sources in this report">
      <div className={styles.evidenceCard}>
        <FileText size={19} aria-hidden="true" />
        <div><strong>Manual Test Console evidence</strong><span>{progress.recorded} / {progress.total} step dispositions recorded · Adult / Child / Both provenance preserved</span></div>
      </div>
      <div className={styles.evidenceCard}>
        <Braces size={19} aria-hidden="true" />
        <div><strong>Imported FMQ-generated evidence</strong><span>{session.importedSources.length} source{session.importedSources.length === 1 ? "" : "s"} retained separately with original FMQ metadata</span></div>
      </div>
    </div>

    <div className={styles.actions}>
      <Button variant="outline" size="lg" aria-expanded={previewOpen} aria-controls="evidence-report-preview" onClick={() => { setPreviewOpen((current) => !current); setFeedback(null); }}><Eye size={18} /> Preview PM / GitHub Report</Button>
      <Button variant="outline" size="lg" onClick={copyReport}><ClipboardCopy size={18} /> Copy Report</Button>
      <Button variant="outline" size="lg" onClick={downloadText}><Download size={18} /> Download Text</Button>
      <Button variant="outline" size="lg" onClick={downloadJson}><Braces size={18} /> Download JSON</Button>
      {canShare && <Button size="lg" onClick={shareReport}><Share2 size={18} /> Share Report</Button>}
    </div>
    <p className={styles.supportNote}>{canShare ? "Web Share is available on this device. Copy and both download actions remain available as local fallbacks." : "Web Share is unavailable in this browser. Copy Report, Download Text and Download JSON remain available."}</p>

    {feedback && <div className={`${styles.message} ${feedback.kind === "error" ? styles.error : styles.success}`} role={feedback.kind === "error" ? "alert" : "status"}><span>{feedback.text}</span></div>}

    {previewOpen && <div className={styles.previewWrap} id="evidence-report-preview" data-testid="evidence-report-preview">
      <div className={styles.previewHeading}><div><strong>Report preview</strong><span>Plain-text evidence intended for PM / GitHub review</span></div><Badge variant="secondary">Read only</Badge></div>
      <pre tabIndex={0}>{textReport}</pre>
    </div>}

    <div className={styles.governance}><ShieldCheck size={19} aria-hidden="true" /><div><strong>{evidenceReport.disclaimer}</strong><p>{evidenceReport.authority}</p></div></div>
  </section>;
};
