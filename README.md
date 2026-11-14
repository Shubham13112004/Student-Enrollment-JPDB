# Student Enrollment System — JsonPowerDB

A complete, responsive **Student Enrollment Web Application** that stores and manages
student records directly in **JsonPowerDB** through its REST API — no backend server,
no build step, no external database.



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


### 5.2 Protecting your connection token

A JsonPowerDB connection token is a credential: anyone who has it can read and write your
database. **Never commit a real token to a public repository.** Pick one of these:

| Option | How | Good for |
|---|---|---|
| **A. Local-only token (recommended)** | Paste your token in `config.js`, then run `git update-index --skip-worktree config.js` so Git ignores your local change. Before pushing, confirm with `git status` that `config.js` is not staged. | Keeping the repo public and safe |
| **B. Temporary token** | Generate a throwaway JPDB token, use it for the screenshots/demo, then delete it in the JPDB dashboard. | Quick submission |
| **C. Private repository** | Keep the repo private while the token is inside it, and share access with the reviewer. | Private review only |



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



