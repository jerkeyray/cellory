import { auth } from "@/auth";
import {
  getAuthErrorFingerprint,
  isRecoverableAuthError,
  shouldLogAuthErrorOnce,
} from "@/app/lib/auth-errors";

export async function safeAuth() {
  try {
    return await auth();
  } catch (error) {
    if (isRecoverableAuthError(error)) {
      if (process.env.NODE_ENV === "development") {
        const key = `safe-auth:${getAuthErrorFingerprint(error)}`;
        if (shouldLogAuthErrorOnce(key)) {
          console.warn("[safe-auth] recoverable auth adapter error, treating as unauthenticated");
        }
      }
      return null;
    }

    throw error;
  }
}
