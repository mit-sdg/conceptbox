import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Reasoning.md" with { type: "text" };
import type { Db } from "mongodb";
import type { File } from "../Storing/Storing.ts";
import {
  AlreadyTaken,
  Closed,
  EmptyAnswer,
  NoReason,
  NotTaken,
  NotYours,
  NothingAsked,
  ReasoningConcept,
  UnknownPrompt,
} from "./Reasoning.ts";

class Reasoning extends ReasoningConcept<File, string> {}

export const reasoning = registerConcept({
  class: Reasoning,
  spec,
  refusals: {
    NOTHING_ASKED: NothingAsked,
    UNKNOWN_PROMPT: UnknownPrompt,
    CLOSED: Closed,
    ALREADY_TAKEN: AlreadyTaken,
    NOT_TAKEN: NotTaken,
    NOT_YOURS: NotYours,
    EMPTY_ANSWER: EmptyAnswer,
    NO_REASON: NoReason,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Reasoning(database, name) },
});
