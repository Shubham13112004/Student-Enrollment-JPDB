# Screenshots

This folder is empty on purpose: the screenshots must be captured from **your own run** of the
application (with your own JsonPowerDB connection token), so they show your real database
records instead of placeholder data.

## How to capture them

1. Add your token to `config.js`.
2. Serve the project over HTTP (for example `python3 -m http.server 8000`) and open
   <http://localhost:8000>.
3. Take each screenshot below at a window width of about 1280 px (desktop) or use the
   browser device toolbar for the mobile shot.
4. Save the files in this folder using exactly these names.

| File name | What it must show |
|---|---|
| `01-initial-state.png` | Page on load: only Roll-No enabled, Save/Update/Reset greyed out, badge "No record selected" |
| `02-new-rollno.png` | An unused Roll-No: the five detail fields unlocked, "New Roll-No — ready to Save", focus in Full-Name |
| `03-existing-record.png` | An existing Roll-No: all fields filled from JsonPowerDB, Roll-No locked, "Existing record — ready to Update" |
| `04-save-success.png` | Green *"saved successfully as record #…"* message right after a Save |
| `05-validation-error.png` | Red validation state — empty fields highlighted with "… is required." |
| `06-mobile-view.png` | Responsive mobile layout (~390 px wide), buttons full width |
| `07-jpdb-dashboard.png` *(optional but recommended)* | JsonPowerDB dashboard showing `SCHOOL-DB` → `STUDENT-TABLE` with the saved records |

## Then update the README

In `README.md` → section **11. Screenshots**, replace the example line with real images, e.g.:

```markdown
### Initial state
![Initial state](assets/screenshots/01-initial-state.png)

### Existing Roll-No loaded
![Existing record](assets/screenshots/03-existing-record.png)
```

Finally commit the images:

```bash
git add assets/screenshots
git commit -m "Add application screenshots"
```

> Tip: hide any personal information in the screenshots, and make sure no connection token is
> visible in the address bar, DevTools or the JPDB dashboard capture.
