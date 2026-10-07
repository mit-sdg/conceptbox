<!-- Generated from the ConceptBox assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# ConceptBox — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Authenticating

Defined in [Authenticating](../design/concepts/Authenticating.md), line 1.

#### Actions

- `register(username: String, password: String) : returns (user: User)`
  - Refuses `INVALID_USERNAME`: A username must have 3 to 32 letters, digits, underscores, or hyphens.
  - Refuses `INVALID_PASSWORD`: A password must have 8 to 128 characters.
  - Refuses `USERNAME_TAKEN`: That username is taken.
- `authenticate(username: String, password: String) : returns (user: User)`
  - Refuses `INVALID_CREDENTIALS`: The username or password is incorrect.

#### Queries

- `_byUsername(username: String) : optional (user: User)`
- `_username(user: User) : optional (username: String)`

#### Instances

- `Authenticating` — instance of `Authenticating` — [ConceptBox types](../design/types.md), line 6.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `use(session: Session) : returns (subject: Subject)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.
- `end(session: Session) : returns (session: Session)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.

#### Instances

- `Sessioning` — instance of `Sessioning` — [ConceptBox types](../design/types.md), line 8.
  - `Subject` is `Authenticating.User` — [ConceptBox types](../design/types.md), line 9.

### Sharing

Defined in [Sharing](../design/concepts/Sharing.md), line 1.

#### Actions

- `share(item: Item, recipient: Person) : returns (item: Item, recipient: Person)`
  - Refuses `ALREADY_SHARED`: This is already shared with that person.
- `revoke(item: Item, recipient: Person) : returns (item: Item, recipient: Person)`
  - Refuses `NOT_SHARED`: This is not shared with that person.

#### Queries

- `_recipients(item: Item) : many (recipient: Person)`
- `_sharedWith(recipient: Person) : many (item: Item)`

#### Instances

- `Sharing` — instance of `Sharing` — [ConceptBox types](../design/types.md), line 14.
  - `Item` is `Storing.File` — [ConceptBox types](../design/types.md), line 15.
  - `Person` is `Authenticating.User` — [ConceptBox types](../design/types.md), line 16.

### Storing

Defined in [Storing](../design/concepts/Storing.md), line 1.

#### Actions

- `start(uploader: Uploader, name: String, mediaType: String) : returns (file: File, uploadUrl: String)`
  - Refuses `INVALID_NAME`: A file name must have 1 to 255 characters.
- `finish(file: File, uploader: Uploader) : returns (file: File)`
  - Refuses `FILE_NOT_FOUND`: There is no such file.
  - Refuses `ALREADY_FINISHED`: This upload is already finished.
  - Refuses `NOT_UPLOADED`: The file's bytes have not arrived.
  - Refuses `TOO_LARGE`: A file may be at most 25 MB.
- `delete(file: File) : returns (file: File)`
  - Refuses `FILE_NOT_FOUND`: There is no such file.

#### Queries

- `_uploadedBy(uploader: Uploader) : many (file: File, name: String, size: Number, uploadedAt: DateTime)`
- `_get(file: File) : optional (uploader: Uploader, name: String, mediaType: String, size: Number, uploadedAt: DateTime)`
- `_download(file: File) : optional (url: String)`
- `_view(file: File) : optional (url: String)`

#### Instances

- `Storing` — instance of `Storing` — [ConceptBox types](../design/types.md), line 11.
  - `Uploader` is `Authenticating.User` — [ConceptBox types](../design/types.md), line 12.

### Trashing

Defined in [Trashing](../design/concepts/Trashing.md), line 1.

#### Actions

- `trash(item: Item) : returns (item: Item)`
  - Refuses `PURGED`: This was deleted for good.
  - Refuses `ALREADY_TRASHED`: This is already in the trash.
- `restore(item: Item) : returns (item: Item)`
  - Refuses `PURGED`: This was deleted for good.
  - Refuses `NOT_TRASHED`: This is not in the trash.
- `purge(item: Item) : returns (item: Item)`
  - Refuses `PURGED`: This was deleted for good.
  - Refuses `NOT_TRASHED`: This is not in the trash.

#### Queries

