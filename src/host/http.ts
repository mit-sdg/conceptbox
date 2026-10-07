import { httpPolicy, type HttpPolicy } from "@mit-sdg/sync-engine-http/policy";
import { accountsHttp } from "../compositions/reusable/accounts.ts";
import { commonsHttp } from "../compositions/reusable/commons.ts";
import { passwordsHttp } from "../compositions/reusable/passwords.ts";

/**
 * The HTTP category the server returns for each refusal from the compositions in `src/compositions/`.
 * A refusal missing here reaches the browser as INTERNAL_ERROR (500), so each new refusal needs a line.
 * Each way of signing in declares its categories beside its endpoints. The browser receives only the
 * category; the sentence for each one is in `frontend/src/api/errors.ts`, or, for signing in, in the
 * component for that way of signing in.
 */
const publicErrors = {
  INVALID_NAME: "INVALID_REQUEST",
  FILE_NOT_FOUND: "NOT_FOUND",
  ALREADY_FINISHED: "CONFLICT",
  NOT_UPLOADED: "CONFLICT",
  TOO_LARGE: "INVALID_REQUEST",
  ALREADY_SHARED: "CONFLICT",
  NOT_SHARED: "NOT_FOUND",
  ALREADY_TRASHED: "CONFLICT",
  NOT_TRASHED: "CONFLICT",
  NOT_LABELED: "NOT_FOUND",
  ALREADY_CONSENTED: "CONFLICT",
  NOT_CONSENTED: "CONFLICT",
  NOT_FOUND: "NOT_FOUND",
  USER_NOT_FOUND: "INVALID_REQUEST",
  SHARING_WITH_YOURSELF: "FORBIDDEN",
} as const;

/**
 * The HTTP settings: the API under /api, each refusal returned as an HTTP category, the session in
 * an HttpOnly cookie that each way of signing in sets and sign-out clears, and a Commons sign-in
 * attempt in a second cookie that only the browser that started it holds.
 */
export function conceptBoxPolicy(publicOrigin: string): HttpPolicy {
  return httpPolicy({
    publicOrigin,
    basePath: "/api",
    publicErrors: {
      ...accountsHttp.publicErrors,
      ...passwordsHttp.publicErrors,
      ...commonsHttp.publicErrors,
      ...publicErrors,
    },
    cookies: {
      session: accountsHttp.sessionCookie("conceptbox-session", [
        ...passwordsHttp.startingSessions,
        ...commonsHttp.startingSessions,
      ]),
      signIn: commonsHttp.signInCookie("conceptbox-sign-in"),
    },
  });
}
