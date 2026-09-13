import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EvidenceExportPanel } from "./EvidenceExportPanel";
import { evidenceReport } from "../helpers/evidenceReport";
import { hardwareReportImport } from "../helpers/hardwareReportImport";
import { hardwareReportImportFixtures } from "../helpers/hardwareReportImportFixtures";
import { localEvidenceActions } from "../helpers/localEvidenceActions";
import { sessionStore } from "../helpers/sessionStore";

const setup = { fmqVersion: "v2.6.17 / g2-fixture", testDateTime: "2026-09-12T17:24", tester: "both" as const, targetDevice: "Dell Chromebook 3100", browserMode: "installed-pwa" as const, guitarInput: "usb-direct" as const, pianoInput: "internal-mic" as const, notes: "G2 fixture" };
const makeSession = () => {
  let session = sessionStore.createSession(setup, ["piano-c3-lower-range"]);
  const pack = session.packSnapshots[0];
  session = sessionStore.updateObservation(session, pack.id, pack.steps[0].id, { result: "pass", provenance: "adult", actualBehavior: "C3 stable.", reproductionFrequency: "sometimes", structured: { correctStableCount: "4", stableWrongCount: "1", wrongNoteHeard: "C4", noStableCount: "1", carryoverStaleCount: "2", retryCount: "2" } });
  session = sessionStore.updateObservation(session, pack.id, pack.steps[1].id, { result: "problem", provenance: "child", actualBehavior: "C4 showed C3 once.", reproductionFrequency: "once" });
  session = sessionStore.updateObservation(session, pack.id, pack.steps[2].id, { result: "not-tested", provenance: "both", actualBehavior: "Hardware unavailable.", reproductionFrequency: "unknown" });
  const parsed = hardwareReportImport.parseText(JSON.stringify(hardwareReportImportFixtures.current), "g2-fixture.json");
  if (!parsed.ok) throw new Error(parsed.error);
  return sessionStore.addImportedSource(session, parsed.source);
};

