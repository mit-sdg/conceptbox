import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, form, former, is, no, reaction, view, when, whether, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { owns } from "./access.ts";
import { textInput } from "./reusable/inputs.ts";

const { AgentSessioning, Consenting, Labeling, Reasoning, Sessioning, Storing } = concepts;

/** The use people consent to when they turn describing on. */
const DESCRIBE_UPLOADS = "describe-uploads";

/**
 * The two questions. The reactions and the former below, and the describer in `src/agents/describer.ts`, match prompts by this exact text,
 * so rewording a question hides the answers to the old wording, and leaves its waiting prompts unanswered.
 */
export const DESCRIPTION_ASK = "Describe this file in one or two short sentences, for someone deciding whether to open it.";
export const LABELS_ASK =
  "Suggest up to five short labels someone might search for to find this file again. Write each label on its own line, in lowercase, and nothing else.";
/** LabelFromAnswer applies only the first five lines, whatever the model writes. */
const MOST_LABELS = 5;

// Choosing

const describingOn = view("(user) has describing on", ({ user }) =>
  where(Consenting._consented({ person: user, use: DESCRIBE_UPLOADS }).is({ consented: true })),
).holds();

export const describingSetting = former("whether (user) has describing on", ({ user }, { consented }) =>
  where(Consenting._consented({ person: user, use: DESCRIBE_UPLOADS }).is({ consented })).form({ on: consented }),
);

const TurnOn = endpoint(
  "/describing/on",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(Consenting.consent({ person: user, use: DESCRIBE_UPLOADS }).responds({}))
      .then(respond({})),
  { validators: { input: textInput } },
);

const TurnOff = endpoint(
  "/describing/off",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(Consenting.withdraw({ person: user, use: DESCRIBE_UPLOADS }).responds({}))
      .then(respond({})),
  { validators: { input: textInput } },
);

const AbandonWhenTurnedOff = reaction(({ user, file, prompt }) =>
  when(Consenting.withdraw({ person: user, use: DESCRIBE_UPLOADS }).responds({}))
    .where(
      Storing._uploadedBy({ uploader: user }).is({ file }),
      Reasoning._about({ subject: file }).is({ prompt, stage: "WAITING" }),
    )
    .then(Reasoning.abandon({ prompt, reason: "You turned off “Describe uploads”." })),
);

// Asking

const hasOpenQuestion = view("(file) has an open question that asks (ask)", ({ file, ask }, _outputs, { stage }) =>
  where(Reasoning._about({ subject: file }).is({ ask, stage }), is.among(stage, ["WAITING", "FORMING"])),
).holds();

const AskForDescription = reaction(({ file, uploader }) =>
  when(Storing.finish({ file, uploader }).responds({}))
    .where(describingOn({ user: uploader }))
    .then(Reasoning.prompt({ subject: file, ask: DESCRIPTION_ASK })),
);

const AskForLabels = reaction(({ file, uploader }) =>
  when(Storing.finish({ file, uploader }).responds({}))
    .where(describingOn({ user: uploader }))
    .then(Reasoning.prompt({ subject: file, ask: LABELS_ASK })),
);

