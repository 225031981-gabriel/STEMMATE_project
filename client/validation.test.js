import { describe, it, expect } from "vitest";
import { validatePlan } from "./validation.js";
import { getNextStatus, markPlanAsSynced, PLAN_STATUS } from "./status.js";

const validPlan = {
  activityId: "ACT-001",
  activityTitle: "Build a paper bridge",
  level: "Beginner",
  durationMinutes: 30,
  topic: "Engineering",
  sessionDate: "2026-11-10",
  steps: [
    "Introduce the bridge challenge",
    "Build and test a paper bridge"
  ],
  materials: ["Paper", "Tape", "Coins"],
  safetyNotes: "Keep small items away from young children and use scissors carefully.",
  inclusionPrompts: ["Offer written and spoken instructions."]
};

describe("STEMMate Pack 3 validation", () => {
  it("rejects a plan with empty required fields", () => {
    const result = validatePlan({});

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContainEqual({
      field: "activityTitle",
      message: "Please enter the activity title."
    });
  });

  it("returns no errors for a valid plan", () => {
    const result = validatePlan(validPlan);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("STEMMate Pack 3 status transitions", () => {
  it("moves Draft to Completed when all fields are valid and the plan is online but not queued", () => {
    const result = getNextStatus(validPlan, true, false, false);
    expect(result.status).toBe(PLAN_STATUS.COMPLETED);
    expect(result.valid).toBe(true);
  });

  it("moves a valid plan to Pending when saved offline", () => {
    const result = getNextStatus(validPlan, false, false);
    expect(result.status).toBe(PLAN_STATUS.PENDING);
    expect(result.shouldQueueForSync).toBe(true);
  });

  it("moves Pending to Synced only after server confirmation", () => {
    const result = markPlanAsSynced(validPlan, true);
    expect(result.status).toBe(PLAN_STATUS.SYNCED);
  });

  it("does not mark a plan Synced without server confirmation", () => {
    const result = markPlanAsSynced(validPlan, false);
    expect(result.status).toBe(PLAN_STATUS.PENDING);
  });

  it("does not mark an invalid plan as Synced", () => {
    const result = markPlanAsSynced({}, true);
    expect(result.status).toBe(PLAN_STATUS.DRAFT);
    expect(result.valid).toBe(false);
  });
});
