import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Authenticating.md" with { type: "text" };
import type { Db } from "mongodb";
import {
  AuthenticatingConcept,
  InvalidCredentials,
  InvalidPassword,
  InvalidUsername,
  UsernameTaken,
} from "./Authenticating.ts";

export const authenticating = registerConcept({
  class: AuthenticatingConcept,
  spec,
  refusals: {
    INVALID_USERNAME: InvalidUsername,
    INVALID_PASSWORD: InvalidPassword,
    USERNAME_TAKEN: UsernameTaken,
    INVALID_CREDENTIALS: InvalidCredentials,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new AuthenticatingConcept(database, name) },
});
