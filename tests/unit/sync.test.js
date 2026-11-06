import { describe, it, expect, vi, beforeEach } from "vitest";
import { queuePlan, syncNow, getQueue } from "../../client/sync.js";

const store = {};
const plan = {
  activityId: "act-001",
  activityTitle: "Fractions",
  level: "Primary",
  durationMinutes: 30,
  topic: "Mathematics",
  sessionDate: "2026-11-10",
  steps: ["Count the counters"],
  materials: ["Counters"],
  safetyNotes: "Keep away from mouths",
  inclusionPrompts: ["Work in pairs"]
};

beforeEach(() => {
  for (const k in store) delete store[k];
  vi.useFakeTimers();
  vi.stubGlobal("localStorage", {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); }
  });
  vi.stubGlobal("document", { getElementById: () => null });
});

describe("offline queue", () => {
  it("offline save sets Pending", () => {
    vi.stubGlobal("navigator", { onLine: false });
    queuePlan(plan);
    expect(getQueue()[0].status).toBe("Pending");
  });

  it("reconnect sets Synced", () => {
    vi.stubGlobal("navigator", { onLine: false });
    queuePlan(plan);
    vi.stubGlobal("navigator", { onLine: true });
    syncNow();
    vi.advanceTimersByTime(1000);
    expect(getQueue()[0].status).toBe("Synced");
  });
});