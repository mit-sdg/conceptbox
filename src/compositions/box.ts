import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { canRead } from "./access.ts";
import { textInput } from "./reusable/inputs.ts";

const { Authenticating, Sessioning, Sharing, Storing } = concepts;

/** The files I uploaded, newest first, with the people I shared each one with. */
const myFiles = former(
  "the files (user) uploaded",
  ({ user }, { file, name, mediaType, size, uploadedAt, recipient, username }) =>
    each(Storing._uploadedBy({ uploader: user }).is({ file, name, size, uploadedAt }))
      .where(Storing._get({ file }).is({ mediaType }))
      .form({
        file,
        name,
        mediaType,
        size,
        uploadedAt,
        sharedWith: each(Sharing._recipients({ item: file }).is({ recipient }))
          .where(Authenticating._username({ user: recipient }).is({ username }))
          .form({ recipient, username }),
      }),
);

/** The files other people shared with me that I can read, with who uploaded each. */
const sharedWithMe = former(
  "the files shared with (user)",
  ({ user }, { file, name, mediaType, size, uploadedAt, owner, ownerName }) =>
    each(Sharing._sharedWith({ recipient: user }).is({ item: file }))
      .where(
        canRead({ user, file }),
        Storing._get({ file }).is({ uploader: owner, name, mediaType, size, uploadedAt }),
        Authenticating._username({ user: owner }).is({ username: ownerName }),
      )
      .form({ file, name, mediaType, size, uploadedAt, ownerName }),
);

const ShowBox = endpoint(
  "/box",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(respond({ myFiles: myFiles({ user }), sharedWithMe: sharedWithMe({ user }) })),
  { validators: { input: textInput } },
);

export const composition = {
  showing: { ShowBox, myFiles, sharedWithMe },
};
