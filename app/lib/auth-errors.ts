type ErrorWithMeta = {
  code?: string;
  message?: string;
  cause?: unknown;
  meta?: unknown;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
}

function getErrorCode(value: unknown): string | null {
  const obj = asObject(value) as ErrorWithMeta | null;
  return typeof obj?.code === "string" ? obj.code : null;
}

function getErrorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  const obj = asObject(value) as ErrorWithMeta | null;
  return typeof obj?.message === "string" ? obj.message : "";
}

function getErrorCause(value: unknown): unknown {
  const obj = asObject(value) as ErrorWithMeta | null;
  return obj?.cause;
}

export function getAuthErrorFingerprint(error: unknown): string {
  const code = getErrorCode(error) || "unknown";
  const message = getErrorMessage(error) || "no-message";
  return `${code}:${message}`;
}

export function isRecoverableAuthError(error: unknown, depth = 0): boolean {
  if (!error || depth > 4) return false;

  const code = getErrorCode(error);
  const message = getErrorMessage(error).toLowerCase();

  // P2021: table missing, P1001: database unreachable
  if (code === "P2021" || code === "P1001") return true;

  if (
    message.includes("adaptererror") ||
    message.includes("can't reach database server") ||
    message.includes("cannot reach database server") ||
    message.includes("does not exist in the current database") ||
    message.includes("failed to fetch") ||
    message.includes("connection")
  ) {
    return true;
  }

  return isRecoverableAuthError(getErrorCause(error), depth + 1);
}

export function shouldLogAuthErrorOnce(key: string): boolean {
  const globalForAuthErrors = globalThis as unknown as {
    authErrorKeys?: Set<string>;
  };

  if (!globalForAuthErrors.authErrorKeys) {
    globalForAuthErrors.authErrorKeys = new Set<string>();
  }

  if (globalForAuthErrors.authErrorKeys.has(key)) {
    return false;
  }

  globalForAuthErrors.authErrorKeys.add(key);
  return true;
}
