/* STEMMate storage + security module. Shared by index.html, plans.html and the automated tests. */
(function (root) {
  const K = { plans: "stemmate.plans.v1", auth: "stemmate.auth.v1", draft: "stemmate.draft.v1", lock: "stemmate.lock.v1", mode: "stemmate.mode.v1" };
  const MAX_TRIES = 5, LOCK_MS = 60000;
  const FIELDS = ["title", "steps", "timing", "materials", "safety", "inclusion"];
  const ls = () => root.localStorage;

  function read(key, fallback) {
    let raw = null;
    try { raw = ls().getItem(key); if (raw === null) return fallback; return JSON.parse(raw); }
    catch (e) {
      // Recovery: keep the damaged text so nothing is lost, then start clean.
      try { if (raw !== null) ls().setItem(key + ".corrupt", raw); } catch (_) {}
      return fallback;
    }
  }
  function write(key, value) {
    try { ls().setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  const uid = () => (root.crypto && root.crypto.randomUUID) ? root.crypto.randomUUID() : String(Date.now()) + Math.random();

  async function hashPin(pin, salt) {
    const buf = await root.crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + pin));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  const validPin = p => /^\d{6,8}$/.test(p);

  const Store = {
    FIELDS, MAX_TRIES, LOCK_MS, validPin,
    listPlans() { const a = read(K.plans, []); return Array.isArray(a) ? a.sort((x, y) => y.updatedAt - x.updatedAt) : []; },
    loadPlan(id) { return this.listPlans().find(p => p.id === id) || null; },
    savePlan(plan, now = Date.now()) {
      const all = this.listPlans(), i = all.findIndex(p => p.id === plan.id);
      const rec = { ...plan, id: plan.id || uid(), createdAt: i >= 0 ? all[i].createdAt : now, updatedAt: now };
      if (i >= 0) all[i] = rec; else all.push(rec);
      return write(K.plans, all) ? rec : null;
    },
    deletePlan(id) { return write(K.plans, this.listPlans().filter(p => p.id !== id)); },

    validate(plan) {
      const errors = [];
      FIELDS.forEach(f => { if (!String(plan[f] || "").trim()) errors.push({ id: f, msg: "Required." }); });
      const t = String(plan.timing || "").trim();
      if (t && !(/^\d+$/.test(t) && +t >= 1 && +t <= 600)) errors.push({ id: "timing", msg: "Enter whole minutes between 1 and 600." });
      return errors;
    },

    getAuth() { return read(K.auth, null); },
    async createPin(pin) {
      if (!validPin(pin)) return { ok: false, reason: "format" };
      if (this.getAuth()) return { ok: false, reason: "exists" };
      const salt = uid();
      return write(K.auth, { salt, hash: await hashPin(pin, salt) }) ? { ok: true } : { ok: false, reason: "storage" };
    },
    /* Access rule: 5 wrong PINs locks sign-in for 60 seconds. */
    async checkPin(pin, now = Date.now()) {
      const auth = this.getAuth();
      if (!auth) return { ok: false, reason: "nopin" };
      const lock = read(K.lock, { fails: 0, until: 0 });
      if (lock.until > now) return { ok: false, reason: "locked", seconds: Math.ceil((lock.until - now) / 1000) };
      if (validPin(pin) && (await hashPin(pin, auth.salt)) === auth.hash) { write(K.lock, { fails: 0, until: 0 }); return { ok: true }; }
      const fails = lock.fails + 1;
      write(K.lock, fails >= MAX_TRIES ? { fails: 0, until: now + LOCK_MS } : { fails, until: 0 });
      return { ok: false, reason: "wrong", left: Math.max(0, MAX_TRIES - fails) };
    },

    /* User's chosen mode. The badge shows "offline" if the user chose it OR the device has no connection. */
    getMode() { return read(K.mode, "online") === "offline" ? "offline" : "online"; },
    setMode(m) { return write(K.mode, m === "offline" ? "offline" : "online"); },

    /* Back-up and restore. Import merges by id and keeps only known fields. */
    exportPlans() { return JSON.stringify(this.listPlans(), null, 2); },
    importPlans(text) {
      let incoming;
      try { incoming = JSON.parse(text); } catch (e) { return { ok: false, reason: "format" }; }
      if (!Array.isArray(incoming)) return { ok: false, reason: "format" };
      const byId = new Map(this.listPlans().map(p => [p.id, p]));
      let added = 0;
      incoming.forEach(p => {
        if (!p || typeof p.id !== "string" || !p.id || typeof p.title !== "string") return;
        const rec = { id: p.id, createdAt: Number(p.createdAt) || Date.now(), updatedAt: Number(p.updatedAt) || Date.now() };
        FIELDS.forEach(f => rec[f] = String(p[f] == null ? "" : p[f]));
        byId.set(p.id, rec); added++;
      });
      return write(K.plans, [...byId.values()]) ? { ok: true, added } : { ok: false, reason: "storage" };
    },

    /* Plain-text copy of one plan, for the Download button. */
    planToText(plan) {
      const v = k => String(plan[k] || "").trim() || "(not filled in)";
      return [
        "STEMMate Namibia - Session plan", "===============================", "",
        "Title: " + v("title"), "Timing: " + v("timing") + " minutes", "",
        "STEPS", v("steps"), "", "MATERIALS", v("materials"), "",
        "SAFETY NOTES", v("safety"), "", "INCLUSION PROMPT", v("inclusion"), "",
        "Downloaded: " + new Date().toLocaleString()
      ].join("\n");
    },
    planFilename(plan) {
      const slug = String(plan.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
      return slug ? "plan-" + slug + ".txt" : "session-plan.txt";
    },

    saveDraft(plan) { return write(K.draft, plan); },
    loadDraft() { const d = read(K.draft, null); return d && typeof d === "object" ? d : null; },
    clearDraft() { try { ls().removeItem(K.draft); } catch (e) {} }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Store; else root.Store = Store;
})(typeof window !== "undefined" ? window : globalThis);