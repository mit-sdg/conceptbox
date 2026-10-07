/** The sentence to show for each HTTP category, by endpoint outside `/auth`. Each refusal is mapped to its category in `src/host/http.ts`. */
const messages: Record<string, Record<string, string>> = {
  "/files/start": { INVALID_REQUEST: "File names can be at most 255 characters." },
  "/files/finish": {
    CONFLICT: "The upload didn't go through. Try again.",
    INVALID_REQUEST: "A file can be at most 25 MB.",
  },
  "/files/share": {
    CONFLICT: "That person already has access to that file.",
    FORBIDDEN: "You can't share a file with yourself.",
    INVALID_REQUEST: "Nobody has that username. Check the spelling and capitals.",
  },
  "/files/revoke": { NOT_FOUND: "That person no longer has access to that file." },
};

/** The sentence to show when the endpoint at `path` returns `error`. */
export function messageFor(path: string, error: string): string {
  const fallback = error === "NOT_FOUND" ? "That file isn't available." : "Something went wrong. Try again.";
  return messages[path]?.[error] ?? fallback;
}
