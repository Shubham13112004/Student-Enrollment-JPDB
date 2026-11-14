/* ==========================================================================
   script.js — Student Enrollment System using JsonPowerDB
   --------------------------------------------------------------------------
   Login2Xplore "Introduction to JsonPowerDB V2.0" — Micro Project.

   Application workflow (exactly as specified by Login2Xplore):

     1. INITIAL  : only Roll-No is enabled, Save/Update/Reset are disabled.
     2. On Roll-No blur -> GET_BY_KEY is sent to JsonPowerDB (/api/irl).
        - 400  => record does NOT exist  -> INSERT mode (Save + Reset enabled).
        - 200  => record EXISTS          -> UPDATE mode (record loaded,
                                            Roll-No locked, Update + Reset enabled).
     3. Save  -> PUT    to /api/iml   (blocked if the Roll-No already exists).
     4. Update-> UPDATE to /api/iml   (uses the JPDB record number, never the PK).
     5. Reset -> clears the form and returns to INITIAL.

   Request format follows the official JsonPowerDB REST API and the
   jpdb-commons.js helpers (createGET_BY_KEYRequest / createPUTRequest /
   createUPDATERequest); the builders are re-implemented below so the project
   has no build step and every request is visible and explainable.
   ========================================================================== */

(function ($) {
  "use strict";

  /* ======================================================================
     1. CONFIGURATION
     ====================================================================== */

  // config.js defines JPDB_CONFIG. Guarded so a missing config.js shows a
  // friendly message instead of a console error.
  var CONFIG = (typeof JPDB_CONFIG !== "undefined" && JPDB_CONFIG) ? JPDB_CONFIG : null;

  // Values that mean "the user has not inserted a real token yet".
  var TOKEN_PLACEHOLDERS = [
    "",
    "PASTE_YOUR_CONNECTION_TOKEN_HERE",
    "YOUR_CONNECTION_TOKEN_HERE",
    "YOUR_TOKEN_HERE"
  ];

  /* Field definitions — one place that maps an HTML input id to the JSON
     column name used by JsonPowerDB. Everything else in the file loops
     over this list, so adding/renaming a column means one edit. */
  var FIELDS = [
    { id: "rollNo",         key: "Roll-No",         label: "Roll-No" },
    { id: "fullName",       key: "Full-Name",       label: "Full-Name" },
    { id: "studentClass",   key: "Class",           label: "Class" },
    { id: "birthDate",      key: "Birth-Date",      label: "Birth-Date" },
    { id: "address",        key: "Address",         label: "Address" },
    { id: "enrollmentDate", key: "Enrollment-Date", label: "Enrollment-Date" }
  ];

  /* Form modes. */
  var STATE = {
    INITIAL: "initial", // nothing loaded, only Roll-No editable
    INSERT: "insert",   // new Roll-No, ready to PUT
    UPDATE: "update"    // existing record loaded, ready to UPDATE
  };

  /* Runtime state (never stored in the DOM). */
  var appState = STATE.INITIAL;   // current form mode
  var loadedRecordNo = null;      // JPDB "rec_no" of the loaded record
  var lastCheckedRollNo = "";     // avoids repeated GET_BY_KEY on every blur
  var busy = false;               // true while an API call is running
  var alertTimer = null;          // auto-dismiss timer for success messages
  var lookupSeq = 0;              // invalidates superseded GET_BY_KEY results

  /* ======================================================================
     2. SMALL HELPERS
     ====================================================================== */

  function $field(id) {
    return $("#" + id);
  }

  function focusField(id) {
    var el = document.getElementById(id);
    if (el && !el.disabled) {
      el.focus();
    }
  }

  function todayISO() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch (err) {
      return null;
    }
  }

  function trimValue(value) {
    return typeof value === "string" ? value.trim() : value;
  }

  /* ======================================================================
     3. UI STATE  (enable/disable fields & buttons)
     ====================================================================== */

  /**
   * Applies one of the three form modes to the UI.
   * INITIAL -> only Roll-No enabled, all buttons disabled.
   * INSERT  -> all fields enabled, Save + Reset enabled.
   * UPDATE  -> all fields enabled except Roll-No, Update + Reset enabled.
   */
  function setState(state) {
    appState = state;

    var isInitial = state === STATE.INITIAL;
    var isInsert = state === STATE.INSERT;
    var isUpdate = state === STATE.UPDATE;

    // Roll-No stays editable until an existing record is loaded.
    $field("rollNo").prop("disabled", isUpdate);

    // The five student detail fields unlock once a Roll-No is resolved.
    FIELDS.forEach(function (field) {
      if (field.id !== "rollNo") {
        $field(field.id).prop("disabled", isInitial);
      }
    });

    $field("btnSave").prop("disabled", !isInsert);
    $field("btnUpdate").prop("disabled", !isUpdate);
    $field("btnReset").prop("disabled", isInitial);

    updateStatusBadge(state);
  }

  function updateStatusBadge(state) {
    var $badge = $("#recordStatusBadge");
    var badge = {
      initial: { state: "initial", text: "No record selected" },
      insert:  { state: "insert",  text: "New Roll-No — ready to Save" },
      update:  { state: "update",  text: "Existing record — ready to Update" }
    }[state] || { state: "initial", text: "No record selected" };

    $badge.attr("data-state", badge.state).text(badge.text);
  }

  /**
   * Shows/hides the loading overlay and blocks user interaction meanwhile.
   * @param {boolean} isBusy
   * @param {string}  [message] text shown under the spinner
   */
  function setBusy(isBusy, message) {
    busy = isBusy;
    $("#formLoaderText").text(message || "Working…");
    $("#formLoader").prop("hidden", !isBusy);
    $("#enrollmentForm").attr("aria-busy", isBusy ? "true" : "false");
  }

  /* ======================================================================
     4. NOTIFICATIONS (success / error / warning / info)
     ====================================================================== */

  var ALERT_ICONS = { success: "✓", danger: "!", warning: "!", info: "i" };

  /**
   * Renders one message above the form.
   * @param {"success"|"danger"|"warning"|"info"} type
   * @param {string} message plain text (never HTML — prevents injection)
   * @param {{autoHide?: boolean}} [options]
   */
  function showAlert(type, message, options) {
    var opts = options || {};
    var icon = ALERT_ICONS[type] || "i";

    clearTimeout(alertTimer);
    clearAlert();

    var $alert = $('<div class="app-alert app-alert--' + type + '" role="alert"></div>')
      .append($('<span class="app-alert-icon" aria-hidden="true"></span>').text(icon))
      .append($('<div class="app-alert-body"></div>').text(message))
      .append(
        $('<button type="button" class="app-alert-close" aria-label="Dismiss message">&times;</button>')
          .on("click", clearAlert)
      );

    $("#feedbackArea").empty().append($alert);

    var autoHide = opts.autoHide !== undefined
      ? opts.autoHide
      : (type === "success" || type === "info");

    if (autoHide) {
      alertTimer = window.setTimeout(clearAlert, 7000);
    }
  }

  function clearAlert() {
    clearTimeout(alertTimer);
    $("#feedbackArea").empty();
  }

  /* ======================================================================
     5. VALIDATION
     ====================================================================== */

  function clearValidation() {
    FIELDS.forEach(function (field) {
      $field(field.id).removeClass("is-invalid");
      $field(field.id + "Error").text("");
    });
  }

  function showFieldError(fieldId, message) {
    $field(fieldId).addClass("is-invalid");
    $field(fieldId + "Error").text(message);
  }

  /**
   * Reads the form into a JsonPowerDB record object, e.g.
   * { "Roll-No": "101", "Full-Name": "Ananya Patil", ... }
   */
  function readForm() {
    var record = {};
    FIELDS.forEach(function (field) {
      record[field.key] = trimValue($field(field.id).val() || "");
    });
    return record;
  }

  /**
   * Returns an array of { id, message } validation errors (empty = valid).
   * Covers: empty fields, Roll-No format, impossible dates.
   */
  function validateForm(record) {
    var errors = [];
    var today = todayISO();

    FIELDS.forEach(function (field) {
      if (!record[field.key]) {
        errors.push({ id: field.id, message: field.label + " is required." });
      }
    });

    // Roll-No: 1–20 characters — letters, digits, hyphen, underscore, slash.
    if (record["Roll-No"] && !/^[A-Za-z0-9][A-Za-z0-9\-_/]{0,19}$/.test(record["Roll-No"])) {
      errors.push({
        id: "rollNo",
        message: "Use 1–20 letters, digits, \"-\", \"_\" or \"/\" (for example 101 or CS-101)."
      });
    }

    if (record["Full-Name"] && record["Full-Name"].length < 2) {
      errors.push({ id: "fullName", message: "Please enter the full name (at least 2 characters)." });
    }

    if (record["Birth-Date"] && record["Birth-Date"] > today) {
      errors.push({ id: "birthDate", message: "Birth-Date cannot be a future date." });
    }

    if (record["Birth-Date"] && record["Enrollment-Date"] &&
        record["Enrollment-Date"] < record["Birth-Date"]) {
      errors.push({ id: "enrollmentDate", message: "Enrollment-Date cannot be before Birth-Date." });
    }

    return errors;
  }

  /**
   * Validates the form and shows the messages.
   * @returns {object|null} the record when valid, otherwise null.
   */
  function collectAndValidate() {
    clearValidation();
    var record = readForm();
    var errors = validateForm(record);

    if (errors.length) {
      errors.forEach(function (error) {
        showFieldError(error.id, error.message);
      });
      showAlert(
        "danger",
        errors.length === 1
          ? errors[0].message
          : "Please correct the " + errors.length + " highlighted fields."
      );
      focusField(errors[0].id);
      return null;
    }

    return record;
  }

  /* ======================================================================
     6. JSONPOWERDB REQUEST BUILDERS
        (same JSON as jpdb-commons.js createGET_BY_KEYRequest /
         createPUTRequest / createUPDATERequest)
     ====================================================================== */

  function tokenValue() {
    return String(CONFIG.CONNECTION_TOKEN || "").trim();
  }

  /** GET_BY_KEY : retrieve one record by primary key (IRL, /api/irl). */
  function createGetByKeyRequest(rollNo) {
    var jsonStr = {};
    jsonStr[CONFIG.PRIMARY_KEY] = rollNo;

    return {
      token: tokenValue(),
      dbName: CONFIG.DB_NAME,
      cmd: "GET_BY_KEY",
      rel: CONFIG.RELATION_NAME,
      jsonStr: jsonStr
    };
  }

  /** PUT : insert a new record (IML, /api/iml). */
  function createPutRequest(record) {
    return {
      token: tokenValue(),
      dbName: CONFIG.DB_NAME,
      cmd: "PUT",
      rel: CONFIG.RELATION_NAME,
      jsonStr: record
    };
  }

  /**
   * UPDATE : modify an existing record (IML, /api/iml).
   * JsonPowerDB identifies the row by its record number, so jsonStr is
   * { "<rec_no>": { "column": "new value", ... } }.
   */
  function createUpdateRequest(recordNo, columns) {
    var jsonStr = {};
    jsonStr[String(recordNo)] = columns;

    return {
      token: tokenValue(),
      dbName: CONFIG.DB_NAME,
      cmd: "UPDATE",
      rel: CONFIG.RELATION_NAME,
      jsonStr: jsonStr
    };
  }

  /* ======================================================================
     7. JSONPOWERDB TRANSPORT
     ====================================================================== */

  /**
   * Sends one request to JsonPowerDB.
   * Always resolves with a normalised result:
   *   { status, message, data, raw }
   *   status 200      -> success
   *   status 400/401  -> JsonPowerDB reported an error (record not found,
   *                      invalid token, syntax error, ...)
   *   status 0        -> network failure / timeout / unreadable response
   */
  function callJpdb(endpoint, payload) {
    return new Promise(function (resolve) {
      $.ajax({
        url: CONFIG.API_BASE_URL + endpoint,
        type: "POST",
        // jQuery sends string data as-is. Keeping the default content type
        // matches the official jpdb-commons.js and avoids a CORS preflight.
        data: JSON.stringify(payload),
        dataType: "json",
        timeout: CONFIG.REQUEST_TIMEOUT_MS || 20000
      })
        .done(function (body) {
          resolve(normaliseResponse(body, 200));
        })
        .fail(function (xhr, textStatus) {
          // JsonPowerDB answers 400/401 with a JSON body, so read it from the
          // failed request instead of throwing the information away.
          var body = readErrorBody(xhr);
          if (body && typeof body.status === "number") {
            resolve(normaliseResponse(body, body.status));
            return;
          }
          resolve({
            status: 0,
            message: describeNetworkError(textStatus, xhr),
            data: null,
            raw: null
          });
        });
    });
  }

  function normaliseResponse(body, fallbackStatus) {
    var parsed = typeof body === "string" ? safeJsonParse(body) : body;

    if (!parsed || typeof parsed !== "object") {
      return {
        status: fallbackStatus,
        message: "Unexpected response received from JsonPowerDB.",
        data: null,
        raw: body
      };
    }

    // JPDB returns its payload inside `data` as a JSON *string*:
    //   { "data": "{\"record\":{...},\"rec_no\":1}", "status": 200, ... }
    var data = parsed.data;
    if (typeof data === "string") {
      data = safeJsonParse(data);
    }

    return {
      status: typeof parsed.status === "number" ? parsed.status : fallbackStatus,
      message: parsed.message || "",
      data: data || null,
      raw: parsed
    };
  }

  function readErrorBody(xhr) {
    if (!xhr) {
      return null;
    }
    if (xhr.responseJSON && typeof xhr.responseJSON === "object") {
      return xhr.responseJSON;
    }
    if (typeof xhr.responseText === "string" && xhr.responseText) {
      return safeJsonParse(xhr.responseText);
    }
    return null;
  }

  function describeNetworkError(textStatus, xhr) {
    if (textStatus === "timeout") {
      return "The request to JsonPowerDB timed out. Check your internet connection and try again.";
    }
    if (textStatus === "parsererror") {
      return "JsonPowerDB replied with something that is not JSON. Check the API base URL in config.js.";
    }
    if (xhr && xhr.status === 0) {
      return "Could not reach JsonPowerDB at " + CONFIG.API_BASE_URL +
        ". Check your internet connection and whether a firewall or browser extension is blocking the request.";
    }
    return "Network error while contacting JsonPowerDB" +
      (xhr && xhr.status ? " (HTTP " + xhr.status + ")" : "") + ".";
  }

  /** JPDB returns rec_no either as a number or as an array — normalise it. */
  function extractRecordNo(recNo) {
    if (recNo === undefined || recNo === null) {
      return null;
    }
    if (Array.isArray(recNo)) {
      return recNo.length ? recNo[0] : null;
    }
    return recNo;
  }

  /**
   * Looks a student up by Roll-No.
   * @returns {Promise<{status:number, record?:object, recordNo?:*, message?:string}>}
   *          status 200 = found, 400 = not found, other = real error.
   */
  function fetchStudentRecord(rollNo) {
    return callJpdb(CONFIG.IRL_ENDPOINT, createGetByKeyRequest(rollNo)).then(function (response) {
      if (response.status === 200) {
        var data = response.data || {};
        if (!data.record) {
          // A 200 without a record body means nothing was actually found —
          // treat it exactly like "new Roll-No" instead of loading an empty row.
          return { status: 400, message: "Empty record in the JsonPowerDB response." };
        }
        return {
          status: 200,
          record: data.record,
          recordNo: extractRecordNo(data.rec_no)
        };
      }
      if (response.status === 400) {
        // JsonPowerDB answers 400 when the key (or the relation) does not
        // exist yet — that simply means "new Roll-No".
        return { status: 400, message: response.message };
      }
      return { status: response.status, message: response.message };
    });
  }

  /** Builds a readable message for any non-200 JsonPowerDB response. */
  function explainFailure(result, context) {
    var prefix = context ? context + ". " : "";
    if (!result) {
      return prefix + "Unknown error.";
    }
    if (result.status === 0) {
      return prefix + (result.message || "Network error.");
    }
    if (result.status === 401) {
      return prefix + "JsonPowerDB rejected the connection token (HTTP 401). " +
        "Open config.js and check that CONNECTION_TOKEN holds a valid token.";
    }
    if (result.status === 403) {
      return prefix + "JsonPowerDB refused the request (HTTP 403). Check the token permissions.";
    }
    return prefix + "JsonPowerDB responded with status " + result.status +
      (result.message ? ": " + result.message : ".");
  }

  /* ======================================================================
     8. TOKEN / SETUP CHECKS
     ====================================================================== */

  function isTokenConfigured() {
    if (!CONFIG) {
      return false;
    }
    var token = tokenValue();
    if (!token) {
      return false;
    }
    return TOKEN_PLACEHOLDERS.indexOf(token.toUpperCase()) === -1;
  }

  function showSetupNotice() {
    showAlert(
      "warning",
      "No JsonPowerDB connection token is configured. Open config.js and replace " +
      "\"PASTE_YOUR_CONNECTION_TOKEN_HERE\" with your own connection token from " +
      "login2explore.com (Tools → Connection Token), then reload this page.",
      { autoHide: false }
    );
  }

  /** Returns true when a real token is available, otherwise shows the notice. */
  function ensureToken() {
    if (isTokenConfigured()) {
      return true;
    }
    showSetupNotice();
    focusField("rollNo");
    return false;
  }

  function renderConfigInfo() {
    if (!CONFIG) {
      $("#dbNameLabel").text("config.js missing");
      $("#relNameLabel").text("—");
      $("#pkLabel").text("—");
      $("#tokenStatusLabel").text("config.js missing").addClass("is-warn");
      showAlert(
        "danger",
        "config.js could not be loaded. Make sure config.js sits next to index.html and define JPDB_CONFIG.",
        { autoHide: false }
      );
      return;
    }

    $("#dbNameLabel").text(CONFIG.DB_NAME);
    $("#relNameLabel").text(CONFIG.RELATION_NAME);
    $("#pkLabel").text(CONFIG.PRIMARY_KEY);

    if (isTokenConfigured()) {
      $("#tokenStatusLabel").text("Token configured").addClass("is-ok").removeClass("is-warn");
    } else {
      $("#tokenStatusLabel").text("Token required").addClass("is-warn").removeClass("is-ok");
    }
  }

  /* ======================================================================
     9. FORM FILL / CLEAR
     ====================================================================== */

  function fillForm(record) {
    FIELDS.forEach(function (field) {
      var value = record[field.key];
      $field(field.id).val(value === undefined || value === null ? "" : String(value));
    });
  }

  /** Clears the five student fields but keeps the Roll-No as typed. */
  function clearStudentFields() {
    FIELDS.forEach(function (field) {
      if (field.id !== "rollNo") {
        $field(field.id).val("");
      }
    });
  }

  /** Full reset: empty form, INITIAL state, focus on Roll-No. */
  function resetForm() {
    clearTimeout(alertTimer);
    clearValidation();
    clearAlert();

    FIELDS.forEach(function (field) {
      $field(field.id).val("");
    });

    loadedRecordNo = null;
    lastCheckedRollNo = "";
    lookupSeq++;              // any pending Roll-No lookup is now obsolete
    setState(STATE.INITIAL);
    focusField("rollNo");
  }

  /* ======================================================================
     10. WORKFLOW: ROLL-NO LOOKUP
     ====================================================================== */

  /** Called when the user leaves the Roll-No field (blur) or presses Enter. */
  function handleRollNoCheck() {
    if (busy) {
      return;
    }

    var rollNo = String($field("rollNo").val() || "").trim();
    $field("rollNo").val(rollNo);

    if (!rollNo) {
      // Nothing to look up — go back to the initial state.
      if (appState !== STATE.INITIAL) {
        resetForm();
      }
      return;
    }

    if (!ensureToken()) {
      return;
    }

    // Already resolved this exact Roll-No — do not call the API again.
    if (rollNo === lastCheckedRollNo && appState !== STATE.INITIAL) {
      return;
    }

    var seq = ++lookupSeq;
    setBusy(true, "Checking Roll-No " + rollNo + " in JsonPowerDB…");

    fetchStudentRecord(rollNo).then(function (result) {
      if (seq !== lookupSeq) {
        return; // a Reset (or a newer lookup) happened meanwhile — drop this result
      }
      setBusy(false);

      // ---------------- CASE B: the Roll-No already exists ----------------
      if (result.status === 200 && result.record) {
        fillForm(result.record);
        loadedRecordNo = result.recordNo;
        lastCheckedRollNo = rollNo;
        setState(STATE.UPDATE);
        showAlert(
          "info",
          "Roll-No " + rollNo + " already exists — the saved details are loaded. " +
          "Edit any field and click Update (Roll-No cannot be changed)."
        );
        focusField("fullName");
        return;
      }

      // --------------- CASE A: the Roll-No does not exist yet ---------------
      if (result.status === 400) {
        clearStudentFields();
        loadedRecordNo = null;
        lastCheckedRollNo = rollNo;
        setState(STATE.INSERT);
        showAlert(
          "info",
          "Roll-No " + rollNo + " is not in the database yet — fill in the details and click Save."
        );
        focusField("fullName");
        return;
      }

      // ------------------------- Real errors -------------------------
      loadedRecordNo = null;
      lastCheckedRollNo = "";
      setState(STATE.INITIAL);
      $field("rollNo").val(rollNo);
      showAlert("danger", explainFailure(result, "Could not check Roll-No " + rollNo));
      focusField("rollNo");
    });
  }

  /* ======================================================================
     11. WORKFLOW: SAVE (PUT)
     ====================================================================== */

  function saveStudent() {
    if (busy) {
      return;
    }
    if (appState !== STATE.INSERT) {
      showAlert("warning", "Enter a new Roll-No first — the form is not ready to save.");
      return;
    }
    if (!ensureToken()) {
      return;
    }

    var record = collectAndValidate();
    if (!record) {
      return;
    }

    var rollNo = record[CONFIG.PRIMARY_KEY];

    setBusy(true, "Saving student record…");

    // Duplicate guard: JPDB's PUT appends a record, so confirm one last time
    // that this Roll-No is still free (it may have been added elsewhere).
    fetchStudentRecord(rollNo)
      .then(function (check) {
        if (check.status === 200) {
          setBusy(false);
          fillForm(check.record || {});
          loadedRecordNo = check.recordNo;
          lastCheckedRollNo = rollNo;
          setState(STATE.UPDATE);
          showAlert(
            "warning",
            "Roll-No " + rollNo + " already exists in JsonPowerDB, so a duplicate was not created. " +
            "The existing record is loaded — use Update to change it."
          );
          focusField("fullName");
          return null;
        }
        if (check.status !== 400) {
          setBusy(false);
          showAlert("danger", explainFailure(check, "Could not verify Roll-No " + rollNo + " before saving"));
          return null;
        }
        return callJpdb(CONFIG.IML_ENDPOINT, createPutRequest(record)).then(function (response) {
          setBusy(false);

          if (response.status === 200) {
            var recNo = extractRecordNo(response.data && response.data.rec_no);
            resetForm();
            showAlert(
              "success",
              "Student \"" + record["Full-Name"] + "\" (Roll-No " + rollNo + ") saved successfully" +
              (recNo !== null && recNo !== undefined ? " as record #" + recNo : "") + "."
            );
            return;
          }

          showAlert("danger", explainFailure(response, "The record could not be saved"));
        });
      })
      .catch(function (error) {
        setBusy(false);
        showAlert("danger", "Unexpected error while saving: " + error.message);
      });
  }

  /* ======================================================================
     12. WORKFLOW: UPDATE
     ====================================================================== */

  function updateStudent() {
    if (busy) {
      return;
    }
    if (appState !== STATE.UPDATE) {
      showAlert("warning", "Load an existing Roll-No first — the form is not ready to update.");
      return;
    }
    if (!ensureToken()) {
      return;
    }

    var record = collectAndValidate();
    if (!record) {
      return;
    }

    var rollNo = record[CONFIG.PRIMARY_KEY];

    setBusy(true, "Updating student record…");

    resolveRecordNo(rollNo)
      .then(function (recordNo) {
        if (recordNo === null) {
          setBusy(false);
          return;
        }

        // The primary key is never sent, so it can never be changed.
        var columns = Object.assign({}, record);
        delete columns[CONFIG.PRIMARY_KEY];

        return callJpdb(CONFIG.IML_ENDPOINT, createUpdateRequest(recordNo, columns))
          .then(function (response) {
            setBusy(false);

            if (response.status === 200) {
              resetForm();
              showAlert("success", "Roll-No " + rollNo + " updated successfully.");
              return;
            }

            showAlert("danger", explainFailure(response, "The record could not be updated"));
          });
      })
      .catch(function (error) {
        setBusy(false);
        showAlert("danger", "Unexpected error while updating: " + error.message);
      });
  }

  /**
   * JsonPowerDB UPDATE needs the record number (rec_no). It is cached when the
   * record is loaded; if it is ever missing we fetch it again by primary key.
   */
  function resolveRecordNo(rollNo) {
    if (loadedRecordNo !== null && loadedRecordNo !== undefined && loadedRecordNo !== "") {
      return Promise.resolve(loadedRecordNo);
    }

    return fetchStudentRecord(rollNo).then(function (result) {
      if (result.status === 200) {
        loadedRecordNo = result.recordNo;
        return loadedRecordNo;
      }
      showAlert(
        "danger",
        explainFailure(result, "Could not reload Roll-No " + rollNo + " before updating")
      );
      return null;
    });
  }

  /* ======================================================================
     13. EVENT BINDING & START-UP
     ====================================================================== */

  function bindEvents() {
    // Roll-No: check on blur, and reset the form when the field is emptied.
    $field("rollNo")
      .on("blur", handleRollNoCheck)
      .on("input", function () {
        if (busy) {
          return;
        }
        var rollNo = String($field("rollNo").val() || "").trim();
        if (!rollNo && appState !== STATE.INITIAL) {
          resetForm();
        }
      });

    // Buttons.
    $field("btnSave").on("click", function (event) {
      // The Save button is type="submit"; the form's submit handler runs below.
      event.preventDefault();
      saveStudent();
    });
    $field("btnUpdate").on("click", updateStudent);
    $field("btnReset").on("click", function () {
      if (busy) {
        return;
      }
      resetForm();
    });

    // Enter key inside a field: save / update / lookup depending on the mode.
    $("#enrollmentForm").on("submit", function (event) {
      event.preventDefault();
      if (busy) {
        return;
      }
      if (appState === STATE.INSERT) {
        saveStudent();
      } else if (appState === STATE.UPDATE) {
        updateStudent();
      } else {
        handleRollNoCheck();
      }
    });

    // Clear a field's error highlight as soon as the user edits it.
    FIELDS.forEach(function (field) {
      $field(field.id).on("input change", function () {
        $field(field.id).removeClass("is-invalid");
        $field(field.id + "Error").text("");
      });
    });
  }

  function setDateBounds() {
    // A birth date can never be in the future (also kept in sync with the
    // custom validation in validateForm()).
    $field("birthDate").attr("max", todayISO());
  }

  function init() {
    renderConfigInfo();
    setDateBounds();
    bindEvents();
    resetForm();

    if (CONFIG && !isTokenConfigured()) {
      showSetupNotice();
      return;
    }

    if (CONFIG) {
      console.info(
        "[Student Enrollment] JsonPowerDB target: " + CONFIG.API_BASE_URL +
        " · db=" + CONFIG.DB_NAME + " · rel=" + CONFIG.RELATION_NAME +
        " · pk=" + CONFIG.PRIMARY_KEY
      );
    }
  }

  $(init);

})(jQuery);