- `_trashed(item: Item) : optional (trashedAt: DateTime)`

#### Instances

- `Trashing` — instance of `Trashing` — [ConceptBox types](../design/types.md), line 18.
  - `Item` is `Storing.File` — [ConceptBox types](../design/types.md), line 19.

## Views

_Views name reusable conditions. Multiple `where` blocks are alternatives._

### (user) owns (file)

Authored path: `access.permissions.owns`.
- Covered by [Access](../design/compositions/access.md), line 5.

```view
(user) owns (file) — inputs (user, file); outputs (); bindings ()
  where Storing._get (file) has (uploader: user)
```

### (user) can read (file)

Authored path: `access.permissions.canRead`.
- Covered by [Access](../design/compositions/access.md), line 7.

```view
(user) can read (file) — inputs (user, file); outputs (); bindings ()
  where view "(user) owns (file)" with (file, user)
  where
    Storing._get (file)
    Sharing._recipients (item: file) has (recipient: user)
    no Trashing._trashed (item: file)
```

### (user) shares files with (person)

Authored path: `shares.suggesting.sharesFilesWith`.
- Covered by [Shares](../design/compositions/shares.md), line 15.

```view
(user) shares files with (person) — inputs (user); outputs (person); bindings (file) — answers any number of (person)
  where
    Storing._uploadedBy (uploader: user) has (file)
    Sharing._recipients (item: file) has (recipient: person)
  where
    Sharing._sharedWith (recipient: user) has (item: file)
    Storing._get (file) has (uploader: person)
```

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### the files (user) uploaded and hasn't trashed

Authored path: `box.showing.myFiles`.
- Covered by [Box](../design/compositions/box.md), line 5.

```former
Former "the files (user) uploaded and hasn't trashed" — inputs (user); bindings (file, name, mediaType, size, uploadedAt, recipient, username); promises exactly one record — forms:
  each Storing._uploadedBy (uploader: user) has (file, name, size, uploadedAt)
    where no Trashing._trashed (item: file)
    where Storing._get (file) has (mediaType)
    form a record of
      file
      mediaType
      name
      sharedWith: each Sharing._recipients (item: file) has (recipient)
        where Authenticating._username (user: recipient) has (username)
        form a record of
          recipient
          username
      size
      uploadedAt
```

### the files shared with (user)

Authored path: `box.showing.sharedWithMe`.
- Covered by [Box](../design/compositions/box.md), line 7.

```former
Former "the files shared with (user)" — inputs (user); bindings (file, name, mediaType, size, uploadedAt, owner, ownerName); promises exactly one record — forms:
  each Sharing._sharedWith (recipient: user) has (item: file)
    where view "(user) can read (file)" with (file, user)
    where Storing._get (file) has (mediaType, name, size, uploadedAt, uploader: owner)
    where Authenticating._username (user: owner) has (username: ownerName)
    form a record of
      file
      mediaType
      name
      ownerName
      size
      uploadedAt
```

### the people (user) shares files with

Authored path: `shares.suggesting.people`.
- Covered by [Shares](../design/compositions/shares.md), line 15.

```former
Former "the people (user) shares files with" — inputs (user); bindings (person, username); promises exactly one record — forms:
  each view "(user) shares files with (person)" with (user) has (person)
    where Authenticating._username (user: person) has (username)
    form a record of
      person
      username
```

### the trash of (user)

Authored path: `trash.listing.myTrash`.
- Covered by [Trash](../design/compositions/trash.md), line 15.

```former
Former "the trash of (user)" — inputs (user); bindings (file, name, size, trashedAt); promises exactly one record — forms:
  each Storing._uploadedBy (uploader: user) has (file, name, size)
    where Trashing._trashed (item: file) has (trashedAt)
    arranged by trashedAt, descending
    form a record of
      file
      name
      size
      trashedAt
```

## Reactions

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### box.showing.ShowBox

Authored path: `box.showing.ShowBox`.
- Covered by [Box](../design/compositions/box.md), line 3.
- Covered by [Box](../design/compositions/box.md), line 10.

```reaction
when RequestBoundary.request (path: "/box", requestId, session)
then
  Sessioning.use (session)
```

