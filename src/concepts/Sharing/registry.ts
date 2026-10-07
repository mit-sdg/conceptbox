import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Sharing.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Authenticating/Authenticating.ts";
import type { File } from "../Storing/Storing.ts";
import { AlreadyShared, NotShared, SharingConcept } from "./Sharing.ts";

class Sharing extends SharingConcept<File, User> {}

export const sharing = registerConcept({
  class: Sharing,
  spec,
  refusals: {
    ALREADY_SHARED: AlreadyShared,
    NOT_SHARED: NotShared,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Sharing(database, name) },
});
