export const ERROR_CODES = Object.freeze([
  "CONFIG_INVALID", "SCHEMA_INVALID", "REPOSITORY_MISMATCH",
  "CANONICAL_STATE_CONTRADICTION", "HASH_MISMATCH",
  "PRECONDITION_MISMATCH", "INTERNAL_CONTROLLER_ERROR",
]);

export class ControlPlaneError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    if (!ERROR_CODES.includes(code)) throw new Error(`Unknown stable error code: ${code}`);
    this.name = "ControlPlaneError";
    this.code = code;
    this.details = details;
  }
}

export function success(command, data) {
  return { ok: true, command, data };
}

export function failure(error) {
  const known = error instanceof ControlPlaneError;
  return {
    ok: false,
    error: {
      code: known ? error.code : "INTERNAL_CONTROLLER_ERROR",
      message: known ? error.message : "Internal controller error",
      details: known ? error.details : {},
    },
  };
}
