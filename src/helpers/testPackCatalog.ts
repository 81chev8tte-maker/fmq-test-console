type TestStepDefinition = { id: string; instruction: string; expected: string };
type StructuredEvidenceField = { key: string; label: string; input: "count" | "text"; help: string };
type StructuredEvidenceDefinition = { kind: "piano40"; title: string; note: string; fields: StructuredEvidenceField[] };
type TestPackDefinition = {
  id: string; title: string; issueRefs: string[]; revisionId: string; snapshotDate: string; statusContext: string;
  purpose: string; setup: string[]; steps: TestStepDefinition[]; structuredEvidence?: StructuredEvidenceDefinition;
  completionRule: string; referenceOnly?: boolean;
};
const pack = (definition: TestPackDefinition) => definition;

export const testPackCatalog = [
  pack({
    id: "piano-c3-lower-range", title: "Piano C3 / Lower-Range Acceptance", issueRefs: ["#40", "#22"],
    revisionId: "issue-40-hardware-validation-2026-09-12-r1", snapshotDate: "2026-09-12",
    statusContext: "#40 status:needs-hardware-test · physical acceptance pending",
    purpose: "Record the current v2.6.17 real-keyboard C3/lower-range evidence without treating retries alone as failure.",
    setup: [
      "Run FMQ v2.6.17 on the real Dell Chromebook.",
      "Use the electronic keyboard speaker → Chromebook internal microphone path, one key at a time.",
      "Record keyboard sound/volume, placement, Chrome/PWA mode, and actual tester.",
    ],
    steps: [
      { id: "c3-five", instruction: "Play C3 five separate times, holding briefly and releasing between attempts.", expected: "Stable C3 recognition is trustworthy; record retries, stable wrong notes, and no-stable-note outcomes separately." },
      { id: "c4-five", instruction: "Play C4 (Middle C) five separate times.", expected: "Stable C4 recognition remains trustworthy without degrading the healthier upper control." },
      { id: "c3-d3", instruction: "Alternate C3 → D3 → C3 → D3 twice.", expected: "Transitions resolve to the played note; do not count an old label during silence as a new stable detection." },
      { id: "c3-c4", instruction: "Alternate C3 → C4 → C3 → C4 twice.", expected: "Octave transitions resolve to the intended octave without repeated confident aliases." },
      { id: "lower-controls", instruction: "Play C3, D3, E3, F3, G3 for two rounds.", expected: "The supported lower beginner range remains trustworthy note-by-note." },
      { id: "upper-controls", instruction: "Play C4, D4, E4, F4, G4 for two rounds.", expected: "Upper controls remain healthy; G4 remains an explicit retry-sensitive control." },
      { id: "softer-repeats", instruction: "Repeat the C3/C4, transition, lower-control, and upper-control checks somewhat softer but clearly audible.", expected: "Clearly audible notes remain trustworthy; sound below the noise gate is not required." },
      { id: "find-lower-c", instruction: "Run Piano Quest → Lessons → Level 4 — Left Hand → Find Lower C → Start Practice with microphone input.", expected: "Repeated C3 targets behave trustworthily; record any stable C2/C4/F1/other alias separately from timing or attack carryover." },
      { id: "two-hand-steps", instruction: "Run Songs → Two-Hand Steps → Rhythm Mode · Full Part with microphone input.", expected: "The opening C3–D3–E3–F3 and later C4–D4–E4–F4 passage report wrong detections separately from late playing." },
    ],
    structuredEvidence: {
      kind: "piano40", title: "#40 detection evidence",
      note: "These fields describe what was observed. They never choose PASS / PROBLEM / NOT TESTED for you, and retries alone are not automatically a problem.",
      fields: [
        { key: "correctStableCount", label: "Correct stable detection(s)", input: "count", help: "Count only new stable detections that match the intended note." },
        { key: "stableWrongCount", label: "Stable wrong detection(s)", input: "count", help: "Count repeated/confident wrong stable notes separately from attack or silence carryover." },
        { key: "wrongNoteHeard", label: "Wrong note(s) heard", input: "text", help: "Example: C4 twice; C2 once. Leave blank if no stable wrong note occurred." },
        { key: "noStableCount", label: "No stable note outcome(s)", input: "count", help: "Count attempts where no new stable note was produced." },
        { key: "carryoverStaleCount", label: "Attack / silence carryover or stale display", input: "count", help: "Count old labels or transient carryover that should not be treated as a new stable detection." },
        { key: "retryCount", label: "Retries / extra attempts", input: "count", help: "Record extra attempts without automatically classifying the step as PROBLEM." },
        { key: "wrongNoteFrequencyCents", label: "Wrong-note frequency / cents detail", input: "text", help: "Optional adult diagnostic detail when readily available." },
      ],
    },
    completionRule: "Evidence fields recorded for all selected #40 procedure steps. Completion is not an Issue PASS and occasional retries are not automatically a PROBLEM.",
  }),
  pack({
    id: "chromebook-overall-gate", title: "Chromebook / Hardware Gate", issueRefs: ["#22"],
    revisionId: "issue-22-acceptance-2026-09-12-r1", snapshotDate: "2026-09-12",
    statusContext: "#22 status:needs-hardware-test · active product acceptance gate",
    purpose: "Capture the remaining real Chromebook/hardware/child-usability matrix in separate evidence areas without requiring one marathon sitting.",
    setup: ["Use the latest deployed FMQ maintenance baseline.", "Record the actual child/adult provenance for every physical observation.", "Treat real hardware evidence as authoritative over mocks or desktop-only checks."],
    steps: [
      { id: "quick-hardware", instruction: "Run available Quick Hardware Tests and retain the real FMQ hardware session/report evidence.", expected: "Available paths are recorded truthfully; unavailable MIDI may remain NOT TESTED." },
      { id: "guitar-hardware", instruction: "Run real Guitar input, readability, lifecycle, and child-usability checks for the available setup.", expected: "Physical input/scoring, OPEN/fret/string cues, pause/restart/loops and child understanding are recorded without weakening production thresholds." },
      { id: "imported-guitar", instruction: "Run imported Guitar timing/performance checks, keeping #38 first-note lead-in and #48 stall/freeze observations distinct.", expected: "Timing, stutter/freeze, Highway/Tab followability and built-in controls are recorded as separate evidence." },
      { id: "piano-hardware", instruction: "Run available Piano microphone/on-screen/MIDI smoke and gameplay checks.", expected: "Available physical paths are recorded honestly; microphone remains monophonic and MIDI is not inferred when absent." },
      { id: "report-transfer", instruction: "Exercise Copy Project Report, native Send Report to Parent where applicable, and JSON recovery/fallback.", expected: "Actual Chromebook behavior is recorded; mocks do not count as native share success." },
      { id: "save-profile", instruction: "Check profile isolation and current-version progress after normal exit/reopen.", expected: "Progress remains with the intended profile and survives normal current-release reopen." },
      { id: "pwa-smoke", instruction: "Check installed/browser mode, update freshness, and practical offline smoke where relevant.", expected: "Observed PWA behavior is recorded without claiming unsupported offline AlphaTab completeness." },
      { id: "child-usability", instruction: "Record whether the child knew what to do, could see the next target, and trusted the feedback.", expected: "Child observations remain child-provenanced and are not replaced by adult interpretation." },
    ],
    completionRule: "Evidence areas filled for the portions actually tested. A completed pack does not close #22 or determine PASS/BLOCKER.",
  }),
  pack({
    id: "imported-guitar-count-in", title: "Imported Guitar Count-In / First Note", issueRefs: ["#38", "#22"],
    revisionId: "issue-38-count-in-2026-09-12-r1", snapshotDate: "2026-09-12", statusContext: "#38 status:backlog · finding under #22",
    purpose: "Capture whether count-in gives a usable visual/musical lead-in before the first scored imported-Guitar note.",
    setup: ["Record song/file label and selected track.", "Record section vs Full Song and whether Count-In is enabled.", "Use backing plus normal Guitar input analysis for the primary physical observation."],
    steps: [
      { id: "first-note-lead", instruction: "Observe the end of count-in through the first scored note.", expected: "The first note receives a clearly usable visual approach rather than appearing effectively due at GO." },
      { id: "first-sync", instruction: "Compare the first note with the backing timing.", expected: "First-note visual timing and backing remain musically synchronized." },
      { id: "unavoidable-miss", instruction: "Record whether the first miss felt unavoidable because of the lead-in.", expected: "A miss should reflect playing rather than a transport surprise; do not reinterpret scoring windows." },
      { id: "later-sync", instruction: "Continue long enough to judge later-note synchronization.", expected: "Later notes remain synchronized; no arbitrary per-note shift is inferred or requested." },
      { id: "built-in-control", instruction: "Run a lightweight built-in Guitar control with the same device/input where practical.", expected: "Control behavior is recorded separately for comparison." },
    ],
    completionRule: "Requested first-note/timing observations recorded. Completion does not authorize or approve #38 implementation.",
  }),
  pack({
    id: "imported-gp4-stall-freeze", title: "Imported GP4 Stall / Freeze", issueRefs: ["#48", "#22"],
    revisionId: "issue-48-stall-freeze-2026-09-12-r1", snapshotDate: "2026-09-12", statusContext: "#48 status:backlog · separate from #38",
    purpose: "Capture the confirmed imported-GP4 active-play stall/freeze without folding it into the count-in defect or guessing the root cause.",
    setup: ["Record file and track.", "Record Highway vs Tab and short section vs Full Song.", "Record backing/input-analysis state; turn either off only for a deliberate diagnostic comparison."],
    steps: [
      { id: "normal-run", instruction: "Run the imported GP4 under normal backing + real input analysis and note where any stall begins.", expected: "Gameplay should continue progressing; record the approximate stall location and duration if it does not." },
      { id: "freeze-surfaces", instruction: "During a stall, record visuals, backing/audio, and score/input feedback separately.", expected: "Evidence distinguishes which surfaces froze instead of reducing the symptom to a single vague 'lag' result." },
      { id: "diagnostic-comparison", instruction: "Only if deliberately isolating the failure, compare backing off and/or input analysis off.", expected: "Diagnostic-only settings are labeled as such and are never treated as acceptable shipped workarounds." },
      { id: "built-in-control", instruction: "Run a built-in Guitar control on the same device/input.", expected: "Built-in control result remains separate from imported-GP4 behavior." },
      { id: "wrong-note-tuning", instruction: "For any WRONG NOTE report, record source tuning and whether the physical Guitar was actually tuned to match.", expected: "A scoring/mapping defect is not claimed from an alternate-tuned source until physical Guitar tuning is verified to match." },
    ],
    completionRule: "Stall/freeze and tuning-context evidence recorded. Completion does not merge #48 with #38 or determine blocker disposition.",
  }),
  pack({
    id: "guitar-usb-direct", title: "Guitar USB / Direct Input", issueRefs: ["#46", "#22"],
    revisionId: "guitar-usb-direct-2026-09-12-r1", snapshotDate: "2026-09-12", statusContext: "#46 status:backlog · monitoring usability separate from detector success",
    purpose: "Record USB/direct Guitar input reliability while keeping audible monitoring observations separate from detection/scoring success.",
    setup: ["Use the real Dell Chromebook and USB/direct Guitar adapter.", "Record the selected device/input path.", "Do not treat an inaudible monitored Guitar as detector failure when FMQ still receives the input."],
    steps: [
      { id: "device-select", instruction: "Confirm the USB/direct device is detected and selectable.", expected: "The intended device can be selected without confusing it with an unrelated input." },
      { id: "six-open", instruction: "Play all six open strings several times.", expected: "Record low E, A, D, G, B and high E separately, with B/high-E difficulty called out rather than averaged away." },
      { id: "repeated-noise", instruction: "Check repeated-note response and brief silence/talking/muted-string/pick/body-noise rejection.", expected: "Repeated notes respond appropriately and obvious non-note noise does not masquerade as successful target input." },
      { id: "fretted", instruction: "Verify a small spread of fretted notes only if actually performed.", expected: "Record VERIFIED or NOT TESTED; never infer fretted-note coverage from open-string success." },
      { id: "disconnect", instruction: "Disconnect the USB/direct device during the deliberate hardware check.", expected: "Observed disconnect behavior is recorded without inventing a successful recovery." },
      { id: "reconnect", instruction: "Reconnect the device and record whether the intended input returns cleanly.", expected: "Physical reconnect behavior is captured as hardware evidence." },
      { id: "audible-monitor", instruction: "Separately record whether the player can actually hear the electric Guitar through the Chromebook/FMQ output path.", expected: "#46 monitoring usability remains separate from whether analysis/scoring receives the Guitar signal." },
    ],
    completionRule: "Input and monitoring observations recorded separately. Completion does not mean #46 passed or was implemented.",
  }),
  pack({
    id: "quick-hardware-session-regression", title: "Quick Hardware Test Session Regression", issueRefs: ["#22", "#43", "#44"],
    revisionId: "quick-hardware-session-2026-09-12-r1", snapshotDate: "2026-09-12", statusContext: "#43/#44 completed · regression check only",
    purpose: "Verify the physically accepted combined-session/reset/Middle-C workflow still behaves correctly while gathering current #22 evidence.",
    setup: ["Start one clean FMQ Quick Hardware Test session and record its displayed session ID.", "Use only real available inputs; do not simulate MIDI when absent."],
    steps: [
      { id: "same-session", instruction: "Complete Guitar then Piano (and MIDI if available) using Test Another Input between paths.", expected: "All completed paths remain under the same session ID and stay visibly complete." },
      { id: "middle-c-wording", instruction: "Read the Piano prompts for Middle C and nearby D4–G4.", expected: "Middle C wording is physically unambiguous and the final prompt requests the same Middle C again." },
      { id: "consolidated-report", instruction: "Review the Project Report/JSON after multiple paths.", expected: "Completed paths and evidence remain consolidated; only genuinely unperformed paths are listed as not performed." },
      { id: "explicit-reset", instruction: "Use Start New Test Session and confirm the warning.", expected: "A different session ID appears only after the explicit reset and all guided paths return to Not run." },
    ],
    completionRule: "Regression observations recorded. #43/#44 remain completed; this pack does not reopen them automatically.", referenceOnly: true,
  }),
  pack({
    id: "report-transfer", title: "Chromebook Report Transfer", issueRefs: ["#31", "#22"],
    revisionId: "issue-31-report-transfer-2026-09-12-r1", snapshotDate: "2026-09-12", statusContext: "#31 status:backlog · physical share behavior required",
    purpose: "Record the real Chromebook report-transfer path and fallbacks without treating browser mocks as native-share proof.",
    setup: ["Complete a useful FMQ Hardware Validation session first.", "Keep Copy Project Report and Download JSON available as fallbacks."],
    steps: [
      { id: "share-sheet", instruction: "Tap Send Report to Parent on the real Chromebook and record the actual native share-sheet behavior.", expected: "A real share target can be selected where supported; opening a mocked API is not counted as physical success." },
      { id: "received-report", instruction: "Verify what the recipient actually receives through the tested target.", expected: "Readable report/evidence arrival is recorded truthfully, including any fields/files the target drops." },
      { id: "fallback", instruction: "If native sharing is unavailable or incomplete, exercise Copy Project Report and Download JSON.", expected: "Fallback evidence remains intact and the UI does not falsely imply the report was sent." },
    ],
    completionRule: "Actual physical share/fallback outcomes recorded. Completion does not determine #31 acceptance.",
  }),
  pack({
    id: "physical-midi", title: "Physical MIDI Smoke", issueRefs: ["#22"], revisionId: "physical-midi-2026-09-12-r1", snapshotDate: "2026-09-12",
    statusContext: "Supporting #22 evidence · NOT TESTED allowed when no keyboard exists", purpose: "Capture real Web MIDI behavior only when a physical MIDI keyboard is available.",
    setup: ["Use real MIDI hardware if available.", "If no physical MIDI keyboard exists, record NOT TESTED rather than simulating acceptance."],
    steps: [
      { id: "connect", instruction: "Connect the physical MIDI keyboard before/after launch as appropriate.", expected: "Real device connection state is observed." },
      { id: "events", instruction: "Check Note On/Off, repeated notes, velocity, intervals/chords and sustain where hardware supports it.", expected: "Real event/polyphony/sustain behavior is recorded without inferring it from virtual endpoints." },
      { id: "reconnect", instruction: "Unplug/replug where safe and supported.", expected: "Actual reconnect behavior is recorded truthfully." },
    ],
    completionRule: "Physical MIDI evidence recorded, or the pack explicitly remains NOT TESTED when hardware is unavailable.",
  }),
  pack({
    id: "pwa-update-smoke", title: "PWA / Offline / Update Smoke", issueRefs: ["#22"], revisionId: "pwa-update-smoke-2026-09-12-r1", snapshotDate: "2026-09-12",
    statusContext: "Supporting #22 evidence", purpose: "Record practical installed/browser lifecycle and offline smoke without claiming more offline coverage than was physically exercised.",
    setup: ["Record installed PWA vs Chrome tab and the visible FMQ version/build.", "Do not assume imported Guitar backing is offline-ready because the app shell opens."],
    steps: [
      { id: "fresh-version", instruction: "Launch/reopen and confirm the intended current build is visibly loaded.", expected: "Core assets are not obviously stale after the intended update/reopen flow." },
      { id: "offline-shell", instruction: "When appropriate, disable network and relaunch the installed app.", expected: "Observed built-in Guitar/Piano app-shell behavior is recorded; failures are not hidden." },
      { id: "imported-offline", instruction: "Only if exercised, record imported Guitar backing behavior offline.", expected: "AlphaTab/soundfont offline readiness is not claimed unless the actual path works." },
    ],
    completionRule: "Only the PWA/offline/update behaviors actually exercised are marked recorded.",
  }),
  pack({
    id: "wake-lock-regression", title: "Wake Lock Regression", issueRefs: ["#30", "#22"], revisionId: "issue-30-wake-lock-regression-2026-09-12-r1", snapshotDate: "2026-09-12",
    statusContext: "#30 status:done · optional regression/reference", purpose: "Optionally verify the completed active-practice wake-lock behavior remains healthy during broader #22 testing.",
    setup: ["Use a real Chromebook with its normal dim timeout known or observable.", "This is regression evidence for a completed Issue, not an open blocker pack."],
    steps: [
      { id: "active-stays-awake", instruction: "Leave hands off the Chromebook during genuinely active Guitar/Piano practice long enough to cross normal dim timeout.", expected: "The display remains awake while the logical practice session is active." },
      { id: "home-sleeps", instruction: "Exit/Home and again leave the Chromebook idle.", expected: "Normal system dim/sleep is allowed after the active session ends." },
    ],
    completionRule: "Optional regression observations recorded. #30 remains Done unless repository governance changes it separately.", referenceOnly: true,
  }),
] as const;
