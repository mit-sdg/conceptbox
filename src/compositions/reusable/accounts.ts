import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../../concepts.ts";
import { textInput } from "./inputs.ts";

const { Authenticating, Sessioning } = concepts;

const Register = endpoint(
  "/auth/register",
  ({ username, password, user, session, expiresAt }) =>
    receive({ username, password })
      .then(Authenticating.register({ username, password }).responds({ user }))
      .then(Sessioning.start({ subject: user }).responds({ session, expiresAt }))
      .then(respond({ user, username, session, expiresAt })),
  { validators: { input: textInput } },
);

const SignIn = endpoint(
  "/auth/login",
  ({ username, password, user, session, expiresAt }) =>
    receive({ username, password })
      .then(Authenticating.authenticate({ username, password }).responds({ user }))
      .then(Sessioning.start({ subject: user }).responds({ session, expiresAt }))
      .then(respond({ user, username, session, expiresAt })),
  { validators: { input: textInput } },
);

const Me = endpoint(
  "/auth/me",
  ({ session, user, username }) =>
    receive({ session })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(Authenticating._username({ user }).is({ username })).then(respond({ username })),
      ),
  { validators: { input: textInput } },
);

const SignOut = endpoint(
  "/auth/logout",
  ({ session }) =>
    receive({ session })
      .then(Sessioning.end({ session }).responds({}))
      .then(respond({})),
  { validators: { input: textInput } },
);

export const composition = {
  entering: { Register, SignIn },
  identifying: { Me },
  leaving: { SignOut },
};
