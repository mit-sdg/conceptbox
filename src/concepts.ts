import { conceptSet } from "@mit-sdg/sync-engine/assembly";
import { authenticating } from "./concepts/Authenticating/registry.ts";
import { sessioning } from "./concepts/Sessioning/registry.ts";
import { sharing } from "./concepts/Sharing/registry.ts";
import { storing } from "./concepts/Storing/registry.ts";

export const applicationConceptSet = conceptSet({
  Authenticating: authenticating,
  Sessioning: sessioning,
  Storing: storing,
  Sharing: sharing,
});

export const { concepts } = applicationConceptSet;
