import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, view, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { owns } from "./access.ts";
import { textInput } from "./reusable/inputs.ts";

const { Authenticating, Sessioning, Sharing, Storing } = concepts;

const Share = endpoint(
  "/files/share",
  ({ session, file, username, user, recipient }) =>
    receive({ session, file, username })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(
          owns({ user, file }),
          Authenticating._byUsername({ username }).is({ user: recipient }),
          Authenticating._byUsername({ username }).is.not({ user }),
        )
          .then(Sharing.share({ item: file, recipient }).responds({}))
          .then(respond({ file, recipient }))
          .named("shared"),
        where(owns({ user, file }), Authenticating._byUsername({ username }).is({ user }))
          .then(respond({ error: "SHARING_WITH_YOURSELF" }))
          .named("yourself"),
        where(owns({ user, file }), no(Authenticating._byUsername({ username })))
          .then(respond({ error: "USER_NOT_FOUND" }))
          .named("no-such-user"),
        where(no(owns({ user, file })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

const Revoke = endpoint(
  "/files/revoke",
  ({ session, file, recipient, user }) =>
    receive({ session, file, recipient })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(owns({ user, file }))
          .then(Sharing.revoke({ item: file, recipient }).responds({}))
          .then(respond({ file, recipient }))
          .named("owner"),
        where(no(owns({ user, file })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

/** The people (user) has shared a file with, and the people who have shared a file with (user). */
const sharesFilesWith = view(
  "(user) shares files with (person)",
  ({ user }, { person }, { file }) => [
    where(
      Storing._uploadedBy({ uploader: user }).is({ file }),
      Sharing._recipients({ item: file }).is({ recipient: person }),
    ),
    where(
      Sharing._sharedWith({ recipient: user }).is({ item: file }),
      Storing._get({ file }).is({ uploader: person }),
    ),
  ],
);

/** The people to suggest when (user) shares a file, with their usernames. */
const people = former(
  "the people (user) shares files with",
  ({ user }, { person, username }) =>
    each(sharesFilesWith({ user }).is({ person }))
      .where(Authenticating._username({ user: person }).is({ username }))
      .form({ person, username }),
);

const ShowPeople = endpoint(
  "/people",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(respond({ people: people({ user }) })),
  { validators: { input: textInput } },
);

export const composition = {
  granting: { Share },
  revoking: { Revoke },
  suggesting: { ShowPeople, sharesFilesWith, people },
};
