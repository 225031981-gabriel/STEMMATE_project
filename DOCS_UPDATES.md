# Edits to make in docs.html (the page I could not regenerate in full)

Date line: "Updated 5 Nov 2026".

## 1. Requirements table
- R4 status -> "Implemented. Sync is simulated (sync.js); the app itself is offline-first".
- Add a column "A3 baseline ID" and fill it from your A3 baseline yourself (FR-/QR-/AC-/PR-/SC-/SR- IDs). The brief says A3 IDs must be preserved. I do not know your exact mapping, so I did not guess.

## 2. Figure 2 (components)
Add a box "sync.js (simulated queue)" with a line to localStorage key stemmate.queue and a line from index.html. Caption: "sync.js uses a timer instead of a real server."

## 3. Section 6 "Lost connection" row: replace "No automatic sync, so there is nothing to retry." with
"Saved plans enter a sync queue. Sync is simulated: it retries when the connection returns, keeps the plan Pending if the connection drops mid-sync, and asks the user to choose when a newer version is found (tests ST1-ST7). There is no real server."

## 4. Section 7: add under automated tests
"Sync tests (node --test tests/sync.test.js, Node v22.23.4, 5 Nov 2026): ST1-ST7, 7 run, 7 passed, 0 failed. They use stubbed DOM and storage."
Keep the AT1-AT12 table as it is (store.js is unchanged), but re-run it and paste the real output.

## 5. New manual tests (add rows, result "Not yet run" until you run them)
- T16: type half a plan, refresh, sign in -> "Restored your unsaved draft." (R8)
- T17: Save a plan -> it shows "Waiting to sync", then "Synced (simulated)"; switch badge to Offline, save again -> stays waiting; switch back to Online -> syncs (R4)
- T18: press "Demo: next sync finds a newer version", save -> conflict box appears and takes focus; both buttons finish the sync (R4, R3)
- T11 expectation is now met by the code (hash deep link after sign-in); still run it.
- T13 (Export/Import): the buttons had no click handlers before this fix, so this test would have failed.

## 6. Problems log: add rows
- P7: saveDraft() was never called by the page, so drafts were never saved although the docs said they were. Found by code review 5 Nov 2026. Fixed: input listener saves the draft; retest with T16/RC1.
- P8: sync.js was loaded but never initialised or called, and its elements were missing from the page. Fixed: wired up with a simulated server, tests ST1-ST7. Limit: no real server.
- P9: index.html#library was ignored. Fixed: opens the library after sign-in. Retest T11.
- P10: Export all / Import JSON buttons had no handlers. Fixed. Retest T13.
- P4: delete plans.html, ui.js and styles.css from the repo (they are not in this ZIP).

## 7. Redesign evidence (before/after, brief deliverable 6) - use P6, P7, P8/P10 with their test IDs.
