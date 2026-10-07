import type { LogEntry, LogSink } from "@mit-sdg/sync-engine/assembly";

/** Prints each request, each action with the endpoint or reaction that called it, and each response. */
export function printTrace(): LogSink {
  const asked = new Map<string, { concept: string; action: string; input: Record<string, unknown>; by: string }>();
  const names = new Map<string, string>();
  const show = (value: Record<string, unknown>) => {
    const { requestId, correlationId, path, ...fields } = value;
    return JSON.stringify(fields, (_, field) => (typeof field === "string" ? (names.get(field) ?? field) : field));
  };

  return {
    append(entry: LogEntry) {
      if (entry.kind === "invocation") {
        const { id, concept, action, input, by } = entry.record;
        asked.set(id, { concept: concept.name, action: action.name, input, by: by?.split(/[#:]/)[0] ?? "" });
      }
      if (entry.kind !== "outcome") return undefined;
      const call = asked.get(entry.id);
      if (call === undefined) return undefined;
      const { outcome } = entry;
      if (call.action === "request") {
        console.log(`\n-> ${call.input.path} ${show(call.input)}`);
      } else if (call.action === "respond") {
        console.log(`<- ${show(call.input)}`);
      } else if (outcome.kind === "error") {
        console.log(`   ${call.concept}.${call.action}(${show(call.input)}) refuses ${show(outcome.error)}    [${call.by}]`);
      } else {
        if (call.action === "register") names.set(String(outcome.value.user), String(call.input.username));
        if (call.action === "start" && call.concept === "Storing") names.set(String(outcome.value.file), String(call.input.name));
        console.log(`   ${call.concept}.${call.action}(${show(call.input)}) -> ${show(outcome.value)}    [${call.by}]`);
      }
      return undefined;
    },
  };
}