### box.showing.ShowBox#2

Authored path: `box.showing.ShowBox`.
- Covered by [Box](../design/compositions/box.md), line 3.
- Covered by [Box](../design/compositions/box.md), line 10.

```reaction
when Sessioning.use (session, subject: user), asked by box.showing.ShowBox
where
  earlier, RequestBoundary.request (path: "/box", requestId, session)
then
  RequestBoundary.respond (myFiles: former "the files (user) uploaded and hasn't trashed" with (user), myTrash: former "the trash of (user)" with (user), requestId, sharedWithMe: former "the files shared with (user)" with (user))
```

### files.deleting.RevokeSharesOfDeleted

Authored path: `files.deleting.RevokeSharesOfDeleted`.
- Covered by [Files](../design/compositions/files.md), line 24.

```reaction
when Storing.delete (file)
where
  Sharing._recipients (item: file) has (recipient)
then
  Sharing.revoke (item: file, recipient)
```

### files.downloading.Download

Authored path: `files.downloading.Download`.
- Covered by [Files](../design/compositions/files.md), line 12.
- Covered by [Files](../design/compositions/files.md), line 15.

```reaction
when RequestBoundary.request (file, path: "/files/download", requestId, session)
then
  Sessioning.use (session)
```

### files.downloading.Download:readable#2

Authored path: `files.downloading.Download`.
- Covered by [Files](../design/compositions/files.md), line 12.
- Covered by [Files](../design/compositions/files.md), line 15.

```reaction
when Sessioning.use (session, subject: user), asked by files.downloading.Download
where
  earlier, RequestBoundary.request (file, path: "/files/download", requestId, session)
  view "(user) can read (file)" with (file, user)
  Storing._download (file) has (url)
then
  RequestBoundary.respond (requestId, url)
```

### files.downloading.Download:refused#2

Authored path: `files.downloading.Download`.
- Covered by [Files](../design/compositions/files.md), line 12.
- Covered by [Files](../design/compositions/files.md), line 15.

```reaction
when Sessioning.use (session, subject: user), asked by files.downloading.Download
where
  earlier, RequestBoundary.request (file, path: "/files/download", requestId, session)
  no view "(user) can read (file)" with (file, user)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### files.downloading.View

Authored path: `files.downloading.View`.
- Covered by [Files](../design/compositions/files.md), line 18.
- Covered by [Files](../design/compositions/files.md), line 21.

```reaction
when RequestBoundary.request (file, path: "/files/view", requestId, session)
then
  Sessioning.use (session)
```

### files.downloading.View:image#2

Authored path: `files.downloading.View`.
- Covered by [Files](../design/compositions/files.md), line 18.
- Covered by [Files](../design/compositions/files.md), line 21.

```reaction
when Sessioning.use (session, subject: user), asked by files.downloading.View
where
  earlier, RequestBoundary.request (file, path: "/files/view", requestId, session)
  view "(user) can read (file)" with (file, user)
  Storing._view (file) has (url)
then
  RequestBoundary.respond (requestId, url)
```

### files.downloading.View:not-an-image#2

Authored path: `files.downloading.View`.
- Covered by [Files](../design/compositions/files.md), line 18.
- Covered by [Files](../design/compositions/files.md), line 21.

```reaction
when Sessioning.use (session, subject: user), asked by files.downloading.View
where
  earlier, RequestBoundary.request (file, path: "/files/view", requestId, session)
  view "(user) can read (file)" with (file, user)
  no Storing._view (file)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### files.downloading.View:refused#2

Authored path: `files.downloading.View`.
- Covered by [Files](../design/compositions/files.md), line 18.
- Covered by [Files](../design/compositions/files.md), line 21.

```reaction
when Sessioning.use (session, subject: user), asked by files.downloading.View
where
  earlier, RequestBoundary.request (file, path: "/files/view", requestId, session)
  no view "(user) can read (file)" with (file, user)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### files.uploading.DeleteOversized

Authored path: `files.uploading.DeleteOversized`.
- Covered by [Files](../design/compositions/files.md), line 5.

```reaction
when refused Storing.finish (file, error: "TOO_LARGE")
then
  Storing.delete (file)
