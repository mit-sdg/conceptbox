import { httpPolicy, type HttpPolicy } from "@mit-sdg/sync-engine-http/policy";

/**
 * The HTTP category the server returns for each refusal. A refusal missing here reaches the browser as
 * INTERNAL_ERROR (500), so each new refusal needs a line. The browser receives only the category; the
 * sentence for each one is in `frontend/src/api/errors.ts`.
 */
const publicErrors = {
  INVALID_USERNAME: "INVALID_REQUEST",
  INVALID_PASSWORD: "INVALID_REQUEST",
  USERNAME_TAKEN: "CONFLICT",
  INVALID_CREDENTIALS: "UNAUTHORIZED",
  NOT_SIGNED_IN: "UNAUTHORIZED",
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
 * The HTTP settings: the API under /api, each refusal returned as an HTTP category, and the
 * session in an HttpOnly cookie that register and sign-in set and sign-out clears.
 */
export function conceptBoxPolicy(publicOrigin: string): HttpPolicy {
  return httpPolicy({
    publicOrigin,
    basePath: "/api",
    publicErrors,
    cookies: {
      session: {
        name: "conceptbox-session",
        input: "session",
        issue: [
          { path: "/auth/register", value: "session", expires: "expiresAt" },
          { path: "/auth/login", value: "session", expires: "expiresAt" },
        ],
        clear: ["/auth/logout"],
      },
    },
  });
}
