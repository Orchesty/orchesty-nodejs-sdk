// Always sync this enum with following page:
// https://hanaboso.atlassian.net/wiki/spaces/PIP/pages/105119850/Bridge-Worker+komunikace

// eslint-disable-next-line no-shadow
enum ResultCode {
  // OK
  SUCCESS = 0,

  // NON_STANDARD: 1000+
  REPEAT = 1001,
  FORWARD_TO_TARGET_QUEUE = 1002,
  DO_NOT_CONTINUE = 1003,
  LIMIT_EXCEEDED = 1004,
  STOP_AND_FAILED = 1006,

  // BATCH
  BATCH_CURSOR_WITH_FOLLOWERS = 1010,
  BATCH_CURSOR_ONLY = 1011,

  // MESSAGE ERRORS: 2000+
  UNKNOWN_ERROR = 2001,
  INVALID_HEADERS = 2002,
  INVALID_CONTENT = 2003,

}

export default ResultCode;
