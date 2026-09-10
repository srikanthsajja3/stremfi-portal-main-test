const KEY = "digilocker_session_v1";

export function saveDigilockerSession({
  clientId,
  returnPath,
  pendingData
}) {
  sessionStorage.setItem(
    KEY,
    JSON.stringify({
      clientId,
      returnPath,
      pendingData
    })
  );
}

export function readDigilockerSession() {
  const raw =
    sessionStorage.getItem(KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDigilockerSession() {
  sessionStorage.removeItem(KEY);
}


// ============================================================
// DIGILOCKER RESULT
// ============================================================

const RESULT_KEY =
  "digilocker_result_v1";


export function saveDigilockerResult(result) {

  sessionStorage.setItem(
    RESULT_KEY,
    JSON.stringify(result)
  );
}


export function readAndClearDigilockerResult() {

  const raw =
    sessionStorage.getItem(
      RESULT_KEY
    );

  sessionStorage.removeItem(
    RESULT_KEY
  );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}