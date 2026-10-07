import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createLocalClient } from "@mit-sdg/sync-engine/client";
import type { ConceptBoxWire } from "../../generated/wire.ts";
import { assembleConceptBox } from "../../src/application.ts";
import type { Session } from "../../src/concepts/Sessioning/Sessioning.ts";
import { MemoryBucket } from "../../src/concepts/Storing/bucket.ts";
import { testDatabase } from "./reusable/mongo.ts";
import { ok } from "./reusable/results.ts";
import { printTrace } from "./trace.ts";

/** ConceptBox on a fresh database and an in-memory bucket, called through its typed client. With TRACE set, it prints each action. */
export async function startConceptBox() {
  const database = await testDatabase();
  const bucket = new MemoryBucket();
  const logSink = process.env.TRACE ? printTrace() : undefined;
  const application = assembleConceptBox({ database, bucket }, { logSink });
  const api = createLocalClient<ConceptBoxWire>({ invoker: createGateway<ConceptBoxWire>({ application }) });

  async function register(username: string) {
    return ok(await api.auth.register({ username, password: "correct horse" }));
  }

  /** Uploads the way the browser does: start, send the bytes, finish. */
  async function upload(session: Session, name: string, mediaType = "image/jpeg") {
    const { file, uploadUrl } = ok(await api.files.start({ session, name, mediaType }));
    bucket.send(uploadUrl, new Uint8Array(1_000));
    ok(await api.files.finish({ session, file }));
    return file;
  }

  return { bucket, application, api, register, upload };
}
