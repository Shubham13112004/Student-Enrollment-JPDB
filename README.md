# Student Enrollment System — JsonPowerDB

A complete, responsive **Student Enrollment Web Application** that stores and manages
student records directly in **JsonPowerDB** through its REST API — no backend server,
no build step, no external database.

Built for the **Login2Xplore — Introduction to JsonPowerDB V2.0** selection round
(Micro Project).

| | |
|---|---|
| **Author** | _Add your name here_ |
| **Course** | Introduction to JsonPowerDB V2.0 (Login2Xplore) |
| **Project type** | Micro Project — Student Enrollment Form |
| **Front end** | HTML5 · CSS3 · Bootstrap 5 · JavaScript · jQuery AJAX |
| **Database** | JsonPowerDB — `SCHOOL-DB` → `STUDENT-TABLE` |
| **Primary key** | `Roll-No` |
| **Status** | Working source code — **you must paste your own connection token** (see below) |

> ### ⚠️ One manual step is required before it works
> Open **`config.js`** and replace
> `"PASTE_YOUR_CONNECTION_TOKEN_HERE"` with **your own JsonPowerDB connection token**
> (login2explore.com → **Tools → Connection Token**). Everything else is ready to run.
> Until a token is added, the page shows a setup notice instead of firing API calls.

