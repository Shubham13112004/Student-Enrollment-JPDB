

const JPDB_CONFIG = {
 
  CONNECTION_TOKEN: "90933401|-31949151164107719|90904435",

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
