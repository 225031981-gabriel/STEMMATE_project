import { validatePlan } from "./validation.js";

export const PLAN_STATUS = Object.freeze({
  DRAFT: "Draft",
  COMPLETED: "Completed",
  PENDING: "Pending",
  SYNCED: "Synced"
});

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

  if (isSavedToServer === true) {
    return {
      status: PLAN_STATUS.SYNCED,
      valid: true,
      errors: [],
      shouldQueueForSync: false
    };
  }

  if (isQueuedForSync === true || isOnline === false) {
    return {
      status: PLAN_STATUS.PENDING,
      valid: true,
      errors: [],
      shouldQueueForSync: true
    };
  }

  return {
    status: PLAN_STATUS.COMPLETED,
    valid: true,
    errors: [],
    shouldQueueForSync: false
  };
}

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
