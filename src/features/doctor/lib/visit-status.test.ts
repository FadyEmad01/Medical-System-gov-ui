import { describe, expect, it } from "vitest";
import {
  canAddMedication,
  canEditVisit,
  canTransition,
  isTerminalVisit,
  nextStatuses,
} from "./visit-status";

describe("visit status machine", () => {
  it("offers the two valid exits from Scheduled", () => {
    expect(nextStatuses("Scheduled")).toEqual(["InProgress", "Cancelled"]);
  });

  it("offers only Completion from InProgress", () => {
    expect(nextStatuses("InProgress")).toEqual(["Completed"]);
  });

  it("offers no exits from terminal statuses", () => {
    expect(nextStatuses("Completed")).toEqual([]);
    expect(nextStatuses("Cancelled")).toEqual([]);
  });

  it("rejects every transition not in the machine, including same-status", () => {
    expect(canTransition("Scheduled", "Completed")).toBe(false);
    expect(canTransition("InProgress", "Cancelled")).toBe(false);
    expect(canTransition("Scheduled", "Scheduled")).toBe(false);
    expect(canTransition("Completed", "InProgress")).toBe(false);
    expect(canTransition("Cancelled", "Scheduled")).toBe(false);
    expect(canTransition("Scheduled", "InProgress")).toBe(true);
    expect(canTransition("Scheduled", "Cancelled")).toBe(true);
    expect(canTransition("InProgress", "Completed")).toBe(true);
  });

  it("marks Completed and Cancelled terminal, others not", () => {
    expect(isTerminalVisit("Completed")).toBe(true);
    expect(isTerminalVisit("Cancelled")).toBe(true);
    expect(isTerminalVisit("Scheduled")).toBe(false);
    expect(isTerminalVisit("InProgress")).toBe(false);
  });

  it("gates clinical edits and medications to open visits", () => {
    for (const status of ["Scheduled", "InProgress"] as const) {
      expect(canEditVisit(status)).toBe(true);
      expect(canAddMedication(status)).toBe(true);
    }
    for (const status of ["Completed", "Cancelled"] as const) {
      expect(canEditVisit(status)).toBe(false);
      expect(canAddMedication(status)).toBe(false);
    }
  });
});
