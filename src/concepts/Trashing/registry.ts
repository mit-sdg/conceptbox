import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Trashing.md" with { type: "text" };
import type { Db } from "mongodb";
import type { File } from "../Storing/Storing.ts";
import { AlreadyTrashed, NotTrashed, Purged, TrashingConcept } from "./Trashing.ts";

class Trashing extends TrashingConcept<File> {}

export const trashing = registerConcept({
  class: Trashing,
  spec,
  refusals: {
    PURGED: Purged,
    ALREADY_TRASHED: AlreadyTrashed,
    NOT_TRASHED: NotTrashed,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Trashing(database, name) },
});
