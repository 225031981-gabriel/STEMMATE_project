import { validatePlan } from './validation.js';
import { getNextStatus, markPlanAsSynced, PLAN_STATUS } from './status.js';

const FIELDS = ['title', 'steps', 'timing_minutes', 'materials', 'safety_notes', 'inclusion_prompt'];

export function showErrors(errors) {
  const summary = document.getElementById('error-summary');
  const list    = document.getElementById('error-list');
  const fields  = Object.keys(errors);

  list.replaceChildren();
  document.querySelectorAll('.field-error').forEach(el => { el.hidden = true; });
  document.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));

  if (fields.length === 0) {
    summary.hidden = true;
    return;
  }

  for (const name of fields) {
    const message = errors[name];
    const input = document.getElementById(name);
    const slot  = document.getElementById(`${name}-error`);
    if (input) input.setAttribute('aria-invalid', 'true');
    if (slot) { slot.textContent = message; slot.hidden = false; }

    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href = `#${name}`;
    a.textContent = message;
    li.appendChild(a);
    list.appendChild(li);
  }

  summary.hidden = false;
  summary.focus();
}

const STATUS = {
  ONLINE:    { text: 'Online' },
  OFFLINE:   { text: 'Offline' },
  DRAFT:     { text: 'Draft saved' },
  COMPLETED: { text: 'Completed' },
  PENDING:   { text: 'Waiting to sync' },
  SYNCED:    { text: 'Synced' }
};

export function setStatus(key) {
  const s = STATUS[key] ?? STATUS.ONLINE;
  const badge = document.getElementById('status-badge');

  badge.dataset.status = key;
  document.getElementById('status-text').textContent = s.text;
}

function validatePlan(plan) {
  const errors = {};
  for (const f of FIELDS) {
    if (!String(plan[f] ?? '').trim()) errors[f] = 'Required.';
  }
  if (plan.timing_minutes && Number(plan.timing_minutes) <= 0) {
    errors.timing_minutes = 'Enter a number of minutes greater than zero.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

function savePlan(plan) {
  localStorage.setItem('stemmate.plan', JSON.stringify(plan));
  return plan;
}

function readForm() {
  const plan = {};
  for (const f of FIELDS) {
    plan[f] = document.getElementById(f).value.trim();
  }
  return plan;
}

document.getElementById('plan-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const plan = readForm();
  const { valid, errors } = validatePlan(plan);

  if (!valid) {
    showErrors(errors);
    return;
  }

  showErrors({});
  plan.status = 'COMPLETED';
  savePlan(plan);
  setStatus('PENDING');
  document.getElementById('plan-feedback').textContent = "Plan completed and saved on this device.";
});

document.getElementById('btn-save-draft').addEventListener('click', () => {
  const plan = readForm();
  const { valid, errors } = validatePlan(plan);

  if (!valid) {
    showErrors(errors);
    return;
  }

  showErrors({});
  plan.status = 'DRAFT';
  savePlan(plan);
  setStatus('DRAFT');
  document.getElementById('plan-feedback').textContent = "Draft saved on this device.";
});

document.getElementById('btn-signout').addEventListener('click', () => {
  document.getElementById('plan-form').reset();
  showErrors({});
  document.getElementById('plan-feedback').textContent = '';
  signOut();
});