```

### files.uploading.FinishUpload

Authored path: `files.uploading.FinishUpload`.
- Covered by [Files](../design/compositions/files.md), line 5.
- Covered by [Files](../design/compositions/files.md), line 9.

```reaction
when RequestBoundary.request (file, path: "/files/finish", requestId, session)
then
  Sessioning.use (session)
```

### files.uploading.FinishUpload#2

Authored path: `files.uploading.FinishUpload`.
- Covered by [Files](../design/compositions/files.md), line 5.
- Covered by [Files](../design/compositions/files.md), line 9.

```reaction
when Sessioning.use (session, subject: user), asked by files.uploading.FinishUpload
where
  earlier, RequestBoundary.request (file, path: "/files/finish", requestId, session)
then
  Storing.finish (file, uploader: user)
```

### files.uploading.FinishUpload#3

Authored path: `files.uploading.FinishUpload`.
- Covered by [Files](../design/compositions/files.md), line 5.
- Covered by [Files](../design/compositions/files.md), line 9.

```reaction
when Storing.finish (file, uploader: user), asked by files.uploading.FinishUpload#2
where
  earlier, RequestBoundary.request (file, path: "/files/finish", requestId, session)
then
  RequestBoundary.respond (file, requestId)
```

### files.uploading.StartUpload

Authored path: `files.uploading.StartUpload`.
- Covered by [Files](../design/compositions/files.md), line 5.
- Covered by [Files](../design/compositions/files.md), line 8.

```reaction
when RequestBoundary.request (mediaType, name, path: "/files/start", requestId, session)
then
  Sessioning.use (session)
```

### files.uploading.StartUpload#2

Authored path: `files.uploading.StartUpload`.
- Covered by [Files](../design/compositions/files.md), line 5.
- Covered by [Files](../design/compositions/files.md), line 8.

```reaction
when Sessioning.use (session, subject: user), asked by files.uploading.StartUpload
where
  earlier, RequestBoundary.request (mediaType, name, path: "/files/start", requestId, session)
then
  Storing.start (mediaType, name, uploader: user)
```

### files.uploading.StartUpload#3

Authored path: `files.uploading.StartUpload`.
- Covered by [Files](../design/compositions/files.md), line 5.
- Covered by [Files](../design/compositions/files.md), line 8.

```reaction
when Storing.start (mediaType, name, uploader: user, file, uploadUrl), asked by files.uploading.StartUpload#2
where
  earlier, RequestBoundary.request (mediaType, name, path: "/files/start", requestId, session)
then
  RequestBoundary.respond (file, requestId, uploadUrl)
```

### reusable.accounts.entering.Register

Authored path: `reusable.accounts.entering.Register`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 8.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  Authenticating.register (password, username)
```

### reusable.accounts.entering.Register#2

Authored path: `reusable.accounts.entering.Register`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 8.

```reaction
when Authenticating.register (password, username, user), asked by reusable.accounts.entering.Register
then
  Sessioning.start (subject: user)
```

### reusable.accounts.entering.Register#3

Authored path: `reusable.accounts.entering.Register`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 8.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.accounts.entering.Register#2
where
  earlier, Authenticating.register (password, username, user), asked by reusable.accounts.entering.Register
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, user, username)
```

### reusable.accounts.entering.SignIn

Authored path: `reusable.accounts.entering.SignIn`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 9.

```reaction
when RequestBoundary.request (password, path: "/auth/login", requestId, username)
then
  Authenticating.authenticate (password, username)
```

### reusable.accounts.entering.SignIn#2

Authored path: `reusable.accounts.entering.SignIn`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 9.

```reaction
when Authenticating.authenticate (password, username, user), asked by reusable.accounts.entering.SignIn
then
  Sessioning.start (subject: user)
```

### reusable.accounts.entering.SignIn#3

Authored path: `reusable.accounts.entering.SignIn`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 5.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 9.

```reaction
when Sessioning.start (subject: user, expiresAt, session), asked by reusable.accounts.entering.SignIn#2
where
  earlier, Authenticating.authenticate (password, username, user), asked by reusable.accounts.entering.SignIn
  earlier, RequestBoundary.request (password, path: "/auth/login", requestId, username)
