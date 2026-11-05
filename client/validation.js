

export const REQUIRED_PLAN_FIELDS = [
  "activityId",
  "activityTitle",
  "level",
  "durationMinutes",
  "topic",
  "sessionDate",
  "steps",
  "materials",
  "safetyNotes",
  "inclusionPrompts"
];

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isNonEmptyArray = (value) =>
  Array.isArray(value) && value.length > 0;

/**
 * Validate a STEMMate session plan.
 * @param {object} plan Session plan to validate.
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }}
 */
export function validatePlan(plan) {
  const errors = [];
  const safePlan = plan && typeof plan === "object" && !Array.isArray(plan)
    ? plan
    : {};

  const addError = (field, message) => errors.push({ field, message });

  if (!isNonEmptyString(safePlan.activityId)) {
    addError("activityId", "Please choose a STEM activity.");
  }

  if (!isNonEmptyString(safePlan.activityTitle)) {
    addError("activityTitle", "Please enter the activity title.");
  }

  if (!isNonEmptyString(safePlan.level)) {
    addError("level", "Please select the learner level.");
  }

  if (!isPositiveNumber(safePlan.durationMinutes)) {
    addError("durationMinutes", "Please enter a duration greater than zero minutes.");
  }

  if (!isNonEmptyString(safePlan.topic)) {
    addError("topic", "Please choose or enter the STEM topic.");
  }

  if (!isNonEmptyString(safePlan.sessionDate)) {
    addError("sessionDate", "Please select the session date.");
  } else if (Number.isNaN(Date.parse(safePlan.sessionDate))) {
    addError("sessionDate", "Please enter a valid session date.");
  }

  if (!isNonEmptyArray(safePlan.steps) ||
      safePlan.steps.some((step) => !isNonEmptyString(step))) {
    addError("steps", "Please add at least one clear activity step.");
  }

  if (!isNonEmptyArray(safePlan.materials) ||
      safePlan.materials.some((material) => !isNonEmptyString(material))) {
    addError("materials", "Please list the materials needed for this session.");
  }

  if (!isNonEmptyString(safePlan.safetyNotes)) {
    addError("safetyNotes", "Please add safety instructions for the activity.");
  }

  if (!isNonEmptyArray(safePlan.inclusionPrompts) ||
      safePlan.inclusionPrompts.some((prompt) => !isNonEmptyString(prompt))) {
    addError("inclusionPrompts", "Please add at least one inclusion prompt.");
  }

  // Optional field: if supplied, it must be a string.
  if (safePlan.preparationNotes !== undefined &&
      typeof safePlan.preparationNotes !== "string") {
    addError("preparationNotes", "Please enter preparation notes as text.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
