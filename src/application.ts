import { assemble, type LogSink, type OperationalObserver } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";
import { composition as access } from "./compositions/access.ts";
import { composition as box } from "./compositions/box.ts";
import { composition as files } from "./compositions/files.ts";
import { composition as shares } from "./compositions/shares.ts";
import { composition as accounts } from "./compositions/reusable/accounts.ts";
import { applicationConceptSet } from "./concepts.ts";
import type { Bucket } from "./concepts/Storing/bucket.ts";

/** Builds ConceptBox on a database and bucket; the HTTP server, the tests, and `sync-engine check` all use it. */
export function assembleConceptBox(
  resources: { database: Db; bucket: Bucket },
  options: { observers?: OperationalObserver[]; logSink?: LogSink } = {},
) {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: applicationConceptSet.implementations("mongo", resources),
    ...options,
    composition: {
      reusable: { accounts },
      access,
      files,
      shares,
      box,
    },
  });
}