describe("EvidenceExportPanel", () => {
  beforeEach(() => window.localStorage.removeItem(sessionStore.storageKey));
  afterEach(() => { vi.restoreAllMocks(); cleanup(); });

  it("renders a read-only preview with required governance and visibly separated manual/imported evidence", () => {
    const session = makeSession();
    render(<EvidenceExportPanel session={session} />);
    expect(screen.getByText("Manual Test Console evidence")).toBeTruthy();
    expect(screen.getByText("Imported FMQ-generated evidence")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Preview PM / GitHub Report" }));
    const preview = screen.getByTestId("evidence-report-preview").textContent || "";
    for (const value of ["MANUAL TEST CONSOLE EVIDENCE", "IMPORTED FMQ-GENERATED / GUIDED EVIDENCE", "Disposition: PASS (step observation only)", "Disposition: PROBLEM", "Disposition: NOT TESTED", "Disposition: UNRECORDED", "Provenance: Adult", "Provenance: Child", "Provenance: Both", "Correct stable detection(s): 4", "FMQ Hardware session ID: FMQ-HW-2026-09-12-01", "Warnings: Fixture warning", "Guided Piano MIDI capability test", evidenceReport.disclaimer, evidenceReport.authority]) expect(preview).toContain(value);
    expect(preview).not.toContain("pass percentage");
  });

  it("copies the PM / GitHub text report without changing the session", async () => {
    const session = makeSession();
    const before = JSON.stringify(session);
    const copy = vi.spyOn(localEvidenceActions, "copyText").mockResolvedValue({ ok: true, message: "Report copied to clipboard." });
    render(<EvidenceExportPanel session={session} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy Report" }));
    await waitFor(() => expect(copy).toHaveBeenCalledWith(evidenceReport.buildTextReport(session)));
    expect(screen.getByText("Report copied to clipboard.")).toBeTruthy();
    expect(JSON.stringify(session)).toBe(before);
  });

  it("downloads text and structured version-1 JSON with filesystem-safe session filenames", () => {
    const session = makeSession();
    const download = vi.spyOn(localEvidenceActions, "downloadText").mockReturnValue({ ok: true, message: "download started" });
    render(<EvidenceExportPanel session={session} />);
    fireEvent.click(screen.getByRole("button", { name: "Download Text" }));
    fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));
    expect(download).toHaveBeenCalledTimes(2);
    const names = evidenceReport.fileNames(session);
    expect(download.mock.calls[0][0]).toBe(names.text);
    expect(download.mock.calls[0][1]).toBe(evidenceReport.buildTextReport(session));
    expect(download.mock.calls[0][2]).toBe("text/plain;charset=utf-8");
    expect(download.mock.calls[1][0]).toBe(names.json);
    expect(download.mock.calls[1][2]).toBe("application/json;charset=utf-8");
    const json = JSON.parse(download.mock.calls[1][1]);
    expect(json.format).toBe("family-music-quest-test-console-evidence");
    expect(json.version).toBe(1);
    expect(json.session.id).toBe(session.id);
    expect(json.frozenTestPackSnapshots[0].revisionId).toBe(session.packSnapshots[0].revisionId);
    expect(json.manualObservations).toEqual(session.observations);
    expect(json.importedFmqEvidence[0].rawReport).toEqual(hardwareReportImportFixtures.current);
  });

  it("shows Share Report only when Web Share support is available while keeping copy/download actions visible", () => {
    const session = makeSession();
    const canShare = vi.spyOn(localEvidenceActions, "canShare").mockReturnValue(false);
    const first = render(<EvidenceExportPanel session={session} />);
    expect(screen.queryByRole("button", { name: "Share Report" })).toBeNull();
    expect(screen.getByRole("button", { name: "Copy Report" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download Text" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download JSON" })).toBeTruthy();
    first.unmount();
    canShare.mockReturnValue(true);
    render(<EvidenceExportPanel session={session} />);
    expect(screen.getByRole("button", { name: "Share Report" })).toBeTruthy();
  });

  it("surfaces copy, download and cancelled-share failures without mutating durable evidence", async () => {
    const session = makeSession();
    sessionStore.saveSession(session);
    const storedBefore = window.localStorage.getItem(sessionStore.storageKey);
    const objectBefore = JSON.stringify(session);
    vi.spyOn(localEvidenceActions, "canShare").mockReturnValue(true);
    vi.spyOn(localEvidenceActions, "copyText").mockResolvedValue({ ok: false, error: "Copy failed. Your session and evidence were not changed; use Download Text instead." });
    vi.spyOn(localEvidenceActions, "downloadText").mockReturnValue({ ok: false, error: "Download failed. Your session and evidence were not changed." });
    vi.spyOn(localEvidenceActions, "shareText").mockResolvedValue({ ok: false, error: "Share cancelled. Your session and evidence were not changed." });
    render(<EvidenceExportPanel session={session} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy Report" }));
    await waitFor(() => expect(screen.getByText(/Copy failed\. Your session and evidence were not changed/i)).toBeTruthy());
    expect(window.localStorage.getItem(sessionStore.storageKey)).toBe(storedBefore);
    fireEvent.click(screen.getByRole("button", { name: "Download Text" }));
    expect(screen.getByText(/Download failed\. Your session and evidence were not changed/i)).toBeTruthy();
    expect(window.localStorage.getItem(sessionStore.storageKey)).toBe(storedBefore);
    fireEvent.click(screen.getByRole("button", { name: "Share Report" }));
    await waitFor(() => expect(screen.getByText(/Share cancelled\. Your session and evidence were not changed/i)).toBeTruthy());
    expect(window.localStorage.getItem(sessionStore.storageKey)).toBe(storedBefore);
    expect(JSON.stringify(session)).toBe(objectBefore);
  });
});
