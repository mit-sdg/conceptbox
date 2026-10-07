import type { OperationalObserver } from "@mit-sdg/sync-engine/assembly";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createLocalClient } from "@mit-sdg/sync-engine/client";
import type { ConceptBoxWire } from "../../generated/wire.ts";
import { assembleConceptBox } from "../../src/application.ts";
import { type Identity, MemoryProvider } from "../../src/concepts/Federating/provider.ts";
import type { Session } from "../../src/concepts/Sessioning/Sessioning.ts";
import { MemoryBucket } from "../../src/concepts/Storing/bucket.ts";
import { testDatabase } from "./reusable/mongo.ts";
import { ok } from "./reusable/results.ts";
import { printTrace } from "./trace.ts";

/** ConceptBox on a fresh database, an in-memory bucket, and an in-memory Commons, called through its typed client. With TRACE set, it prints each action. */
export async function startConceptBox(observers: OperationalObserver[] = []) {
  const database = await testDatabase();
  const bucket = new MemoryBucket();
  const commons = new MemoryProvider();
  const logSink = process.env.TRACE ? printTrace() : undefined;
  const application = assembleConceptBox({ database, bucket, commons }, { observers, logSink });
  const api = createLocalClient<ConceptBoxWire>({ invoker: createGateway<ConceptBoxWire>({ application }) });

  async function register(username: string) {
    return ok(await api.auth.register({ username, password: "correct horse" }));
  }

  /**
   * Signs in with Commons the way the browser does: start an attempt, approve ConceptBox on Commons
   * as `identity`, and finish the attempt with the code and state Commons sends back.
   */
  async function signInWithCommons(identity: Identity) {
    const { attempt, address } = ok(await api.auth.commons.start({}));
    const { code, state } = commons.approve(address, identity);
    return { attempt, result: await api.auth.commons.finish({ attempt, state, code }) };
  }

  /** Uploads the way the browser does: start, send the bytes, finish. */
  async function upload(session: Session, name: string, mediaType = "image/jpeg") {
    const { file, uploadUrl } = ok(await api.files.start({ session, name, mediaType }));
    bucket.send(uploadUrl, new Uint8Array(1_000));
    ok(await api.files.finish({ session, file }));
    return file;
  }

  return { database, bucket, commons, application, api, register, signInWithCommons, upload };
}
