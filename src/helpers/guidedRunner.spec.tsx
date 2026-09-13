import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { GuidedRunner } from "../components/GuidedRunner";
import { sessionStore } from "./sessionStore";
const setup = { fmqVersion:"v2.6.17", testDateTime:"2026-09-12T21:00", tester:"adult" as const, targetDevice:"Dell Chromebook 3100", browserMode:"installed-pwa" as const, guitarInput:"not-testing" as const, pianoInput:"internal-mic" as const, notes:"" };
const Harness = () => { const [session,setSession] = useState(() => sessionStore.createSession(setup,["piano-c3-lower-range"])); return <GuidedRunner session={session} onSessionChange={setSession} onExit={() => undefined} />; };
describe("GuidedRunner", () => {
  beforeEach(() => window.localStorage.removeItem(sessionStore.storageKey));
  it("shows one step, expected behavior, manual disposition, and #40 structured fields", () => { render(<Harness/>); expect(screen.getByText(/Play C3 five separate times/i)).toBeTruthy(); expect(screen.getByText("Expected behavior")).toBeTruthy(); expect(screen.getByText(/Expectation is reference text only/i)).toBeTruthy(); expect(screen.getByTestId("piano40-evidence")).toBeTruthy(); expect(screen.getByText("Retries / extra attempts")).toBeTruthy(); fireEvent.click(screen.getByRole("button",{name:"PASS"})); expect(screen.getAllByText("1 / 9 recorded").length).toBe(2); });
  it("lets the tester record NOT TESTED and move forward without converting it to PASS", () => { render(<Harness/>); fireEvent.click(screen.getByRole("button",{name:"NOT TESTED"})); expect(screen.getByRole("button",{name:"NOT TESTED"}).getAttribute("aria-pressed")).toBe("true"); fireEvent.click(screen.getByRole("button",{name:/Next/i})); expect(screen.getByText(/Play C4 \(Middle C\) five separate times/i)).toBeTruthy(); expect(screen.getAllByText("1 / 9 recorded").length).toBe(2); });
});
