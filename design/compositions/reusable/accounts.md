# Accounts

`Authenticating.authenticate` checks a username and password, and `Sessioning.use` returns a session's user on each request. Neither concept refers to the other. These endpoints call both, so every session they start belongs to the user who has just registered or signed in. An app with those two concepts can copy this composition unchanged; the frontend calls it through `frontend/src/reusable/session.ts` and `SignIn.vue`.

The [register endpoint](reaction:reusable.accounts.entering.Register) creates an account with Authenticating, then starts a session for it with Sessioning, in one request. The [sign-in endpoint](reaction:reusable.accounts.entering.SignIn) checks the password with Authenticating, then starts a new session. Each responds with the user, the username, the session, and its expiry, and the HTTP server moves the session into a cookie that the page's scripts can't read, as the cookie policy in `src/host/http.ts` declares. A taken username or a wrong password is refused, and the endpoint responds with that refusal.

```endpoints
reusable.accounts.entering.Register at /auth/register
reusable.accounts.entering.SignIn at /auth/login
```

The [me endpoint](reaction:reusable.accounts.identifying.Me) passes the session to `Sessioning.use`, which returns the user, then responds with the user's username from Authenticating. Every endpoint that requires a session starts the same way: `Sessioning.use` returns the session's user, or the request is refused with `NOT_SIGNED_IN`. Each endpoint reads the user from the session, never from the request's inputs.

```endpoints
reusable.accounts.identifying.Me at /auth/me
```

The [sign-out endpoint](reaction:reusable.accounts.leaving.SignOut) ends the session with Sessioning, and the HTTP server clears the cookie. If the person is also signed in on another computer, they stay signed in there.

```endpoints
reusable.accounts.leaving.SignOut at /auth/logout
```
