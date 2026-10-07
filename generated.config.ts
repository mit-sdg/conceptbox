import { httpWire } from "@mit-sdg/sync-engine-http/tooling";
import { MongoClient } from "mongodb";
import { assembleConceptBox } from "./src/application.ts";
import { MemoryBucket } from "./src/concepts/Storing/bucket.ts";
import { conceptBoxPolicy } from "./src/host/http.ts";

// `sync-engine check` reads only the assembly's shape and calls no concept, so this client never connects.
// The bucket and the HTTP projection are specific to ConceptBox; an app without HTTP can leave out `projections`.
const database = new MongoClient("mongodb://localhost").db("conceptbox");

export default {
  assemble: () => assembleConceptBox({ database, bucket: new MemoryBucket() }),
  title: "ConceptBox",
  wireName: "ConceptBoxWire",
  design: {
    version: 1,
    documents: [
      new URL("./design/types.md", import.meta.url),
      new URL("./design/compositions/reusable/accounts.md", import.meta.url),
      new URL("./design/compositions/access.md", import.meta.url),
      new URL("./design/compositions/files.md", import.meta.url),
      new URL("./design/compositions/shares.md", import.meta.url),
      new URL("./design/compositions/trash.md", import.meta.url),
      new URL("./design/compositions/describing.md", import.meta.url),
      new URL("./design/compositions/reusable/answering.md", import.meta.url),
      new URL("./design/compositions/labels.md", import.meta.url),
      new URL("./design/compositions/box.md", import.meta.url),
    ],
  },
  projections: [httpWire({ policy: conceptBoxPolicy("http://localhost:3000"), name: "ConceptBoxWireHttp" })],
};
