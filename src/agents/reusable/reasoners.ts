import { type Reasoner, ReasonerFailure } from "./agent.ts";

/** A reasoner for tests and for working offline; it writes whatever `script` returns, one word at a time. */
export function scriptedReasoner<Material>(script: (ask: string, material: Material) => string): Reasoner<Material> {
  return {
    name: "scripted",
    async answer(ask, material, write) {
      for (const piece of script(ask, material).match(/\S+\s*/g) ?? []) await write(piece);
    },
  };
}

/** One part of a Gemini request: text, or a file's bytes in base64. */
export type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

/**
 * Google's Gemini models, streaming the answer as Gemini writes it. `parts` turns the material
 * into the request parts that follow the question, such as the text of a post or a file's bytes.
 */
export function geminiReasoner<Material>({
  apiKey,
  model,
  parts,
}: {
  apiKey: string;
  model: string;
  parts: (material: Material) => GeminiPart[];
}): Reasoner<Material> {
  return {
    name: model,
    async answer(ask, material, write) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({ contents: [{ parts: [{ text: ask }, ...parts(material)] }] }),
          signal: AbortSignal.timeout(60_000),
        },
      ).catch((error: unknown) => {
        throw new ReasonerFailure(timedOut(error) ? TOO_LONG : "The model couldn't be reached.");
      });
      if (!response.ok || response.body === null) throw new ReasonerFailure(failureFor(response.status, await response.text()));

      // With alt=sse, Gemini sends server-sent events: each holds a "data: {json}" line, and a blank line ends it.
      // A network chunk can end partway through an event, so the unfinished last piece is kept in `buffered`.
      const writeEvent = async (event: string) => {
        const data = event.match(/^data: (.*)$/m)?.[1];
        if (data === undefined) return;
        const answered: { text?: string }[] = JSON.parse(data).candidates?.[0]?.content?.parts ?? [];
        const text = answered.map((part) => part.text ?? "").join("");
        if (text) await write(text);
      };
      let buffered = "";
      try {
        for await (const chunk of response.body.pipeThrough(new TextDecoderStream())) {
          const events = (buffered + chunk).split(/\r?\n\r?\n/);
          buffered = events.pop() ?? "";
          for (const event of events) await writeEvent(event);
        }
      } catch (error) {
        // The minute also covers the answer streaming in, so the stream can time out partway through.
        throw timedOut(error) ? new ReasonerFailure(TOO_LONG) : error;
      }
      await writeEvent(buffered);
    },
  };
}

const TOO_LONG = "The model took too long to answer.";

const timedOut = (error: unknown) => error instanceof DOMException && error.name === "TimeoutError";

function failureFor(status: number, body: string): string {
  if (status === 401 || status === 403 || body.includes("API_KEY_INVALID")) {
    return "The model didn't accept this server's API key.";
  }
  if (status === 429) return "The model is busy. Try again in a minute.";
  if (status === 400 || status === 413) return "The model couldn't read this file.";
  return "The model couldn't be reached.";
}
