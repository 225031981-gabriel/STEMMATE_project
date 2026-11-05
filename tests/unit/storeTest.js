const test = require("node:test"), assert = require("node:assert");
class MemStorage { constructor(){this.m=new Map();} getItem(k){return this.m.has(k)?this.m.get(k):null;} setItem(k,v){this.m.set(k,String(v));} removeItem(k){this.m.delete(k);} }
let Store;
test.beforeEach(() => { globalThis.localStorage = new MemStorage(); delete require.cache[require.resolve("../store.js")]; Store = require("../store.js"); });
const plan = { title:"Water filter", steps:"1. Layer sand", timing:"45", materials:"Sand", safety:"Wash hands", inclusion:"Pair learners" };

test("AT1 (R1,R5) saved plan survives a simulated restart", () => {
  const saved = Store.savePlan(plan);
  delete require.cache[require.resolve("../store.js")];    
  const again = require("../store.js");
  assert.equal(again.loadPlan(saved.id).title, "Water filter");
});
test("AT2 (R2) validation rejects empty fields and bad timing", () => {
  assert.equal(Store.validate({}).length, 6);
  assert.ok(Store.validate({ ...plan, timing: "abc" }).some(e => e.id === "timing"));
  assert.equal(Store.validate(plan).length, 0);
});
test("AT3 (R6) PIN is stored hashed and wrong PIN is rejected", async () => {
  assert.ok((await Store.createPin("123456")).ok);
  assert.ok(!JSON.stringify(Store.getAuth()).includes("123456"));
  assert.equal((await Store.checkPin("654321")).reason, "wrong");
  assert.ok((await Store.checkPin("123456")).ok);
});
test("AT4 (R6) five wrong PINs lock sign-in, then it unlocks", async () => {
  await Store.createPin("123456"); const t = 1_000_000;
  for (let i = 0; i < 5; i++) await Store.checkPin("000000", t);
  assert.equal((await Store.checkPin("123456", t + 1000)).reason, "locked");
  assert.ok((await Store.checkPin("123456", t + 61000)).ok);
});
test("AT5 (R8) corrupted storage is backed up, not crashed on", () => {
  localStorage.setItem("stemmate.plans.v1", "{not json");
  assert.deepEqual(Store.listPlans(), []);
  assert.equal(localStorage.getItem("stemmate.plans.v1.corrupt"), "{not json");
});
test("AT6 (R8) full storage returns a failure instead of throwing", () => {
  localStorage.setItem = () => { throw new Error("QuotaExceededError"); };
  assert.equal(Store.savePlan(plan), null);
});
test("AT7 (R8) unsaved draft is recoverable and clearable", () => {
  Store.saveDraft({ title: "half done" });
  assert.equal(Store.loadDraft().title, "half done");
  Store.clearDraft(); assert.equal(Store.loadDraft(), null);
});
test("AT8 (R1) editing keeps one record; delete removes it", () => {
  const a = Store.savePlan(plan, 1); Store.savePlan({ ...a, title: "Edited" }, 2);
  assert.equal(Store.listPlans().length, 1);
  assert.equal(Store.loadPlan(a.id).createdAt, 1);
  Store.deletePlan(a.id); assert.equal(Store.listPlans().length, 0);
});
test("AT9 (R4) online/offline choice is remembered", () => {
  assert.equal(Store.getMode(), "online");
  Store.setMode("offline");
  delete require.cache[require.resolve("../store.js")];
  assert.equal(require("../store.js").getMode(), "offline");
});
test("AT10 (R5,R8) export then import restores a deleted plan", () => {
  const a = Store.savePlan(plan), file = Store.exportPlans();
  Store.deletePlan(a.id); assert.equal(Store.listPlans().length, 0);
  assert.deepEqual(Store.importPlans(file), { ok: true, added: 1 });
  assert.equal(Store.loadPlan(a.id).title, "Water filter");
});
test("AT11 (R8) bad import file is rejected and existing plans are kept", () => {
  Store.savePlan(plan);
  assert.equal(Store.importPlans("not json").reason, "format");
  assert.equal(Store.importPlans('{"a":1}').reason, "format");
  assert.deepEqual(Store.importPlans('[{"x":1},null,5]'), { ok: true, added: 0 });
  assert.equal(Store.listPlans().length, 1);
});
test("AT12 (R1) download text holds every field and filename is safe", () => {
  const txt = Store.planToText(plan);
  ["Water filter", "1. Layer sand", "45 minutes", "Sand", "Wash hands", "Pair learners"].forEach(x => assert.ok(txt.includes(x), x));
  assert.equal(Store.planFilename({ title: "Water filter!/x" }), "plan-water-filter-x.txt");
  assert.equal(Store.planFilename({ title: "" }), "session-plan.txt");
});