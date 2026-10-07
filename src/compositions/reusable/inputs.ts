import type { EndpointValidator } from "@mit-sdg/sync-engine/boundary";

/** Accepts a request body whose fields are all strings; `session` is null when the browser sent no cookie. The endpoint's receive clause names the required fields. */
export const textInput: EndpointValidator = (value) => {
  const ok =
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([name, field]) => typeof field === "string" || (name === "session" && field === null),
    );
  return ok ? { ok: true } : { ok: false, detail: "expected text fields" };
};
