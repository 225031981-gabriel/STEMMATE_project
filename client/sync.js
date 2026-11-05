const PLAN_STATUS = { DRAFT: "Draft", PENDING: "Pending", SYNCED: "Synced" };
const CONFLICT = "Conflict";
const QUEUE_KEY = "stemmate.queue";

let reportStatus = function () {};
let isSignedIn = function () { return true; };
let isOffline = function () { return false; };  
let demoConflict = false;
let conflictItemId = null;
let syncing = false;

const online = () => navigator.onLine && !isOffline();

export function getQueue() {
  try { const s = localStorage.getItem(QUEUE_KEY); return s ? JSON.parse(s) : []; }
  catch (e) { return []; }
}
function saveQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }

function markItem(id, status) {
  const q = getQueue(), item = q.find(i => i.id === id);
  if (item) { item.status = status; saveQueue(q); }
  renderQueue();
}
const countPending = () => getQueue().filter(i => i.status === PLAN_STATUS.PENDING).length;
function showMessage(text) { const el = document.getElementById("sync-message"); if (el) el.textContent = text; }

function statusLabel(s) {
  if (s === PLAN_STATUS.PENDING) return "Waiting to sync";
  if (s === PLAN_STATUS.SYNCED) return "Synced (simulated)";
  if (s === CONFLICT) return "Needs your choice";
  return s;
}

export function renderQueue() {
  const list = document.getElementById("sync-list");
  if (!list) return;
  list.replaceChildren();
  for (const item of getQueue()) {
    const li = document.createElement("li");
    li.textContent = (item.plan.title || "(untitled)") + " - " + statusLabel(item.status);
    list.appendChild(li);
  }
}

export function queuePlan(plan) {

  const q = getQueue().filter(i => !(i.status === PLAN_STATUS.PENDING && i.plan.id === plan.id));
  q.push({ id: Date.now() + Math.random(), plan: { ...plan }, status: PLAN_STATUS.PENDING });
  saveQueue(q);
  renderQueue();
  if (!online()) showMessage("No connection. Your plan is saved and will sync later.");
  else syncNow();
}

function mockServerSave(item, whenDone) {
  setTimeout(function () {
    if (!online()) whenDone("offline");
    else if (demoConflict) whenDone("conflict");
    else whenDone("ok");
  }, 800);
}

export function syncNow() {
  if (!isSignedIn()) { showMessage("Sign in to sync your plans."); return; }
  if (!online()) { showMessage("No connection. Your plans are saved and will sync later."); return; }
  if (syncing) return;
  if (countPending() === 0) { showMessage("Nothing to sync."); return; }
  syncing = true;
  showMessage("Syncing (simulated)...");
  syncNext();
}

function syncNext() {
  const q = getQueue();
  const item = q.find(i => i.status === PLAN_STATUS.PENDING);
  if (!item) {
    syncing = false;
    renderQueue();
    if (!q.some(i => i.status === CONFLICT)) { showMessage("Synced successfully (simulated)."); reportStatus("SYNCED"); }
    return;
  }
  mockServerSave(item, function (result) {
    if (result === "offline") {
      syncing = false;
      showMessage("Connection lost. Your plans are safe and will sync later.");
      reportStatus("OFFLINE");
      return;
    }
    if (result === "conflict") { syncing = false; markItem(item.id, CONFLICT); showConflict(item.id); return; }
    markItem(item.id, PLAN_STATUS.SYNCED);
    syncNext();
  });
}

function showConflict(planId) {
  conflictItemId = planId;
  const box = document.getElementById("conflict-box");
  if (box) { box.hidden = false; box.focus(); }
  showMessage("");
}

function resolveConflict(choice) {
  if (conflictItemId === null) return;
  const q = getQueue(), item = q.find(i => i.id === conflictItemId);
  if (item) { item.resolution = choice; item.status = PLAN_STATUS.SYNCED; saveQueue(q); }
  conflictItemId = null;
  demoConflict = false;
  document.getElementById("conflict-box").hidden = true;
  renderQueue();
  showMessage(choice === "mine" ? "Kept your version. Synced (simulated)." : "Used the server version. Synced (simulated).");
  if (countPending() > 0 && online()) { syncing = true; syncNext(); } else reportStatus("SYNCED");
}

function on(id, ev, fn) { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); }

export function initSync(options = {}) {
  if (options.setStatus) reportStatus = options.setStatus;
  if (options.isSignedIn) isSignedIn = options.isSignedIn;
  if (options.isOffline) isOffline = options.isOffline;
  on("btn-sync", "click", syncNow);
  on("btn-keep-mine", "click", () => resolveConflict("mine"));
  on("btn-use-server", "click", () => resolveConflict("server"));
  on("btn-demo-conflict", "click", () => { demoConflict = true; showMessage("Demo on: the next sync finds a newer version."); });
  window.addEventListener("online", () => { reportStatus("ONLINE"); if (countPending() > 0) syncNow(); });
  window.addEventListener("offline", () => reportStatus("OFFLINE"));
  reportStatus(online() ? "ONLINE" : "OFFLINE");
  renderQueue();
}