> ### ℹ️ Honest note about testing
> The application talks to the **real** JsonPowerDB REST API — there is no mock data and no
> simulated success anywhere in the code. The request payloads follow the official
> JsonPowerDB command reference (`GET_BY_KEY`, `PUT`, `UPDATE`).
> Because a live connection token is personal to each JPDB account, the end-to-end
> database round-trip was **not** executed in the environment where this project was
> generated. The full form workflow (initial state → new/existing Roll-No → save → update
> → reset, validation, duplicate prevention, 400/401/network error handling) was verified
> in an offline DOM test harness with JsonPowerDB-shaped responses.
> **Please run the checklist in [Testing](#testing-checklist) after adding your token.**

---

## Table of Contents

1. [Project Title](#1-project-title)
2. [Project Description](#2-project-description)
3. [Objectives](#3-objectives)
4. [Technologies Used](#4-technologies-used)
5. [Database Configuration](#5-database-configuration)
6. [Features](#6-features)
7. [Benefits of Using JsonPowerDB](#7-benefits-of-using-jsonpowerdb)
8. [Project Workflow](#8-project-workflow)
9. [How to Run the Project](#9-how-to-run-the-project)
10. [GitHub Repository Structure](#10-github-repository-structure)
11. [Screenshots](#11-screenshots)
12. [Release History](#12-release-history)
13. [Future Enhancements](#13-future-enhancements)
14. [Testing Checklist](#testing-checklist)
15. [Troubleshooting](#troubleshooting)
16. [GitHub Submission Instructions](#github-submission-instructions)

---

## 1. Project Title

**Student Enrollment System using JsonPowerDB**

## 2. Project Description

The Student Enrollment System is a single-page web application that lets a school
administrator **create and update student records** stored in JsonPowerDB.

The form has exactly six fields — `Roll-No`, `Full-Name`, `Class`, `Birth-Date`, `Address`
and `Enrollment-Date` — and `Roll-No` is the primary key. As soon as the user leaves the
Roll-No field, the application queries JsonPowerDB:

* **Roll-No not found** → the remaining fields unlock and the user can **Save** a new record.
* **Roll-No already found** → the saved record is loaded into the form, Roll-No is locked,
  and the user can **Update** the record.

All communication happens **directly from the browser to the JsonPowerDB REST API** with
jQuery AJAX. There is no server-side code, no database installation and no build tooling,
which is exactly the point of JsonPowerDB's serverless, Ajax-enabled design.

## 3. Objectives

1. Build a working **CRUD-style enrollment form** (create + update + reset) that uses
   JsonPowerDB as its only data store.
2. Practise the official JsonPowerDB micro-project workflow: *check by primary key first,
   then insert or update*.
3. Understand JsonPowerDB's REST commands — `GET_BY_KEY` (IRL), `PUT` and `UPDATE` (IML) —
   and their request/response JSON formats.
4. Prevent invalid data: no empty submissions, no duplicate Roll-No records, no impossible
   dates.
5. Deliver a clean, responsive, easy-to-explain codebase that can be discussed confidently
   in a technical interview.
6. Keep the connection token out of public source code.

## 4. Technologies Used

| Layer | Technology | Purpose |
|---|---|---|
| Markup | **HTML5** | Semantic page structure, native `date` inputs, form validation attributes |
| Styling | **CSS3** | Custom blue-and-white theme (`style.css`) |
| UI framework | **Bootstrap 5.3** | Grid, cards, form controls, buttons, spinner, responsive layout |
| Behaviour | **JavaScript (ES5-compatible + Promises)** | Form state machine, validation, workflow logic |
| AJAX | **jQuery 3.7** (`$.ajax`) | Asynchronous REST calls to JsonPowerDB |
| Database | **JsonPowerDB (JPDB)** | Serverless JSON document store (`/api/irl`, `/api/iml`) |

**Deliberately not used:** React, Node.js, Express, Spring Boot, MySQL, MongoDB, Firebase,
or any other database/server framework. There is no npm install, no bundler and no build step —
`vendor/` simply holds local copies of Bootstrap and jQuery so the page also works offline.

> Bootstrap and jQuery are vendored in `vendor/` (copied from the official npm packages).
> If your evaluation prefers CDN links, see [How to Run → Option B](#option-b--use-cdn-links-instead-of-vendor-files).

## 5. Database Configuration

All settings live in **`config.js`**:

```javascript
const JPDB_CONFIG = {
  CONNECTION_TOKEN: "PASTE_YOUR_CONNECTION_TOKEN_HERE", // ← paste your token here
  API_BASE_URL:     "https://api.login2explore.com:5577",
  IRL_ENDPOINT:     "/api/irl",   // read  (GET_BY_KEY)
  IML_ENDPOINT:     "/api/iml",   // write (PUT, UPDATE)
  DB_NAME:          "SCHOOL-DB",
  RELATION_NAME:    "STUDENT-TABLE",
  PRIMARY_KEY:      "Roll-No",
  REQUEST_TIMEOUT_MS: 20000
};
```

| Setting | Value |
|---|---|
| Database name | `SCHOOL-DB` |
| Relation (table) name | `STUDENT-TABLE` |
| Primary key column | `Roll-No` |
| API base URL | `https://api.login2explore.com:5577` |
| Read endpoint | `POST /api/irl` → `GET_BY_KEY` |
| Write endpoint | `POST /api/iml` → `PUT`, `UPDATE` |

`SCHOOL-DB` and `STUDENT-TABLE` do **not** have to be created manually — JsonPowerDB creates
them automatically on the first successful `PUT`.

### 5.1 Getting a connection token

1. Sign in at <https://login2explore.com>.
2. Open **Tools → Connection Token**.
3. Copy the token — it looks like `9093XXXX|-3194XXXXXXXXXXXXXX|9093XXXX`.
4. Paste it into `CONNECTION_TOKEN` in `config.js` and save the file.

### 5.2 Protecting your connection token

A JsonPowerDB connection token is a credential: anyone who has it can read and write your
database. **Never commit a real token to a public repository.** Pick one of these:

| Option | How | Good for |
|---|---|---|
| **A. Local-only token (recommended)** | Paste your token in `config.js`, then run `git update-index --skip-worktree config.js` so Git ignores your local change. Before pushing, confirm with `git status` that `config.js` is not staged. | Keeping the repo public and safe |
| **B. Temporary token** | Generate a throwaway JPDB token, use it for the screenshots/demo, then delete it in the JPDB dashboard. | Quick submission |
| **C. Private repository** | Keep the repo private while the token is inside it, and share access with the reviewer. | Private review only |

The token is loaded **only** from `config.js`; it is never hard-coded in `index.html` or
`script.js`, so it can be removed or rotated in one place.

### 5.3 Request formats used

**`GET_BY_KEY` — is this Roll-No already stored?** (`POST /api/irl`)

```json
{
  "token": "<your-connection-token>",
  "dbName": "SCHOOL-DB",
  "cmd": "GET_BY_KEY",
  "rel": "STUDENT-TABLE",
  "jsonStr": { "Roll-No": "101" }
}
```

Response when the record exists (`status: 200`) — `data` is a JSON **string** that contains
the record and its JPDB record number:

```json
{
  "data": "{\"record\":{\"Roll-No\":\"101\",\"Full-Name\":\"Ananya Rajesh Patil\",\"Class\":\"10-A\",\"Birth-Date\":\"2010-05-12\",\"Address\":\"12 Shivaji Nagar, Kolhapur\",\"Enrollment-Date\":\"2024-06-10\"},\"rec_no\":1}",
  "message": "DATA RETRIEVED FROM PI",
  "status": 200
}
```

Response when the record does **not** exist: `status: 400` (this is the "new Roll-No" case).

**`PUT` — insert a new student** (`POST /api/iml`)

```json
{
  "token": "<your-connection-token>",
  "dbName": "SCHOOL-DB",
  "cmd": "PUT",
  "rel": "STUDENT-TABLE",
  "jsonStr": {
    "Roll-No": "101",
    "Full-Name": "Ananya Rajesh Patil",
    "Class": "10-A",
    "Birth-Date": "2010-05-12",
    "Address": "12 Shivaji Nagar, Kolhapur",
    "Enrollment-Date": "2024-06-10"
  }
}
```

Success → `{"data":"{\"rec_no\":[1]}","status":200}`

**`UPDATE` — modify the loaded record** (`POST /api/iml`)

JsonPowerDB's `UPDATE` addresses a row by its **record number** (the `rec_no` returned by
`GET_BY_KEY`), so `jsonStr` is keyed by that number. The primary key is intentionally
**not** included, which is how the code guarantees that Roll-No never changes:

```json
{
  "token": "<your-connection-token>",
  "dbName": "SCHOOL-DB",
  "cmd": "UPDATE",
  "rel": "STUDENT-TABLE",
  "jsonStr": {
    "1": {
      "Full-Name": "Ananya Rajesh Patil",
      "Class": "10-A",
      "Birth-Date": "2010-05-12",
      "Address": "14 Station Road, Kolhapur",
      "Enrollment-Date": "2024-06-10"
    }
  }
}
```

### 5.4 Status codes handled

| Status | Meaning | What the app does |
|---|---|---|
| `200` | Success | Fills the form (read) or resets the form with a green success message (write) |
| `400` | Not found on `GET_BY_KEY` | Switches to **Save** mode (new Roll-No) |
| `400` | Syntax / command error on a write | Red error message with the JPDB message text |
| `401` | Invalid connection token | Red error message telling you to fix `config.js` |
| `0` (no HTTP answer) | Network down / timeout / blocked | Red message with a connection hint |

### 5.5 About `jpdb-commons.js`

The Login2Xplore course uses the helper library `jpdb-commons.js`
(`createGET_BY_KEYRequest`, `createPUTRequest`, `createUPDATERequest`, `executeCommandAtGivenBaseUrl`).
This project produces the **identical request JSON** but builds it with three small, readable
functions in `script.js`:

```javascript
createGetByKeyRequest(rollNo)          // → GET_BY_KEY payload
createPutRequest(record)               // → PUT payload
createUpdateRequest(recordNo, columns) // → UPDATE payload (keyed by record number)
```

Why re-implement them?

* No third-party script has to be fetched at runtime (the app already works offline).
* Every request is visible in one file, which makes the micro project easy to explain.
* `jpdb-commons.js`'s `executeCommandAtGivenBaseUrl` is synchronous (it forces
  `jQuery.ajaxSetup({async:false})`); this project uses normal asynchronous AJAX with jQuery
  Deferred/Promises instead, so the UI never freezes.

If you prefer the library, include it with
`<script src="https://login2explore.com/jpdb/resources/js/0.0.3/jpdb-commons.js"></script>`
and swap the three builder calls — the payloads are the same.

## 6. Features

**Enrollment workflow (exactly per the Login2Xplore specification)**

* Empty form on page load — only `Roll-No` enabled, Save/Update/Reset disabled, focus on Roll-No.
* Automatic Roll-No lookup in JsonPowerDB when the field loses focus (or Enter is pressed).
* **New Roll-No** → all fields enabled, **Save** + **Reset** enabled, cursor moved to Full-Name.
* **Existing Roll-No** → record loaded, `Roll-No` locked, **Update** + **Reset** enabled,
  cursor moved to Full-Name.
* **Save** → inserts with `PUT`, then resets the form to the initial state.
* **Update** → updates with `UPDATE` using the JPDB record number, primary key untouched,
  then resets the form.
* **Reset** → clears every field and restores the exact initial state.

**Data quality**

* All six fields mandatory; inline per-field validation messages plus a summary message.
* Roll-No format check (1–20 characters: letters, digits, `-`, `_`, `/`).
* Birth-Date cannot be a future date; Enrollment-Date cannot be before Birth-Date.
* **Duplicate Roll-No prevention** — the Roll-No is re-checked immediately before the `PUT`,
  so a record can never be inserted twice even if the value was added elsewhere in between.
* Whitespace is trimmed before validation and before sending data.

**UX / UI**

* Professional blue-and-white Bootstrap 5 design, responsive from mobile to desktop.
* Record-status badge: *No record selected* / *New Roll-No — ready to Save* /
  *Existing record — ready to Update*.
* Loading overlay with spinner and context text during every API call; controls are blocked meanwhile.
* Colour-coded success / error / warning / info messages, dismissible and auto-hiding.
* "Database" side panel shows the live config (database, relation, primary key, token status).
* Keyboard friendly: Enter triggers lookup/save/update depending on the current state.
* Accessible labels, `aria-live` message region, visible focus styles, `prefers-reduced-motion` support.

**Engineering**

* Separate `index.html`, `style.css`, `script.js`, `config.js` — no inline logic.
* One `FIELDS` array maps inputs to JSON column names (single source of truth).
* Reusable helpers (`callJpdb`, `setState`, `showAlert`, `validateForm`, `resetForm`).
* Explicit handling of `200 / 400 / 401 / network-timeout / unparsable` responses.
* No fake data, no simulated success, no client-side-only "save".

## 7. Benefits of Using JsonPowerDB

* **Serverless architecture** — the browser talks straight to the JsonPowerDB REST endpoint.
  No Node/Java server to write, deploy, scale or pay for; the whole application is static files.
* **Multi-mode database support** — one engine exposes document (JSON), key-value, RDBMS,
  geospatial and time-series APIs, so the same connection can serve different needs as the
  project grows.
* **Simple REST API integration** — every operation is a single `POST` with a small JSON body
  (`cmd`, `dbName`, `rel`, `jsonStr`). The project needs three builders and one transport
  function, nothing more.
* **Schema-free development** — no `CREATE TABLE`, no migrations, no column definitions.
  `SCHOOL-DB` and `STUDENT-TABLE` are created by the first `PUT`, and a new column would be
  added simply by sending it in the JSON.
* **Faster application development** — a full create/read/update flow was possible with
  plain HTML + jQuery in a few hundred lines; there is no ORM, no API layer and no build tooling.
* **Lightweight database operations** — small JSON payloads, Ajax-friendly request/response
  cycles and index-based lookups by primary key keep the app responsive even on modest devices.
* **Zero setup for the client** — nothing to install; a working JsonPowerDB account is enough.

*(These are benefits of the platform as used by this project — no extra functionality,
such as analytics or multi-user administration, is claimed or implemented here.)*

## 8. Project Workflow

```
Page load
   │
   ├─ clear form
   ├─ enable Roll-No only
   ├─ disable Save / Update / Reset
   └─ focus Roll-No
        │
        ▼
User types a Roll-No and leaves the field
        │
        ▼
POST /api/irl  →  GET_BY_KEY { "Roll-No": "<value>" }
        │
        ├── status 400  (not found) ──────────────► CASE A — NEW RECORD
        │                                              enable the 5 fields
        │                                              enable Save + Reset
        │                                              focus Full-Name
        │                                                   │
        │                                                   ▼
        │                                            User fills details → Save
        │                                                   │
        │                                        (re-check Roll-No is still free)
        │                                                   │
        │                                        POST /api/iml → PUT { 6 fields }
        │                                                   │
        │                                        200 → success message → reset form
        │
        └── status 200  (found) ──────────────────► CASE B — EXISTING RECORD
                                                       fill all fields
                                                       disable Roll-No
                                                       enable Update + Reset
                                                       focus Full-Name
                                                            │
                                                            ▼
                                                     User edits → Update
                                                            │
                                              POST /api/iml → UPDATE
                                              { "<rec_no>": { 5 columns } }
                                              (primary key never sent)
                                                            │
                                             200 → success message → reset form
```

Any other outcome (`401` invalid token, `400` on a write, timeout, network failure) leaves the
form usable and shows a red message explaining what to fix; nothing is ever reported as saved
unless JsonPowerDB returned `status: 200`.

## 9. How to Run the Project

### Step 1 — Get the files

```bash
git clone https://github.com/<your-username>/Student-Enrollment-JPDB.git
cd Student-Enrollment-JPDB
```

### Step 2 — Add your connection token

Open `config.js` and replace the placeholder:

```javascript
CONNECTION_TOKEN: "PASTE_YOUR_CONNECTION_TOKEN_HERE",   // ← your JPDB token here
```

### Step 3 — Serve the folder

Opening `index.html` by double-clicking can be blocked by browser CORS rules
(`file://` origin). Serve it over HTTP instead — either is fine:

```bash
# Python (already installed on most systems)
python3 -m http.server 8000
# then open http://localhost:8000

# or VS Code: install "Live Server" → right-click index.html → "Open with Live Server"
```

### Option B — use CDN links instead of `vendor/` files

Replace these two lines in `index.html`:

```html
<!-- local copies -->
<link rel="stylesheet" href="vendor/bootstrap.min.css">
...
<script src="vendor/jquery.min.js"></script>
<script src="vendor/bootstrap.bundle.min.js"></script>
```

with the CDN versions:

```html
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
...
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
```

### Optional — publish with GitHub Pages

1. Push the repository to GitHub.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`.
3. GitHub serves the form at `https://<your-username>.github.io/Student-Enrollment-JPDB/`.
   The API is called over HTTPS, so no mixed-content blocking occurs.

> Remember: a GitHub Pages site is **public**, so do not publish it with a real token inside
> `config.js`. Use a temporary token, or keep the token local (see §5.2).

### Browser support

Current Chrome, Edge, Firefox and Safari (ES5 syntax + native Promises). Internet Explorer is
not supported.

## 10. GitHub Repository Structure

```
Student-Enrollment-JPDB/
│
├── index.html                 # Page structure: header, form, side panel, footer
├── style.css                  # Custom blue/white theme on top of Bootstrap 5
├── script.js                  # All application logic (workflow, validation, JPDB calls)
├── config.js                  # ← JsonPowerDB token / db / relation / endpoints
├── README.md                  # This document
│
├── vendor/                    # Local copies of the libraries (offline friendly)
│   ├── bootstrap.min.css      # Bootstrap 5.3.3
│   ├── bootstrap.bundle.min.js
│   └── jquery.min.js          # jQuery 3.7.1
│
└── assets/
    ├── favicon.svg            # Small brand icon
    └── screenshots/
        └── README.md          # Which screenshots to capture and how to name them
```

| File | Responsibility |
|---|---|
| `index.html` | Markup only — no logic. Loads vendor libs, `config.js`, then `script.js`. |
| `style.css` | Theme tokens, header, cards, buttons, loader overlay, responsive rules. |
| `config.js` | The only file you edit: token, base URL, endpoints, db/relation/primary key. |
| `script.js` | Request builders → `callJpdb()` → workflow (`handleRollNoCheck`, `saveStudent`, `updateStudent`, `resetForm`). |

## 11. Screenshots

Add your own screenshots to `assets/screenshots/` after running the app with your token
(capture instructions: [`assets/screenshots/README.md`](assets/screenshots/README.md)),
then reference them here, for example:

```markdown
![Initial state](assets/screenshots/01-initial-state.png)
```

| # | File name to save | What to capture |
|---|---|---|
| 1 | `01-initial-state.png` | Page on load — only Roll-No enabled, all buttons greyed out |
| 2 | `02-new-rollno.png` | A Roll-No that does not exist → fields unlocked, "New Roll-No — ready to Save" |
| 3 | `03-existing-record.png` | A Roll-No that exists → details loaded, Roll-No locked, "Existing record — ready to Update" |
| 4 | `04-save-success.png` | Green "saved successfully" message after inserting a student |
| 5 | `05-validation-error.png` | Red validation messages after trying to save with empty fields |
| 6 | `06-mobile-view.png` | Responsive mobile layout (browser device toolbar, ~390 px wide) |

Screenshots of the actual JsonPowerDB relation (`SCHOOL-DB → STUDENT-TABLE`) from the
JPDB dashboard are also worth including, since they prove the data really is stored in the
database rather than in the browser.

## 12. Release History

| Version | Date | Changes |
|---|---|---|
| **v1.0.0** | 2026-11-14 | First complete release. Six-field enrollment form, `GET_BY_KEY` lookup on Roll-No blur, insert (`PUT`), update (`UPDATE` with record number), reset, mandatory-field + date validation, duplicate Roll-No guard, loading overlay, success/error messages, responsive Bootstrap 5 blue/white UI, token kept in a single config file, full README with testing checklist. |

## 13. Future Enhancements

Ideas that were intentionally **not** built here (the micro project only asks for the
enrollment form), but that the current code base makes easy to add later:

* **Student list / search view** using the `GET_ALL` and `FIND_RECORD` IRL commands.
* **Delete a record** with the `REMOVE` command (plus a confirmation dialog).
* **Server-side primary-key index** by creating the relation with the `SET` command and
  `"primaryKey": "Roll-No"`, so JsonPowerDB itself rejects duplicates.
* **Token hardening**: move the token to a tiny serverless function or reverse proxy so no
  credential ever reaches the browser.
* **Extra fields** (guardian name, mobile number, gender, section) — a schema-free `PUT`
  with the extra keys is enough; the `FIELDS` array already centralises the column mapping.
* **Export to CSV** of the current relation for reporting.
* **Login / roles** for administrators (out of scope for this micro project).

## Testing Checklist

Tick each row after testing **with your own token**. `PASS` in the "Verified offline" column
means the behaviour was confirmed in an offline DOM harness with JsonPowerDB-shaped
responses; it does **not** prove the live database round-trip.

| # | Test case | Steps | Expected result | Verified offline | Verified live |
|---|---|---|---|---|---|
| 1 | **Initial form state** | Open the page | Only Roll-No enabled; Full-Name, Class, Birth-Date, Address, Enrollment-Date disabled; Save/Update/Reset disabled; cursor in Roll-No | PASS | ☐ |
| 2 | **New Roll-No** | Type `101` (unused) → leave the field | Fields unlock, Save + Reset enabled, Update disabled, cursor in Full-Name, badge "New Roll-No" | PASS | ☐ |
| 3 | **Existing Roll-No** | Type a Roll-No that exists → leave the field | All fields filled from the database, Roll-No disabled, Update + Reset enabled, Save disabled, cursor in Full-Name | PASS | ☐ |
| 4 | **Save a new student** | Fill all six fields → Save | Green success message; record visible in JPDB `SCHOOL-DB → STUDENT-TABLE`; form returns to initial state | PASS (request payload) | ☐ |
| 5 | **Update an existing student** | Load a Roll-No, change Address/Class → Update | Green success message; changed values visible in JPDB; `Roll-No` unchanged; form resets | PASS (request payload) | ☐ |
| 6 | **Reset** | Click Reset in any state | All fields cleared, only Roll-No enabled, all buttons disabled, cursor in Roll-No | PASS | ☐ |
| 7 | **Empty field validation** | Click Save with any field empty | No request is sent; red summary message + inline "… is required." on each empty field; first invalid field focused | PASS | ☐ |
| 8 | **Duplicate Roll-No prevention** | Save `101`, then (second browser tab) try to save `101` again | Warning "duplicate was not created"; the existing record is loaded into update mode instead of inserting a second row; JPDB still has exactly one `101` | PASS (guard logic) | ☐ |
| 9 | **Invalid API token** | Put a wrong value in `CONNECTION_TOKEN` → reload → check a Roll-No | Red message naming the token / HTTP 401; no data is shown or written; the form stays usable | PASS (401 branch) | ☐ |
| 10 | **Network / API error** | Disable the network (DevTools → Offline), or block `api.login2explore.com` → check a Roll-No | Red "Could not reach JsonPowerDB…" message; form stays in the initial state; no false success | PASS (status 0 branch) | ☐ |
| 11 | **Request timeout** | Throttle to "offline"-like latency or let the request hang | Message about the request timing out after 20 s; UI unlocks | ☐ (logic reviewed) | ☐ |
| 12 | **Invalid date logic** | Set Birth-Date in the future, or Enrollment-Date before Birth-Date | Inline error; Save/Update blocked | PASS (validation) | ☐ |
| 13 | **Placeholder token** | Reload without editing `config.js` | Amber setup notice; no API call is attempted | PASS | ☐ |
| 14 | **Responsive layout** | DevTools device toolbar at 390 px / 768 px / 1440 px | No horizontal scroll; inputs stack; buttons full width on mobile | ☐ (CSS reviewed) | ☐ |
| 15 | **Keyboard flow** | Tab through fields; press Enter in Roll-No, then in another field | Enter in Roll-No triggers the lookup; Enter in insert/update mode triggers Save/Update | PASS | ☐ |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Amber "No JsonPowerDB connection token is configured" | `config.js` still has the placeholder | Paste your token in `config.js`, reload |
| "JsonPowerDB rejected the connection token (HTTP 401)" | Token is wrong, expired or copied with spaces | Copy the token again from the JPDB dashboard (Tools → Connection Token) |
| "Could not reach JsonPowerDB…" | No internet, firewall, VPN or an ad-blocker blocking `api.login2explore.com:5577` | Allow the host / try another network; the API is called over HTTPS on port 5577 |
| Browser console shows a CORS error | The page was opened as `file://` | Serve the folder over HTTP (`python3 -m http.server 8000`) |
| Roll-No lookup never leaves "checking" | Long-running request; the overlay hides after the 20 s timeout | Check DevTools → Network for the failing request |
| Page is unstyled | `vendor/` files missing (e.g. only some files were copied) | Copy the whole project, or switch to the CDN links in §9 Option B |
| `config.js` changes never appear in Git | You used `git update-index --skip-worktree config.js` (§5.2) | Expected — that is how the token stays local |

## GitHub Submission Instructions

1. **Create the repository**

   Go to <https://github.com/new> → *Repository name*: `Student-Enrollment-JPDB` →
   Public → **do not** add a README/.gitignore (the project already has them) → *Create repository*.

2. **Add the source code**

   ```bash
   cd Student-Enrollment-JPDB
   git init                     # skip if this folder is already a repository
   git add index.html style.css script.js config.js README.md vendor assets .gitignore
   git status                   # confirm config.js holds NO real token before committing
   ```

3. **Write / review the README**

   `README.md` is already complete. Add your name in the table at the top, and adjust the
   screenshots section once you have images.

4. **Add application screenshots**

   Run the app with your token, capture the six images listed in
   [Screenshots](#11-screenshots) into `assets/screenshots/`, then un-comment/replace the
   example `![…](assets/screenshots/…)` lines in the README and commit them:

   ```bash
   git add assets/screenshots
   ```

5. **Commit and push**

   ```bash
   git commit -m "Student Enrollment System using JsonPowerDB"
   git branch -M main
   git remote add origin https://github.com/<your-username>/Student-Enrollment-JPDB.git
   git push -u origin main
   ```

6. **Verify the repository is public**

   Open `https://github.com/<your-username>/Student-Enrollment-JPDB` in a private/incognito
   window. You should see the files and the rendered README without logging in.
   Also confirm `config.js` contains no real token.

7. **Copy the repository URL for submission**

   Copy `https://github.com/<your-username>/Student-Enrollment-JPDB` and submit it to
   Login2Xplore HR exactly as instructed in the selection-round email.

---

**License / usage:** created as a learning submission for Login2Xplore's
*Introduction to JsonPowerDB V2.0* course. JsonPowerDB is a product of Login2Xplore.
