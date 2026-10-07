import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { owns } from "./access.ts";
import { textInput } from "./reusable/inputs.ts";

const { Sessioning, Storing, Trashing } = concepts;

const MoveToTrash = endpoint(
  "/files/trash",
  ({ session, file, user }) =>
    receive({ session, file })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(owns({ user, file }))
          .then(Trashing.trash({ item: file }).responds({}))
          .then(respond({ file }))
          .named("owner"),
        where(no(owns({ user, file })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

const Restore = endpoint(
  "/files/restore",
  ({ session, file, user }) =>
    receive({ session, file })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(owns({ user, file }))
          .then(Trashing.restore({ item: file }).responds({}))
          .then(respond({ file }))
          .named("owner"),
        where(no(owns({ user, file })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

const Purge = endpoint(
  "/files/purge",
  ({ session, file, user }) =>
    receive({ session, file })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(owns({ user, file }), Trashing._trashed({ item: file }))
          .then(Storing.delete({ file }).responds({}))
          .then(respond({ file }))
          .named("trashed"),
        where(owns({ user, file }), no(Trashing._trashed({ item: file })))
          .then(respond({ error: "NOT_TRASHED" }))
          .named("not-trashed"),
        where(no(owns({ user, file })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

const RecordPurge = reaction(({ file }) =>
  when(Storing.delete({ file }).responds({}))
    .where(Trashing._trashed({ item: file }))
    .then(Trashing.purge({ item: file })),
);

/** The files I moved to the trash, most recent first. */
export const myTrash = former("the trash of (user)", ({ user }, { file, name, size, trashedAt }) =>
  each(Storing._uploadedBy({ uploader: user }).is({ file, name, size }))
    .where(Trashing._trashed({ item: file }).is({ trashedAt }))
    .arranged(trashedAt, "descending")
    .form({ file, name, size, trashedAt }),
);

export const composition = {
  discarding: { MoveToTrash, Purge, RecordPurge },
  restoring: { Restore },
  listing: { myTrash },
};