then
  RequestBoundary.respond (expiresAt, requestId, session, user, username)
```

### reusable.accounts.identifying.Me

Authored path: `reusable.accounts.identifying.Me`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 12.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 15.

```reaction
when RequestBoundary.request (path: "/auth/me", requestId, session)
then
  Sessioning.use (session)
```

### reusable.accounts.identifying.Me#2

Authored path: `reusable.accounts.identifying.Me`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 12.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 15.

```reaction
when Sessioning.use (session, subject: user), asked by reusable.accounts.identifying.Me
where
  Authenticating._username (user) has (username)
  earlier, RequestBoundary.request (path: "/auth/me", requestId, session)
then
  RequestBoundary.respond (requestId, username)
```

### reusable.accounts.leaving.SignOut

Authored path: `reusable.accounts.leaving.SignOut`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 18.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 21.

```reaction
when RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  Sessioning.end (session)
```

### reusable.accounts.leaving.SignOut#2

Authored path: `reusable.accounts.leaving.SignOut`.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 18.
- Covered by [Accounts](../design/compositions/reusable/accounts.md), line 21.

```reaction
when Sessioning.end (session), asked by reusable.accounts.leaving.SignOut
where
  earlier, RequestBoundary.request (path: "/auth/logout", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### shares.granting.Share

Authored path: `shares.granting.Share`.
- Covered by [Shares](../design/compositions/shares.md), line 3.
- Covered by [Shares](../design/compositions/shares.md), line 6.

```reaction
when RequestBoundary.request (file, path: "/files/share", requestId, session, username)
then
  Sessioning.use (session)
```

### shares.granting.Share:no-such-user#2

Authored path: `shares.granting.Share`.
- Covered by [Shares](../design/compositions/shares.md), line 3.
- Covered by [Shares](../design/compositions/shares.md), line 6.

```reaction
when Sessioning.use (session, subject: user), asked by shares.granting.Share
where
  earlier, RequestBoundary.request (file, path: "/files/share", requestId, session, username)
  view "(user) owns (file)" with (file, user)
  no Authenticating._byUsername (username)
then
  RequestBoundary.respond (error: "USER_NOT_FOUND", requestId)
```

### shares.granting.Share:refused#2

Authored path: `shares.granting.Share`.
- Covered by [Shares](../design/compositions/shares.md), line 3.
- Covered by [Shares](../design/compositions/shares.md), line 6.

```reaction
when Sessioning.use (session, subject: user), asked by shares.granting.Share
where
  earlier, RequestBoundary.request (file, path: "/files/share", requestId, session, username)
  no view "(user) owns (file)" with (file, user)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### shares.granting.Share:shared#2

Authored path: `shares.granting.Share`.
- Covered by [Shares](../design/compositions/shares.md), line 3.
- Covered by [Shares](../design/compositions/shares.md), line 6.

```reaction
when Sessioning.use (session, subject: user), asked by shares.granting.Share
where
  earlier, RequestBoundary.request (file, path: "/files/share", requestId, session, username)
  view "(user) owns (file)" with (file, user)
  Authenticating._byUsername (username) has (user: recipient)
  Authenticating._byUsername (username) and not (user)
then
  Sharing.share (item: file, recipient)
```

### shares.granting.Share:shared#3

Authored path: `shares.granting.Share`.
- Covered by [Shares](../design/compositions/shares.md), line 3.
- Covered by [Shares](../design/compositions/shares.md), line 6.

```reaction
when Sharing.share (item: file, recipient), asked by shares.granting.Share:shared#2
where
  earlier, RequestBoundary.request (file, path: "/files/share", requestId, session, username)
then
  RequestBoundary.respond (file, recipient, requestId)
```

### shares.granting.Share:yourself#2

Authored path: `shares.granting.Share`.
- Covered by [Shares](../design/compositions/shares.md), line 3.
- Covered by [Shares](../design/compositions/shares.md), line 6.

```reaction
when Sessioning.use (session, subject: user), asked by shares.granting.Share
where
  earlier, RequestBoundary.request (file, path: "/files/share", requestId, session, username)
  view "(user) owns (file)" with (file, user)
  Authenticating._byUsername (username) has (user)
then
  RequestBoundary.respond (error: "SHARING_WITH_YOURSELF", requestId)
```

### shares.revoking.Revoke

Authored path: `shares.revoking.Revoke`.
- Covered by [Shares](../design/compositions/shares.md), line 9.
- Covered by [Shares](../design/compositions/shares.md), line 12.

```reaction
when RequestBoundary.request (file, path: "/files/revoke", recipient, requestId, session)
then
  Sessioning.use (session)
```

### shares.revoking.Revoke:owner#2

Authored path: `shares.revoking.Revoke`.
- Covered by [Shares](../design/compositions/shares.md), line 9.
- Covered by [Shares](../design/compositions/shares.md), line 12.

```reaction
when Sessioning.use (session, subject: user), asked by shares.revoking.Revoke
where
  earlier, RequestBoundary.request (file, path: "/files/revoke", recipient, requestId, session)
  view "(user) owns (file)" with (file, user)
then
  Sharing.revoke (item: file, recipient)
```

### shares.revoking.Revoke:owner#3

Authored path: `shares.revoking.Revoke`.
- Covered by [Shares](../design/compositions/shares.md), line 9.
- Covered by [Shares](../design/compositions/shares.md), line 12.

```reaction
when Sharing.revoke (item: file, recipient), asked by shares.revoking.Revoke:owner#2
where
  earlier, RequestBoundary.request (file, path: "/files/revoke", recipient, requestId, session)
then
  RequestBoundary.respond (file, recipient, requestId)
```

### shares.revoking.Revoke:refused#2

Authored path: `shares.revoking.Revoke`.
- Covered by [Shares](../design/compositions/shares.md), line 9.
- Covered by [Shares](../design/compositions/shares.md), line 12.

```reaction
when Sessioning.use (session, subject: user), asked by shares.revoking.Revoke
where
  earlier, RequestBoundary.request (file, path: "/files/revoke", recipient, requestId, session)
  no view "(user) owns (file)" with (file, user)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### shares.suggesting.ShowPeople

Authored path: `shares.suggesting.ShowPeople`.
- Covered by [Shares](../design/compositions/shares.md), line 15.
- Covered by [Shares](../design/compositions/shares.md), line 18.

```reaction
when RequestBoundary.request (path: "/people", requestId, session)
then
  Sessioning.use (session)
```

### shares.suggesting.ShowPeople#2

Authored path: `shares.suggesting.ShowPeople`.
- Covered by [Shares](../design/compositions/shares.md), line 15.
- Covered by [Shares](../design/compositions/shares.md), line 18.

```reaction
when Sessioning.use (session, subject: user), asked by shares.suggesting.ShowPeople
where
  earlier, RequestBoundary.request (path: "/people", requestId, session)
then
  RequestBoundary.respond (people: former "the people (user) shares files with" with (user), requestId)
```

### trash.discarding.MoveToTrash

Authored path: `trash.discarding.MoveToTrash`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 8.

```reaction
when RequestBoundary.request (file, path: "/files/trash", requestId, session)
then
  Sessioning.use (session)
```

### trash.discarding.MoveToTrash:owner#2

Authored path: `trash.discarding.MoveToTrash`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 8.

```reaction
when Sessioning.use (session, subject: user), asked by trash.discarding.MoveToTrash
where
  earlier, RequestBoundary.request (file, path: "/files/trash", requestId, session)
  view "(user) owns (file)" with (file, user)
then
  Trashing.trash (item: file)
```

### trash.discarding.MoveToTrash:owner#3

Authored path: `trash.discarding.MoveToTrash`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 8.

```reaction
when Trashing.trash (item: file), asked by trash.discarding.MoveToTrash:owner#2
where
  earlier, RequestBoundary.request (file, path: "/files/trash", requestId, session)
then
  RequestBoundary.respond (file, requestId)
```

### trash.discarding.MoveToTrash:refused#2

Authored path: `trash.discarding.MoveToTrash`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 8.

```reaction
when Sessioning.use (session, subject: user), asked by trash.discarding.MoveToTrash
where
  earlier, RequestBoundary.request (file, path: "/files/trash", requestId, session)
  no view "(user) owns (file)" with (file, user)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### trash.discarding.Purge

Authored path: `trash.discarding.Purge`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 10.

```reaction
when RequestBoundary.request (file, path: "/files/purge", requestId, session)
then
  Sessioning.use (session)
```

### trash.discarding.Purge:not-trashed#2

Authored path: `trash.discarding.Purge`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 10.

```reaction
when Sessioning.use (session, subject: user), asked by trash.discarding.Purge
where
  earlier, RequestBoundary.request (file, path: "/files/purge", requestId, session)
  view "(user) owns (file)" with (file, user)
  no Trashing._trashed (item: file)
then
  RequestBoundary.respond (error: "NOT_TRASHED", requestId)
```

### trash.discarding.Purge:refused#2

Authored path: `trash.discarding.Purge`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 10.

```reaction
when Sessioning.use (session, subject: user), asked by trash.discarding.Purge
where
  earlier, RequestBoundary.request (file, path: "/files/purge", requestId, session)
  no view "(user) owns (file)" with (file, user)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### trash.discarding.Purge:trashed#2

Authored path: `trash.discarding.Purge`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 10.

```reaction
when Sessioning.use (session, subject: user), asked by trash.discarding.Purge
where
  earlier, RequestBoundary.request (file, path: "/files/purge", requestId, session)
  view "(user) owns (file)" with (file, user)
  Trashing._trashed (item: file)
then
  Storing.delete (file)
```

### trash.discarding.Purge:trashed#3

Authored path: `trash.discarding.Purge`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 10.

```reaction
when Storing.delete (file), asked by trash.discarding.Purge:trashed#2
where
  earlier, RequestBoundary.request (file, path: "/files/purge", requestId, session)
then
  RequestBoundary.respond (file, requestId)
```

### trash.discarding.RecordPurge

Authored path: `trash.discarding.RecordPurge`.
- Covered by [Trash](../design/compositions/trash.md), line 13.

```reaction
when Storing.delete (file)
where
  Trashing._trashed (item: file)
then
  Trashing.purge (item: file)
```

### trash.restoring.Restore

Authored path: `trash.restoring.Restore`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 9.

```reaction
when RequestBoundary.request (file, path: "/files/restore", requestId, session)
then
  Sessioning.use (session)
```

### trash.restoring.Restore:owner#2

Authored path: `trash.restoring.Restore`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 9.

```reaction
when Sessioning.use (session, subject: user), asked by trash.restoring.Restore
where
  earlier, RequestBoundary.request (file, path: "/files/restore", requestId, session)
  view "(user) owns (file)" with (file, user)
then
  Trashing.restore (item: file)
```

### trash.restoring.Restore:owner#3

Authored path: `trash.restoring.Restore`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 9.

```reaction
when Trashing.restore (item: file), asked by trash.restoring.Restore:owner#2
where
  earlier, RequestBoundary.request (file, path: "/files/restore", requestId, session)
then
  RequestBoundary.respond (file, requestId)
```

### trash.restoring.Restore:refused#2

Authored path: `trash.restoring.Restore`.
- Covered by [Trash](../design/compositions/trash.md), line 5.
- Covered by [Trash](../design/compositions/trash.md), line 9.

```reaction
when Sessioning.use (session, subject: user), asked by trash.restoring.Restore
where
  earlier, RequestBoundary.request (file, path: "/files/restore", requestId, session)
  no view "(user) owns (file)" with (file, user)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auth/login` — requires `password`, `username`
- `/auth/logout` — requires `session`
- `/auth/me` — requires `session`
- `/auth/register` — requires `password`, `username`
- `/box` — requires `session`
- `/files/download` — requires `file`, `session`
- `/files/finish` — requires `file`, `session`
- `/files/purge` — requires `file`, `session`
- `/files/restore` — requires `file`, `session`
- `/files/revoke` — requires `file`, `recipient`, `session`
- `/files/share` — requires `file`, `session`, `username`
- `/files/start` — requires `mediaType`, `name`, `session`
- `/files/trash` — requires `file`, `session`
- `/files/view` — requires `file`, `session`
- `/people` — requires `session`
