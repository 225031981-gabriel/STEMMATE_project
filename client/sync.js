const PLAN_STATUS = {
  DRAFT: "Draft",
  PENDING: "Pending",
  SYNCED: "Synced"
};

function markPlanAsSynced(plan, confirmed) {
  return { status: confirmed ? PLAN_STATUS.SYNCED : PLAN_STATUS.PENDING };
}

const QUEUE_KEY = "stemmate.queue";
const CONFLICT = "Conflict"; 

let reportStatus = function () {};      
let isSignedIn = function () { return true; };
let demoConflict = false;
let conflictItemId = null;
let syncing = false;

export function getQueue() {
  try {
    const saved = localStorage.getItem(QUEUE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function markItem(id, status) {
  const queue = getQueue();
  const item = queue.find(function (i) { return i.id === id; });
  if (item) {
    item.status = status;
    saveQueue(queue);
  }
  renderQueue();
}

function countPending() {
  return getQueue().filter(function (i) {
    return i.status === PLAN_STATUS.PENDING;
  }).length;
}
function showMessage(text) {
  const el = document.getElementById("sync-message");
  if (el) el.textContent = text;
}

function statusLabel(status) {
  if (status === PLAN_STATUS.PENDING) return "Waiting to sync";
  if (status === PLAN_STATUS.SYNCED) return "Synced";
  if (status === CONFLICT) return "Needs your choice";
  return status;
}

export function renderQueue() {
  const list = document.getElementById("plan-list");
  if (!list) return;
  list.replaceChildren();
  for (const item of getQueue()) {
    const li = document.createElement("li");
    li.textContent = item.plan.title + " - " + statusLabel(item.status);
    list.appendChild(li);
  }
}
export function queuePlan(plan) {
  const queue = getQueue();
  queue.push({ id: Date.now(), plan: { ...plan }, status: PLAN_STATUS.PENDING });
  saveQueue(queue);
  renderQueue();

  if (!navigator.onLine) {
    showMessage("No internet. Your plan is saved and will sync later.");
  } else {
    syncNow();
  }
}
function mockServerSave(item, whenDone) {
  setTimeout(function () {
    if (!navigator.onLine) {
      whenDone("offline");
    } else if (demoConflict) {
      whenDone("conflict"); 
    } else {
      whenDone("ok");       
    }
  }, 800);
}
export function syncNow() {
  if (!isSignedIn()) {
    showMessage("Sign in to sync your plans.");
    return;
  }
  if (!navigator.onLine) {
    showMessage("No internet. Your plans are saved and will sync later.");
    return;
  }
  if (syncing) return;
  if (countPending() === 0) {
    showMessage("Nothing to sync.");
    return;
  }

  syncing = true;
  showMessage("Syncing...");
  syncNext();
}
function syncNext() {
  const queue = getQueue();
  const item = queue.find(function (i) { return i.status === PLAN_STATUS.PENDING; });

  if (!item) {
    syncing = false;
    renderQueue();
    if (!queue.some(function (i) { return i.status === CONFLICT; })) {
      showMessage("Synced successfully.");
      reportStatus("SYNCED");
    }
    return;
  }

  mockServerSave(item, function (result) {
    if (result === "offline") {
      syncing = false;
      showMessage("Connection lost. Your plans are safe and will sync later.");
      reportStatus("OFFLINE");
      return;
    }
    if (result === "conflict") {
      syncing = false;
      markItem(item.id, CONFLICT);
      showConflict(item.id);
      return;
    }
    const confirmed = markPlanAsSynced(item.plan, true);
    markItem(item.id, confirmed.status);
    syncNext();
  });
}
function showConflict(planId) {
  conflictItemId = planId;
  const box = document.getElementById("conflict-box");
  if (box) {
    box.hidden = false;
    box.focus();
  }
  showMessage("");
}

function resolveConflict(choice) {
  if (conflictItemId === null) return;

  const queue = getQueue();
  const item = queue.find(function (i) { return i.id === conflictItemId; });
  if (item) {
    item.resolution = choice;
    item.status = PLAN_STATUS.SYNCED;
    saveQueue(queue);
  }

  conflictItemId = null;
  demoConflict = false;
  document.getElementById("conflict-box").hidden = true;
  renderQueue();
  showMessage(choice === "mine" ? "Kept your version. Synced." : "Used the server version. Synced.");

  if (countPending() > 0 && navigator.onLine) {
    syncing = true;
    syncNext();
  } else {
    reportStatus("SYNCED");
  }
}
function on(id, eventName, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(eventName, handler);
}

export function initSync(options = {}) {
  if (options.setStatus) reportStatus = options.setStatus;
  if (options.isSignedIn) isSignedIn = options.isSignedIn;

  on("btn-sync", "click", syncNow);
  on("btn-keep-mine", "click", function () { resolveConflict("mine"); });
  on("btn-use-server", "click", function () { resolveConflict("server"); });
  on("btn-demo-conflict", "click", function () {
    demoConflict = true;
    showMessage("Demo on: the next sync finds a newer version.");
  });

  window.addEventListener("online", function () {
    reportStatus("ONLINE");
    if (countPending() > 0) syncNow();
  });
  window.addEventListener("offline", function () {
    reportStatus("OFFLINE");
  });

  reportStatus(navigator.onLine ? "ONLINE" : "OFFLINE");
  renderQueue();
}