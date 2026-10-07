# Authenticating

## Purpose

Let people come back to the same account by proving who they are.

*Prevents:* someone signs in as another person; two people end up with the same username.

## Principle

Maya registers with the username `maya` and a password. The next day she authenticates with the same username and password, and Authenticating returns the same user as before. Sam tries to register `maya` too, and is refused because the username is taken. When he tries to authenticate as `maya` with a guessed password, he is refused with "The username or password is incorrect.", the same refusal as for a username nobody has.

## Types

```types
opaque Secret
  A password verifier derived with a random salt; the implementer chooses how to represent it.
```

## State

```state
a set of Users with
  a unique username String
  a verifier Secret

Rule: Authenticating stores only a verifier derived from the password, never the password itself.
```

## Actions

```actions
register(username: String, password: String) : returns (user: User)
  where username is not 3 to 32 ASCII letters, digits, underscores, or hyphens
  then
    refuses INVALID_USERNAME "A username must have 3 to 32 letters, digits, underscores, or hyphens."
  where password is shorter than 8 or longer than 128 characters
  then
    refuses INVALID_PASSWORD "A password must have 8 to 128 characters."
  where some user has username
  then
    refuses USERNAME_TAKEN "That username is taken."
  where username and password are accepted and no user has username
  then
    add a new user with username and a verifier derived from password
    returns user

authenticate(username: String, password: String) : returns (user: User)
  where no user has username, or password does not match its verifier
  then
    refuses INVALID_CREDENTIALS "The username or password is incorrect."
  where some user has username and password matches its verifier
  then
    returns user
```

## Queries

```queries
_byUsername(username: String) : optional (user: User)
  Returns the user with exactly this username.

_username(user: User) : optional (username: String)
  Returns the user's username.
```
