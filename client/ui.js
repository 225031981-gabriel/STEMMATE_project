const DEMO_USER = 'facilitator';
const DEMO_PIN  = '1234';   

const FIELDS = [
  'title', 'steps', 'timing_minutes',
  'materials', 'safety_notes', 'inclusion_prompt'
];

function show(screen) {
  document.getElementById('screen-signin').hidden = screen !== 'signin';
  document.getElementById('screen-plan').hidden   = screen !== 'plan';
}

export function showErrors(errors) {
  const summary = document.getElementById('error-summary');
  const list    = document.getElementById('error-list');
  const fields  = Object.keys(errors);

  list.replaceChildren();
  document.querySelectorAll('.field-error').forEach(el => { el.hidden = true; });
  document.querySelectorAll('[aria-invalid]')
          .forEach(el => el.removeAttribute('aria-invalid'));

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
  ONLINE:    { icon: '●', text: 'Online' },
  OFFLINE:   { icon: '○', text: 'Offline' },
  DRAFT:     { icon: '✎', text: 'Draft saved' },
  COMPLETED: { icon: '✓', text: 'Completed' },
  PENDING:   { icon: '↻', text: 'Waiting to sync' },
  SYNCED:    { icon: '✓', text: 'Synced' }
};

export function setStatus(key) {
  const s = STATUS[key] ?? STATUS.ONLINE;
  const badge = document.getElementById('status-badge');
  badge.dataset.status = key;
  badge.querySelector('.badge-icon').textContent = s.icon;
  document.getElementById('status-text').textContent = s.text;
}


function validatePlan(plan) {                 // Pack 3
  const errors = {};
  for (const f of FIELDS) {
    if (!String(plan[f] ?? '').trim()) errors[f] = 'Required.';
  }
  if (plan.timing_minutes && Number(plan.timing_minutes) <= 0) {
    errors.timing_minutes = 'Enter a number of minutes greater than zero.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

function savePlan(plan) {                      // Pack 1
  localStorage.setItem('stemmate.plan', JSON.stringify(plan));
  return plan;
}

function enqueue(plan) {                       // Pack 4
  const queue = JSON.parse(localStorage.getItem('stemmate.queue') || '[]');
  queue.push(plan);
  localStorage.setItem('stemmate.queue', JSON.stringify(queue));
  return queue.length;
}

function readForm() {
  const plan = {};
  for (const f of FIELDS) {
    plan[f] = document.getElementById(f).value.trim();
  }
  return plan;
}

function feedback(message) {
  document.getElementById('plan-feedback').textContent = message;
}

document.getElementById('signin-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value.trim();
  const pin  = document.getElementById('pin').value.trim();
  const err  = document.getElementById('signin-error');

  document.getElementById('username-error').hidden = true;
  document.getElementById('pin-error').hidden = true;
  err.hidden = true;

  if (user !== DEMO_USER || pin !== DEMO_PIN) {
    err.textContent = 'PIN not correct. Try again.';
    err.hidden = false;
    document.getElementById('pin').setAttribute('aria-invalid', 'true');
    return;                                   
  }

  document.getElementById('pin').removeAttribute('aria-invalid');
  show('plan');
  document.getElementById('plan-heading').focus?.();
});

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
  plan.version = 1;
  savePlan(plan);
  const queued = enqueue(plan);

  setStatus('PENDING');
  feedback(`Plan completed and saved on this device. ${queued} item waiting to sync.`);
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
  feedback('Draft saved on this device.');
});

document.getElementById('btn-signout').addEventListener('click', () => {
  document.getElementById('plan-form').reset();
  showErrors({});
  feedback('');
  document.getElementById('pin').value = '';
  show('signin');
  document.getElementById('username').focus();
});

const saved = localStorage.getItem('stemmate.plan');
if (saved) {
  try {
    const plan = JSON.parse(saved);
    for (const f of FIELDS) {
      if (plan[f] != null) document.getElementById(f).value = plan[f];
    }
  } catch { /* corrupt local data: ignore and start clean */ }
}