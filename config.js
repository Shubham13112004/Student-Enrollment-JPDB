/* ==========================================================================
   config.js  —  JsonPowerDB connection settings
   --------------------------------------------------------------------------
   This is the ONLY file you need to edit to connect the form to your own
   JsonPowerDB account.

   STEP 1  Log in to https://login2explore.com  (JPDB Dashboard).
   STEP 2  Open  "Tools"  ->  "Connection Token"  and copy the token.
   STEP 3  Paste it below, inside the quotes of CONNECTION_TOKEN.
           A connection token looks like:  9093XXXX|-3194XXXXXXXXXX|9093XXXX

   >>> REPLACE THE PLACEHOLDER BELOW WITH YOUR OWN TOKEN. <<<
   >>> NEVER COMMIT A REAL TOKEN TO A PUBLIC GITHUB REPOSITORY.  <<<
           (See README.md -> "Protecting your connection token" for the
            recommended ways to keep the token out of Git.)
   ========================================================================== */

const JPDB_CONFIG = {
  /* ------------------------------------------------------------------
     Paste your JsonPowerDB connection token between the quotes.
     Leave the placeholder text as it is until you have a token — the
     app detects the placeholder and shows a setup notice instead of
     firing requests that would fail with HTTP 401.
     ------------------------------------------------------------------ */
  CONNECTION_TOKEN: "PASTE_YOUR_CONNECTION_TOKEN_HERE",

  /* JsonPowerDB REST API base URL (no trailing slash). */
  API_BASE_URL: "https://api.login2explore.com:5577",

  /* API end-points:
     /api/irl -> IRL = Index Retrieval Language (read commands, e.g. GET_BY_KEY)
     /api/iml -> IML = Index Manipulation Language (write commands, PUT / UPDATE) */
  IRL_ENDPOINT: "/api/irl",
  IML_ENDPOINT: "/api/iml",

  /* Database (created automatically by JPDB on the first PUT). */
  DB_NAME: "SCHOOL-DB",

  /* Relation / table name (created automatically on the first PUT). */
  RELATION_NAME: "STUDENT-TABLE",

  /* Primary key column of the relation. Must match the JSON column name. */
  PRIMARY_KEY: "Roll-No",

  /* Request timeout in milliseconds. */
  REQUEST_TIMEOUT_MS: 20000
};
