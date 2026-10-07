import { assemble, type LogSink, type OperationalObserver } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";
import { composition as access } from "./compositions/access.ts";
import { composition as box } from "./compositions/box.ts";
import { composition as describing } from "./compositions/describing.ts";
import { composition as files } from "./compositions/files.ts";
import { composition as labels } from "./compositions/labels.ts";
import { composition as shares } from "./compositions/shares.ts";
import { composition as trash } from "./compositions/trash.ts";
import { composition as accounts } from "./compositions/reusable/accounts.ts";
import { composition as answering } from "./compositions/reusable/answering.ts";
import { composition as commons } from "./compositions/reusable/commons.ts";
import { composition as passwords } from "./compositions/reusable/passwords.ts";
import { applicationConceptSet } from "./concepts.ts";
import type { Provider } from "./concepts/Federating/provider.ts";
import type { Bucket } from "./concepts/Storing/bucket.ts";

/** Builds ConceptBox on a database, a bucket, and Commons; the HTTP server, the tests, and `sync-engine check` all use it. */
export function assembleConceptBox(
  resources: { database: Db; bucket: Bucket; commons: Provider },
  options: { observers?: OperationalObserver[]; logSink?: LogSink } = {},
) {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: applicationConceptSet.implementations("mongo", resources),
    // A Commons sign-in attempt works like a password until it is spent, so it and the values sent with it are redacted from logs.
    redaction: { fields: ["attempt", "nonce", "state", "code"] },
    ...options,
    composition: {
      reusable: { accounts, passwords, commons, answering },
      access,
      files,
      shares,
      trash,
      describing,
      labels,
      box,
    },
  });
}
