import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Storing.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Authenticating/Authenticating.ts";
import {
  AlreadyFinished,
  FileNotFound,
  InvalidName,
  NotUploaded,
  StoringConcept,
  TooLarge,
} from "./Storing.ts";
import type { Bucket } from "./bucket.ts";

class Storing extends StoringConcept<User> {}

export const storing = registerConcept({
  class: Storing,
  spec,
  refusals: {
    INVALID_NAME: InvalidName,
    FILE_NOT_FOUND: FileNotFound,
    ALREADY_FINISHED: AlreadyFinished,
    NOT_UPLOADED: NotUploaded,
    TOO_LARGE: TooLarge,
  },
  floors: { mongo: ({ database, bucket }: { database: Db; bucket: Bucket }, name: string) => new Storing(database, bucket, name) },
});
