import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { no, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { canRead } from "./access.ts";
import { textInput } from "./reusable/inputs.ts";

const { Sessioning, Storing, Sharing } = concepts;

const StartUpload = endpoint(
  "/files/start",
  ({ session, name, mediaType, user, file, uploadUrl }) =>
    receive({ session, name, mediaType })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(Storing.start({ uploader: user, name, mediaType }).responds({ file, uploadUrl }))
      .then(respond({ file, uploadUrl })),
  { validators: { input: textInput } },
);

const FinishUpload = endpoint(
  "/files/finish",
  ({ session, file, user }) =>
    receive({ session, file })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(Storing.finish({ file, uploader: user }).responds({}))
      .then(respond({ file })),
  { validators: { input: textInput } },
);

const DeleteOversized = reaction(({ file }) =>
  when(Storing.finish({ file }).refuses({ error: "TOO_LARGE" })).then(Storing.delete({ file })),
);

const Download = endpoint(
  "/files/download",
  ({ session, file, user, url }) =>
    receive({ session, file })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(canRead({ user, file }), Storing._download({ file }).is({ url }))
          .then(respond({ url }))
          .named("readable"),
        where(no(canRead({ user, file })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

const View = endpoint(
  "/files/view",
  ({ session, file, user, url }) =>
    receive({ session, file })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(canRead({ user, file }), Storing._view({ file }).is({ url }))
          .then(respond({ url }))
          .named("image"),
        where(canRead({ user, file }), no(Storing._view({ file })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("not-an-image"),
        where(no(canRead({ user, file })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

const RevokeSharesOfDeleted = reaction(({ file, recipient }) =>
  when(Storing.delete({ file }).responds({}))
    .where(Sharing._recipients({ item: file }).is({ recipient }))
    .then(Sharing.revoke({ item: file, recipient })),
);

export const composition = {
  uploading: { StartUpload, FinishUpload, DeleteOversized },
  downloading: { Download, View },
  deleting: { RevokeSharesOfDeleted },
};
