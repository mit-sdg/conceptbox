import { conceptSet } from "@mit-sdg/sync-engine/assembly";
import { authenticating } from "./concepts/Authenticating/registry.ts";
import { consenting } from "./concepts/Consenting/registry.ts";
import { labeling } from "./concepts/Labeling/registry.ts";
import { reasoning } from "./concepts/Reasoning/registry.ts";
import { agentSessioning, sessioning } from "./concepts/Sessioning/registry.ts";
import { sharing } from "./concepts/Sharing/registry.ts";
import { storing } from "./concepts/Storing/registry.ts";
import { trashing } from "./concepts/Trashing/registry.ts";

export const applicationConceptSet = conceptSet({
  Authenticating: authenticating,
  Sessioning: sessioning,
  AgentSessioning: agentSessioning,
  Storing: storing,
  Sharing: sharing,
  Trashing: trashing,
  Labeling: labeling,
  Reasoning: reasoning,
  Consenting: consenting,
});

export const { concepts } = applicationConceptSet;
