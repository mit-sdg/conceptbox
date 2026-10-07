import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { owns } from "./access.ts";
import { textInput } from "./reusable/inputs.ts";

const { Labeling, Sessioning, Storing, Trashing } = concepts;

const RemoveLabel = endpoint(
  "/files/unlabel",
  ({ session, file, label, user }) =>
    receive({ session, file, label })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(owns({ user, file }))
          .then(Labeling.remove({ item: file, name: label }).responds({}))
          .then(respond({ file }))
          .named("owner"),
        where(no(owns({ user, file })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

/** My files labeled (label), newest first, except the ones in the trash. */
const myFilesLabeled = former(
  "the files (user) uploaded and labeled (label)",
  ({ user, label }, { file, name, size, uploadedAt }) =>
    each(Storing._uploadedBy({ uploader: user }).is({ file, name, size, uploadedAt }))
      .where(no(Trashing._trashed({ item: file })), Labeling._labeled({ name: label }).is({ item: file }))
      .form({ file, name, size, uploadedAt }),
);

const FindByLabel = endpoint(
  "/files/labeled",
  ({ session, label, user }) =>
    receive({ session, label })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(respond({ labeled: myFilesLabeled({ user, label }) })),
  { validators: { input: textInput } },
);

const RemoveLabelsOfDeleted = reaction(({ file, label }) =>
  when(Storing.delete({ file }).responds({}))
    .where(Labeling._labels({ item: file }).is({ name: label }))
    .then(Labeling.remove({ item: file, name: label })),
);

export const composition = {
  correcting: { RemoveLabel },
  finding: { myFilesLabeled, FindByLabel },
  deleting: { RemoveLabelsOfDeleted },
};
