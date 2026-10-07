/** The describer, the agent here: it answers the description and label questions about each upload. */
import { DESCRIPTION_ASK, LABELS_ASK } from "../compositions/describing.ts";
import { createAgent, type Reasoner, ReasonerFailure } from "./reusable/agent.ts";
import type { GeminiPart } from "./reusable/reasoners.ts";

/** A file, as the describer reads it. */
export interface FileMaterial {
  name: string;
  mediaType: string;
  bytes: Uint8Array;
}

type Result<T> = Promise<T | { error: string }>;

/** The endpoint the describer reads files through. The generated client has it, and tsc checks that it does. */
interface DescribingClient {
  describing: {
    file(input: { session: string; prompt: string }): Result<{ name: string; mediaType: string; url: string }>;
  };
}

/** Reads the file a prompt is about through `/describing/file`, then fetches its bytes with `download`. */
export function readFile(download = fetchBytes) {
  return async (api: DescribingClient, prompt: string, session: string): Promise<FileMaterial> => {
    const file = await api.describing.file({ session, prompt });
    if ("error" in file) {
      throw new ReasonerFailure(file.error === "FILE_NOT_FOUND" ? "This file is no longer stored." : "The file couldn't be read.");
    }
    return { name: file.name, mediaType: file.mediaType, bytes: await download(file.url) };
  };
}

/** The describer answers both questions about each upload. Tests pass a `download` that reads the in-memory bucket. */
export function createDescriber(reasoner: Reasoner<FileMaterial>, download = fetchBytes) {
  return createAgent({ name: "describer", asks: [DESCRIPTION_ASK, LABELS_ASK], reasoner, read: readFile(download) });
}

/** The file types Gemini can read directly. For other types, the request carries only the name and media type. */
const READABLE = /^(image\/(png|jpeg|webp|heic|heif)|application\/pdf|text\/.*)$/;

/** The Gemini request parts for a file: its name and media type, and its bytes when Gemini can read them. */
export function fileParts({ name, mediaType, bytes }: FileMaterial): GeminiPart[] {
  const about: GeminiPart = { text: `The file is named "${name}" and has type ${mediaType}.` };
  return READABLE.test(mediaType) ? [about, { inline_data: { mime_type: mediaType, data: bytes.toBase64() } }] : [about];
}

/** Writes a description, or labels, from a file's name and media type, for the scripted reasoner. */
export function answerFromFileName(ask: string, { name, mediaType }: FileMaterial): string {
  const kind = mediaType.split("/")[0] || "file";
  if (ask === LABELS_ASK) {
    const words = name.toLowerCase().replace(/\.[^.]+$/, "").split(/[^a-z0-9]+/).filter((word) => word.length > 1);
    return [kind, ...words].slice(0, 5).join("\n");
  }
  return `${/^[aeiou]/.test(kind) ? "An" : "A"} ${kind} file named ${name}.`;
}

/** Downloads a file's bytes, and gives up after a minute. */
async function fetchBytes(url: string): Promise<Uint8Array> {
  const bytes = await fetch(url, { signal: AbortSignal.timeout(60_000) })
    .then(async (response) => (response.ok ? new Uint8Array(await response.arrayBuffer()) : undefined))
    .catch(() => undefined);
  if (bytes === undefined) throw new ReasonerFailure("The file couldn't be downloaded.");
  return bytes;
}
