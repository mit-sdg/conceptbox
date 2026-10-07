import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Labeling.md" with { type: "text" };
import type { Db } from "mongodb";
import type { File } from "../Storing/Storing.ts";
import { AlreadyLabeled, InvalidLabel, LabelingConcept, NotLabeled } from "./Labeling.ts";

class Labeling extends LabelingConcept<File> {}

export const labeling = registerConcept({
  class: Labeling,
  spec,
  refusals: {
    INVALID_LABEL: InvalidLabel,
    ALREADY_LABELED: AlreadyLabeled,
    NOT_LABELED: NotLabeled,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Labeling(database, name) },
});
