/**
 * STEMMate Namibia — Pack 3
 * status.js
 *
 * Status rules:
 * Draft     = required plan information is missing or invalid.
 * Completed = plan is valid, saved locally, and not yet queued for sync.
 * Pending   = valid plan is waiting for synchronization.
 * Synced    = server has confirmed successful synchronization.
 */

import { validatePlan } from "./validation.js";

export const PLAN_STATUS = Object.freeze({
  DRAFT: "Draft",
  COMPLETED: "Completed",
  PENDING: "Pending",
  SYNCED: "Synced"
});

/**
 * Decide the next status and return validation results.
 *
 * `isSavedToServer` should mean that the server has CONFIRMED the plan,
 * not merely that a network request was attempted.
 *
 * `isQueuedForSync` is an optional extra input. Set it to true when the
 * local app has placed the plan in its sync queue. If omitted, a valid
 * plan saved while offline is treated as Pending.
 */
export function getNextStatus(
  plan,
  isOnline = false,
  isSavedToServer = false,
  isQueuedForSync = false
) {
  const validation = validatePlan(plan);

  if (!validation.valid) {
    return {
      status: PLAN_STATUS.DRAFT,
      valid: false,
      errors: validation.errors,
      shouldQueueForSync: false
    };
  }

  // Only a confirmed server response can make a plan Synced.
  if (isSavedToServer === true) {
    return {
      status: PLAN_STATUS.SYNCED,
      valid: true,
      errors: [],
      shouldQueueForSync: false
    };
  }

  // If already queued, or saved while offline, it is waiting for sync.
  if (isQueuedForSync === true || isOnline === false) {
    return {
      status: PLAN_STATUS.PENDING,
      valid: true,
      errors: [],
      shouldQueueForSync: true
    };
  }

  // Valid, online, but not yet queued or confirmed by the server.
  return {
    status: PLAN_STATUS.COMPLETED,
    valid: true,
    errors: [],
    shouldQueueForSync: false
  };
}

/**
 * Called by Pack 4 only after the server confirms synchronization.
 * Keeps invalid plans from being marked as Synced.
 */
export function markPlanAsSynced(plan, serverConfirmed) {
  const validation = validatePlan(plan);

  if (!validation.valid) {
    return {
      status: PLAN_STATUS.DRAFT,
      valid: false,
      errors: validation.errors
    };
  }

  if (serverConfirmed !== true) {
    return {
      status: PLAN_STATUS.PENDING,
      valid: true,
      errors: [],
      message: "The server has not confirmed synchronization yet."
    };
  }

  return {
    status: PLAN_STATUS.SYNCED,
    valid: true,
    errors: []
  };
}