const DescribeAgain = endpoint(
  "/files/describe",
  ({ session, file, user }) =>
    receive({ session, file })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(owns({ user, file }), describingOn({ user }), no(hasOpenQuestion({ file, ask: DESCRIPTION_ASK })))
          .then(Reasoning.prompt({ subject: file, ask: DESCRIPTION_ASK }).responds({}))
          .then(respond({ file }))
          .named("consented"),
        where(owns({ user, file }), describingOn({ user }), hasOpenQuestion({ file, ask: DESCRIPTION_ASK }))
          .then(respond({ file }))
          .named("already-asked"),
        where(owns({ user, file }), no(describingOn({ user })))
          .then(respond({ error: "NOT_CONSENTED" }))
          .named("not-consented"),
        where(no(owns({ user, file })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

const SuggestLabelsAgain = endpoint(
  "/files/relabel",
  ({ session, file, user }) =>
    receive({ session, file })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(owns({ user, file }), describingOn({ user }), no(hasOpenQuestion({ file, ask: LABELS_ASK })))
          .then(Reasoning.prompt({ subject: file, ask: LABELS_ASK }).responds({}))
          .then(respond({ file }))
          .named("consented"),
        where(owns({ user, file }), describingOn({ user }), hasOpenQuestion({ file, ask: LABELS_ASK }))
          .then(respond({ file }))
          .named("already-asked"),
        where(owns({ user, file }), no(describingOn({ user })))
          .then(respond({ error: "NOT_CONSENTED" }))
          .named("not-consented"),
        where(no(owns({ user, file })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

// Reading

/** The file a prompt is about, for the agent that took the prompt. A person's session is refused by `AgentSessioning.use`. */
const ReadFile = endpoint(
  "/describing/file",
  ({ session, prompt, agent, file, name, mediaType, url }) =>
    receive({ session, prompt })
      .then(AgentSessioning.use({ session }).responds({ subject: agent }))
      .then(
        where(
          Reasoning._taken({ reasoner: agent }).is({ prompt, subject: file }),
          Storing._get({ file }).is({ name, mediaType }),
          Storing._download({ file }).is({ url }),
        )
          .then(respond({ name, mediaType, url }))
          .named("stored"),
        where(Reasoning._taken({ reasoner: agent }).is({ prompt, subject: file }), no(Storing._get({ file })))
          .then(respond({ error: "FILE_NOT_FOUND" }))
          .named("deleted"),
        where(no(Reasoning._taken({ reasoner: agent }).is({ prompt })))
          .then(respond({ error: "NOT_TAKEN" }))
          .named("not-taken"),
      ),
  { validators: { input: textInput } },
);

// Applying

const LabelFromAnswer = reaction(({ prompt, file, line, position }) =>
  when(Reasoning.conclude({ prompt }).responds({ subject: file, ask: LABELS_ASK }))
    .where(Storing._get({ file }), Reasoning._lines({ prompt }).is({ line, position }), is.lt(position, MOST_LABELS))
    .then(Labeling.label({ item: file, name: line })),
);

// Forgetting

const ForgetQuestionsOfDeleted = reaction(({ file }) =>
  when(Storing.delete({ file }).responds({})).then(Reasoning.forget({ subject: file })),
);

// Showing

/** The descriptions, label questions, and labels of a file, and how many questions about it are still waiting or forming. */
export const describingOf = former(
  "the descriptions and labels of (file)",
  ({ file }, { descriptionPrompt, answer, stage, reason, labelPrompt, labelStage, labelReason, label, openPrompt, openStage }) =>
    form({
      descriptions: each(Reasoning._about({ subject: file }).is({ prompt: descriptionPrompt, ask: DESCRIPTION_ASK, answer, stage }))
        .where(whether(Reasoning._reason({ prompt: descriptionPrompt }).is({ reason })))
        .form({ answer, stage, reason }),
      labelQuestions: each(Reasoning._about({ subject: file }).is({ prompt: labelPrompt, ask: LABELS_ASK, stage: labelStage }))
        .where(whether(Reasoning._reason({ prompt: labelPrompt }).is({ reason: labelReason })))
        .form({ stage: labelStage, reason: labelReason }),
      labels: each(Labeling._labels({ item: file }).is({ name: label })).distinct(label),
      openQuestions: each(Reasoning._about({ subject: file }).is({ prompt: openPrompt, stage: openStage }))
        .where(is.among(openStage, ["WAITING", "FORMING"]))
        .count(),
    }),
);

export const composition = {
  choosing: { describingOn, describingSetting, TurnOn, TurnOff, AbandonWhenTurnedOff },
  asking: { hasOpenQuestion, AskForDescription, AskForLabels, DescribeAgain, SuggestLabelsAgain },
  reading: { ReadFile },
  applying: { LabelFromAnswer },
  forgetting: { ForgetQuestionsOfDeleted },
  showing: { describingOf },
};
