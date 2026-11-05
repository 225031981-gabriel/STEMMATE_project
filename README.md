# STEMMate Namibia - W1 session plan (A4 vertical slice)

Static web app: plain HTML/CSS/JS, no build step, no dependencies. Plans are stored in the browser (localStorage).
The "server" sync is SIMULATED (sync.js uses a timer). No data leaves the device.

## Run
1. Open this folder in VS Code and start Live Server (or any static server). `sync.js` is an ES module, so open it over http, not by double-clicking the file.
2. First visit: enter a 6-8 digit PIN and press Create PIN. Use Sign In afterwards.
3. Fill the six fields, press Save plan. It appears under Saved plans and in the Sync queue.
4. Try: the Online/Offline badge, Download plan, Saved Plans (search, Export all, Import JSON), `index.html#library`.

## Test (Node 22+)
    node --test tests/store.test.js   # storage, PIN, import/export (the team's existing 12 tests)
    node --test tests/sync.test.js    # simulated sync queue (7 tests)
Both use fake storage, so they check logic, not the pages in a real browser. Browser checks are listed in the design page.

## Files
index.html (UI) | store.js (storage, validation, PIN) | sync.js (simulated sync queue) | tests/ | docs.html (design and quality evidence)

## Known limits
Single device, no real server, plans not encrypted, PIN can be brute-forced offline by someone who copies the stored hash.
Reviewer and Coordinator roles are designed, not built.

## Decommissioning
Use Export all (JSON) to back up. To erase everything on a device, clear the site data in the browser.
