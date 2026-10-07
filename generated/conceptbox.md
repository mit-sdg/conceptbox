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

- `Authenticating` — instance of `Authenticating` — [ConceptBox types](../design/types.md), line 16.

### Consenting

Defined in [Consenting](../design/concepts/Consenting.md), line 1.

#### Actions

- `consent(person: Person, use: Use) : returns (person: Person, use: Use)`
  - Refuses `ALREADY_CONSENTED`: You have already consented to this.
- `withdraw(person: Person, use: Use) : returns (person: Person, use: Use)`
  - Refuses `NOT_CONSENTED`: You haven't consented to this.

#### Queries

- `_consented(person: Person, use: Use) : one (consented: Flag)`

#### Instances

- `Consenting` — instance of `Consenting` — [ConceptBox types](../design/types.md), line 41.
  - `Person` is `Authenticating.User` — [ConceptBox types](../design/types.md), line 42.
  - `Use` is `Feature` — [ConceptBox types](../design/types.md), line 43.

### Labeling

Defined in [Labeling](../design/concepts/Labeling.md), line 1.

#### Actions

- `label(item: Item, name: String) : returns (item: Item)`
  - Refuses `INVALID_LABEL`: A label must have 1 to 40 characters.
  - Refuses `ALREADY_LABELED`: This already has that label.
- `remove(item: Item, name: String) : returns (item: Item)`
  - Refuses `NOT_LABELED`: This doesn't have that label.

#### Queries

- `_labels(item: Item) : many (name: String)`
- `_labeled(name: String) : many (item: Item)`

#### Instances

- `Labeling` — instance of `Labeling` — [ConceptBox types](../design/types.md), line 34.
  - `Item` is `Storing.File` — [ConceptBox types](../design/types.md), line 35.

### Reasoning

Defined in [Reasoning](../design/concepts/Reasoning.md), line 1.

#### Actions

- `prompt(subject: Subject, ask: String) : returns (prompt: Prompt)`
  - Refuses `NOTHING_ASKED`: The question is blank.
- `take(prompt: Prompt, reasoner: Reasoner) : returns (prompt: Prompt)`
  - Refuses `UNKNOWN_PROMPT`: There is no such prompt.
  - Refuses `CLOSED`: This prompt is already concluded or abandoned.
  - Refuses `ALREADY_TAKEN`: This prompt has already been taken.
- `extend(prompt: Prompt, reasoner: Reasoner, text: String) : returns ()`
  - Refuses `UNKNOWN_PROMPT`: There is no such prompt.
  - Refuses `CLOSED`: This prompt is already concluded or abandoned.
  - Refuses `NOT_TAKEN`: A reasoner has to take this prompt before answering it.
  - Refuses `NOT_YOURS`: Only the reasoner that took this prompt can answer it.
- `conclude(prompt: Prompt, reasoner: Reasoner) : returns (prompt: Prompt, subject: Subject, ask: String)`
  - Refuses `UNKNOWN_PROMPT`: There is no such prompt.
  - Refuses `CLOSED`: This prompt is already concluded or abandoned.
  - Refuses `NOT_TAKEN`: A reasoner has to take this prompt before answering it.
  - Refuses `NOT_YOURS`: Only the reasoner that took this prompt can answer it.
  - Refuses `EMPTY_ANSWER`: The answer is still empty; abandon the prompt instead.
- `abandon(prompt: Prompt, reason: String) : returns (prompt: Prompt)`
  - Refuses `NO_REASON`: Say why you are abandoning the prompt.
  - Refuses `UNKNOWN_PROMPT`: There is no such prompt.
  - Refuses `CLOSED`: This prompt is already concluded or abandoned.
- `forget(subject: Subject) : returns (subject: Subject)`

#### Queries

- `_waiting() : many (prompt: Prompt, subject: Subject, ask: String)`
- `_about(subject: Subject) : many (prompt: Prompt, ask: String, answer: String, stage: Stage)`
- `_taken(reasoner: Reasoner) : many (prompt: Prompt, subject: Subject)`
- `_reasoner(prompt: Prompt) : optional (reasoner: Reasoner)`
- `_reason(prompt: Prompt) : optional (reason: String)`
- `_lines(prompt: Prompt) : many (line: String, position: Number)`

#### Instances

- `Reasoning` — instance of `Reasoning` — [ConceptBox types](../design/types.md), line 37.
  - `Reasoner` is `Agent` — [ConceptBox types](../design/types.md), line 39.
  - `Subject` is `Storing.File` — [ConceptBox types](../design/types.md), line 38.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `use(session: Session) : returns (subject: Subject)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.
- `end(session: Session) : returns (session: Session)`
  - Refuses `NOT_SIGNED_IN`: Your session has ended. Sign in again.

#### Instances

- `AgentSessioning` — instance of `Sessioning` — [ConceptBox types](../design/types.md), line 21.
  - `Subject` is `Agent` — [ConceptBox types](../design/types.md), line 22.
- `Sessioning` — instance of `Sessioning` — [ConceptBox types](../design/types.md), line 18.
  - `Subject` is `Authenticating.User` — [ConceptBox types](../design/types.md), line 19.

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

- `Sharing` — instance of `Sharing` — [ConceptBox types](../design/types.md), line 27.
  - `Item` is `Storing.File` — [ConceptBox types](../design/types.md), line 28.
  - `Person` is `Authenticating.User` — [ConceptBox types](../design/types.md), line 29.

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

- `Storing` — instance of `Storing` — [ConceptBox types](../design/types.md), line 24.
  - `Uploader` is `Authenticating.User` — [ConceptBox types](../design/types.md), line 25.

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

- `Trashing` — instance of `Trashing` — [ConceptBox types](../design/types.md), line 31.
  - `Item` is `Storing.File` — [ConceptBox types](../design/types.md), line 32.

## Application types

Concrete types:

- `Agent` — [ConceptBox types](../design/types.md), line 8.
- `Feature` — [ConceptBox types](../design/types.md), line 11.

## Views

_Views name reusable conditions. Multiple `where` blocks are alternatives._

### (file) has an open question that asks (ask)

Authored path: `describing.asking.hasOpenQuestion`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.

```view
(file) has an open question that asks (ask) — inputs (file, ask); outputs (); bindings (stage)
  where
    Reasoning._about (subject: file) has (ask, stage)
    stage is among ["WAITING", "FORMING"]
```

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

### (user) has describing on

Authored path: `describing.choosing.describingOn`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 7.

```view
(user) has describing on — inputs (user); outputs (); bindings ()
  where Consenting._consented (person: user, use: "describe-uploads") has (consented: true)
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

### the descriptions and labels of (file)

Authored path: `describing.showing.describingOf`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 39.

```former
Former "the descriptions and labels of (file)" — inputs (file); bindings (descriptionPrompt, answer, stage, reason, labelPrompt, labelStage, labelReason, label, openPrompt, openStage); promises exactly one record — forms:
  a record of
    descriptions: each Reasoning._about (subject: file) has (answer, ask: "Describe this file in one or two short sentences, for someone deciding whether to open it.", prompt: descriptionPrompt, stage)
      where whether Reasoning._reason (prompt: descriptionPrompt) has (reason)
      form a record of
        answer
        reason
        stage
    labelQuestions: each Reasoning._about (subject: file) has (ask: "Suggest up to five short labels someone might search for to find this file again. Write each label on its own line, in lowercase, and nothing else.", prompt: labelPrompt, stage: labelStage)
      where whether Reasoning._reason (prompt: labelPrompt) has (reason: labelReason)
      form a record of
        reason: labelReason
        stage: labelStage
    labels: the distinct label of each Labeling._labels (item: file) has (name: label)
    openQuestions: the count of Reasoning._about (subject: file) has (prompt: openPrompt, stage: openStage)
      where openStage is among ["WAITING", "FORMING"]
```

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
      … former "the descriptions and labels of (file)" with (file)
```

### the files (user) uploaded and labeled (label)

Authored path: `labels.finding.myFilesLabeled`.
- Covered by [Labels](../design/compositions/labels.md), line 11.

```former
Former "the files (user) uploaded and labeled (label)" — inputs (user, label); bindings (file, name, size, uploadedAt); promises exactly one record — forms:
  each Storing._uploadedBy (uploader: user) has (file, name, size, uploadedAt)
    where no Trashing._trashed (item: file)
    where Labeling._labeled (name: label) has (item: file)
    form a record of
      file
      name
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

### the prompts (agent) has taken and not finished

Authored path: `reusable.answering.finding.promptsTakenBy`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 22.

```former
Former "the prompts (agent) has taken and not finished" — inputs (agent); bindings (prompt); promises exactly one record — forms:
  each Reasoning._taken (reasoner: agent) has (prompt)
    form a record of
      prompt
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

### the waiting prompts

Authored path: `reusable.answering.finding.waitingPrompts`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 22.

```former
Former "the waiting prompts" — inputs (); bindings (prompt, ask); promises exactly one record — forms:
  each Reasoning._waiting () has (ask, prompt)
    form a record of
      ask
      prompt
```

### whether (user) has describing on

Authored path: `describing.choosing.describingSetting`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 7.

```former
Former "whether (user) has describing on" — inputs (user); bindings (consented); promises exactly one record — forms:
  a record of
    where Consenting._consented (person: user, use: "describe-uploads") has (consented)
    on: consented
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
  RequestBoundary.respond (describing: former "whether (user) has describing on" with (user), myFiles: former "the files (user) uploaded and hasn't trashed" with (user), myTrash: former "the trash of (user)" with (user), requestId, sharedWithMe: former "the files shared with (user)" with (user))
```

### describing.applying.LabelFromAnswer

Authored path: `describing.applying.LabelFromAnswer`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 35.

```reaction
when Reasoning.conclude (prompt, ask: "Suggest up to five short labels someone might search for to find this file again. Write each label on its own line, in lowercase, and nothing else.", subject: file)
where
  Storing._get (file)
  Reasoning._lines (prompt) has (line, position)
  position is less than 5
then
  Labeling.label (item: file, name: line)
```

### describing.asking.AskForDescription

Authored path: `describing.asking.AskForDescription`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.

```reaction
when Storing.finish (file, uploader)
where
  view "(user) has describing on" with (user: uploader)
then
  Reasoning.prompt (ask: "Describe this file in one or two short sentences, for someone deciding whether to open it.", subject: file)
```

### describing.asking.AskForLabels

Authored path: `describing.asking.AskForLabels`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.

```reaction
when Storing.finish (file, uploader)
where
  view "(user) has describing on" with (user: uploader)
then
  Reasoning.prompt (ask: "Suggest up to five short labels someone might search for to find this file again. Write each label on its own line, in lowercase, and nothing else.", subject: file)
```

### describing.asking.DescribeAgain

Authored path: `describing.asking.DescribeAgain`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.
- Covered by [Describing uploads](../design/compositions/describing.md), line 19.

```reaction
when RequestBoundary.request (file, path: "/files/describe", requestId, session)
then
  Sessioning.use (session)
```

### describing.asking.DescribeAgain:already-asked#2

Authored path: `describing.asking.DescribeAgain`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.
- Covered by [Describing uploads](../design/compositions/describing.md), line 19.

```reaction
when Sessioning.use (session, subject: user), asked by describing.asking.DescribeAgain
where
  view "(user) has describing on" with (user)
  earlier, RequestBoundary.request (file, path: "/files/describe", requestId, session)
  view "(user) owns (file)" with (file, user)
  view "(file) has an open question that asks (ask)" with (ask: "Describe this file in one or two short sentences, for someone deciding whether to open it.", file)
then
  RequestBoundary.respond (file, requestId)
```

### describing.asking.DescribeAgain:consented#2

Authored path: `describing.asking.DescribeAgain`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.
- Covered by [Describing uploads](../design/compositions/describing.md), line 19.

```reaction
when Sessioning.use (session, subject: user), asked by describing.asking.DescribeAgain
where
  view "(user) has describing on" with (user)
  earlier, RequestBoundary.request (file, path: "/files/describe", requestId, session)
  view "(user) owns (file)" with (file, user)
  no view "(file) has an open question that asks (ask)" with (ask: "Describe this file in one or two short sentences, for someone deciding whether to open it.", file)
then
  Reasoning.prompt (ask: "Describe this file in one or two short sentences, for someone deciding whether to open it.", subject: file)
```

### describing.asking.DescribeAgain:consented#3

Authored path: `describing.asking.DescribeAgain`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.
- Covered by [Describing uploads](../design/compositions/describing.md), line 19.

```reaction
when Reasoning.prompt (ask: "Describe this file in one or two short sentences, for someone deciding whether to open it.", subject: file), asked by describing.asking.DescribeAgain:consented#2
where
  earlier, RequestBoundary.request (file, path: "/files/describe", requestId, session)
then
  RequestBoundary.respond (file, requestId)
```

### describing.asking.DescribeAgain:not-consented#2

Authored path: `describing.asking.DescribeAgain`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.
- Covered by [Describing uploads](../design/compositions/describing.md), line 19.

```reaction
when Sessioning.use (session, subject: user), asked by describing.asking.DescribeAgain
where
  no view "(user) has describing on" with (user)
  earlier, RequestBoundary.request (file, path: "/files/describe", requestId, session)
  view "(user) owns (file)" with (file, user)
then
  RequestBoundary.respond (error: "NOT_CONSENTED", requestId)
```

### describing.asking.DescribeAgain:refused#2

Authored path: `describing.asking.DescribeAgain`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.
- Covered by [Describing uploads](../design/compositions/describing.md), line 19.

```reaction
when Sessioning.use (session, subject: user), asked by describing.asking.DescribeAgain
where
  earlier, RequestBoundary.request (file, path: "/files/describe", requestId, session)
  no view "(user) owns (file)" with (file, user)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### describing.asking.SuggestLabelsAgain

Authored path: `describing.asking.SuggestLabelsAgain`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.
- Covered by [Describing uploads](../design/compositions/describing.md), line 20.

```reaction
when RequestBoundary.request (file, path: "/files/relabel", requestId, session)
then
  Sessioning.use (session)
```

### describing.asking.SuggestLabelsAgain:already-asked#2

Authored path: `describing.asking.SuggestLabelsAgain`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.
- Covered by [Describing uploads](../design/compositions/describing.md), line 20.

```reaction
when Sessioning.use (session, subject: user), asked by describing.asking.SuggestLabelsAgain
where
  view "(user) has describing on" with (user)
  earlier, RequestBoundary.request (file, path: "/files/relabel", requestId, session)
  view "(user) owns (file)" with (file, user)
  view "(file) has an open question that asks (ask)" with (ask: "Suggest up to five short labels someone might search for to find this file again. Write each label on its own line, in lowercase, and nothing else.", file)
then
  RequestBoundary.respond (file, requestId)
```

### describing.asking.SuggestLabelsAgain:consented#2

Authored path: `describing.asking.SuggestLabelsAgain`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.
- Covered by [Describing uploads](../design/compositions/describing.md), line 20.

```reaction
when Sessioning.use (session, subject: user), asked by describing.asking.SuggestLabelsAgain
where
  view "(user) has describing on" with (user)
  earlier, RequestBoundary.request (file, path: "/files/relabel", requestId, session)
  view "(user) owns (file)" with (file, user)
  no view "(file) has an open question that asks (ask)" with (ask: "Suggest up to five short labels someone might search for to find this file again. Write each label on its own line, in lowercase, and nothing else.", file)
then
  Reasoning.prompt (ask: "Suggest up to five short labels someone might search for to find this file again. Write each label on its own line, in lowercase, and nothing else.", subject: file)
```

### describing.asking.SuggestLabelsAgain:consented#3

Authored path: `describing.asking.SuggestLabelsAgain`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.
- Covered by [Describing uploads](../design/compositions/describing.md), line 20.

```reaction
when Reasoning.prompt (ask: "Suggest up to five short labels someone might search for to find this file again. Write each label on its own line, in lowercase, and nothing else.", subject: file), asked by describing.asking.SuggestLabelsAgain:consented#2
where
  earlier, RequestBoundary.request (file, path: "/files/relabel", requestId, session)
then
  RequestBoundary.respond (file, requestId)
```

### describing.asking.SuggestLabelsAgain:not-consented#2

Authored path: `describing.asking.SuggestLabelsAgain`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.
- Covered by [Describing uploads](../design/compositions/describing.md), line 20.

```reaction
when Sessioning.use (session, subject: user), asked by describing.asking.SuggestLabelsAgain
where
  no view "(user) has describing on" with (user)
  earlier, RequestBoundary.request (file, path: "/files/relabel", requestId, session)
  view "(user) owns (file)" with (file, user)
then
  RequestBoundary.respond (error: "NOT_CONSENTED", requestId)
```

### describing.asking.SuggestLabelsAgain:refused#2

Authored path: `describing.asking.SuggestLabelsAgain`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 16.
- Covered by [Describing uploads](../design/compositions/describing.md), line 20.

```reaction
when Sessioning.use (session, subject: user), asked by describing.asking.SuggestLabelsAgain
where
  earlier, RequestBoundary.request (file, path: "/files/relabel", requestId, session)
  no view "(user) owns (file)" with (file, user)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### describing.choosing.AbandonWhenTurnedOff

Authored path: `describing.choosing.AbandonWhenTurnedOff`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 7.

```reaction
when Consenting.withdraw (person: user, use: "describe-uploads")
where
  Storing._uploadedBy (uploader: user) has (file)
  Reasoning._about (subject: file) has (prompt, stage: "WAITING")
then
  Reasoning.abandon (prompt, reason: "You turned off “Describe uploads”.")
```

### describing.choosing.TurnOff

Authored path: `describing.choosing.TurnOff`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 7.
- Covered by [Describing uploads](../design/compositions/describing.md), line 11.

```reaction
when RequestBoundary.request (path: "/describing/off", requestId, session)
then
  Sessioning.use (session)
```

### describing.choosing.TurnOff#2

Authored path: `describing.choosing.TurnOff`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 7.
- Covered by [Describing uploads](../design/compositions/describing.md), line 11.

```reaction
when Sessioning.use (session, subject: user), asked by describing.choosing.TurnOff
then
  Consenting.withdraw (person: user, use: "describe-uploads")
```

### describing.choosing.TurnOff#3

Authored path: `describing.choosing.TurnOff`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 7.
- Covered by [Describing uploads](../design/compositions/describing.md), line 11.

```reaction
when Consenting.withdraw (person: user, use: "describe-uploads"), asked by describing.choosing.TurnOff#2
where
  earlier, RequestBoundary.request (path: "/describing/off", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### describing.choosing.TurnOn

Authored path: `describing.choosing.TurnOn`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 7.
- Covered by [Describing uploads](../design/compositions/describing.md), line 10.

```reaction
when RequestBoundary.request (path: "/describing/on", requestId, session)
then
  Sessioning.use (session)
```

### describing.choosing.TurnOn#2

Authored path: `describing.choosing.TurnOn`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 7.
- Covered by [Describing uploads](../design/compositions/describing.md), line 10.

```reaction
when Sessioning.use (session, subject: user), asked by describing.choosing.TurnOn
then
  Consenting.consent (person: user, use: "describe-uploads")
```

### describing.choosing.TurnOn#3

Authored path: `describing.choosing.TurnOn`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 7.
- Covered by [Describing uploads](../design/compositions/describing.md), line 10.

```reaction
when Consenting.consent (person: user, use: "describe-uploads"), asked by describing.choosing.TurnOn#2
where
  earlier, RequestBoundary.request (path: "/describing/on", requestId, session)
then
  RequestBoundary.respond (requestId)
```

### describing.forgetting.ForgetQuestionsOfDeleted

Authored path: `describing.forgetting.ForgetQuestionsOfDeleted`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 35.

```reaction
when Storing.delete (file)
then
  Reasoning.forget (subject: file)
```

### describing.reading.ReadFile

Authored path: `describing.reading.ReadFile`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 27.
- Covered by [Describing uploads](../design/compositions/describing.md), line 30.

```reaction
when RequestBoundary.request (path: "/describing/file", prompt, requestId, session)
then
  AgentSessioning.use (session)
```

### describing.reading.ReadFile:deleted#2

Authored path: `describing.reading.ReadFile`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 27.
- Covered by [Describing uploads](../design/compositions/describing.md), line 30.

```reaction
when AgentSessioning.use (session, subject: agent), asked by describing.reading.ReadFile
where
  Reasoning._taken (reasoner: agent) has (prompt, subject: file)
  no Storing._get (file)
  earlier, RequestBoundary.request (path: "/describing/file", prompt, requestId, session)
then
  RequestBoundary.respond (error: "FILE_NOT_FOUND", requestId)
```

### describing.reading.ReadFile:not-taken#2

Authored path: `describing.reading.ReadFile`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 27.
- Covered by [Describing uploads](../design/compositions/describing.md), line 30.

```reaction
when AgentSessioning.use (session, subject: agent), asked by describing.reading.ReadFile
where
  earlier, RequestBoundary.request (path: "/describing/file", prompt, requestId, session)
  no Reasoning._taken (reasoner: agent) has (prompt)
then
  RequestBoundary.respond (error: "NOT_TAKEN", requestId)
```

### describing.reading.ReadFile:stored#2

Authored path: `describing.reading.ReadFile`.
- Covered by [Describing uploads](../design/compositions/describing.md), line 27.
- Covered by [Describing uploads](../design/compositions/describing.md), line 30.

```reaction
when AgentSessioning.use (session, subject: agent), asked by describing.reading.ReadFile
where
  Reasoning._taken (reasoner: agent) has (prompt, subject: file)
  Storing._get (file) has (mediaType, name)
  Storing._download (file) has (url)
  earlier, RequestBoundary.request (path: "/describing/file", prompt, requestId, session)
then
  RequestBoundary.respond (mediaType, name, requestId, url)
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

### labels.correcting.RemoveLabel

Authored path: `labels.correcting.RemoveLabel`.
- Covered by [Labels](../design/compositions/labels.md), line 5.
- Covered by [Labels](../design/compositions/labels.md), line 8.

```reaction
when RequestBoundary.request (file, label, path: "/files/unlabel", requestId, session)
then
  Sessioning.use (session)
```

### labels.correcting.RemoveLabel:owner#2

Authored path: `labels.correcting.RemoveLabel`.
- Covered by [Labels](../design/compositions/labels.md), line 5.
- Covered by [Labels](../design/compositions/labels.md), line 8.

```reaction
when Sessioning.use (session, subject: user), asked by labels.correcting.RemoveLabel
where
  earlier, RequestBoundary.request (file, label, path: "/files/unlabel", requestId, session)
  view "(user) owns (file)" with (file, user)
then
  Labeling.remove (item: file, name: label)
```

### labels.correcting.RemoveLabel:owner#3

Authored path: `labels.correcting.RemoveLabel`.
- Covered by [Labels](../design/compositions/labels.md), line 5.
- Covered by [Labels](../design/compositions/labels.md), line 8.

```reaction
when Labeling.remove (item: file, name: label), asked by labels.correcting.RemoveLabel:owner#2
where
  earlier, RequestBoundary.request (file, label, path: "/files/unlabel", requestId, session)
then
  RequestBoundary.respond (file, requestId)
```

### labels.correcting.RemoveLabel:refused#2

Authored path: `labels.correcting.RemoveLabel`.
- Covered by [Labels](../design/compositions/labels.md), line 5.
- Covered by [Labels](../design/compositions/labels.md), line 8.

```reaction
when Sessioning.use (session, subject: user), asked by labels.correcting.RemoveLabel
where
  earlier, RequestBoundary.request (file, label, path: "/files/unlabel", requestId, session)
  no view "(user) owns (file)" with (file, user)
then
  RequestBoundary.respond (error: "NOT_FOUND", requestId)
```

### labels.deleting.RemoveLabelsOfDeleted

Authored path: `labels.deleting.RemoveLabelsOfDeleted`.
- Covered by [Labels](../design/compositions/labels.md), line 17.

```reaction
when Storing.delete (file)
where
  Labeling._labels (item: file) has (name: label)
then
  Labeling.remove (item: file, name: label)
```

### labels.finding.FindByLabel

Authored path: `labels.finding.FindByLabel`.
- Covered by [Labels](../design/compositions/labels.md), line 11.
- Covered by [Labels](../design/compositions/labels.md), line 14.

```reaction
when RequestBoundary.request (label, path: "/files/labeled", requestId, session)
then
  Sessioning.use (session)
```

### labels.finding.FindByLabel#2

Authored path: `labels.finding.FindByLabel`.
- Covered by [Labels](../design/compositions/labels.md), line 11.
- Covered by [Labels](../design/compositions/labels.md), line 14.

```reaction
when Sessioning.use (session, subject: user), asked by labels.finding.FindByLabel
where
  earlier, RequestBoundary.request (label, path: "/files/labeled", requestId, session)
then
  RequestBoundary.respond (labeled: former "the files (user) uploaded and labeled (label)" with (label, user), requestId)
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

### reusable.answering.abandoning.Abandon

Authored path: `reusable.answering.abandoning.Abandon`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 40.

```reaction
when RequestBoundary.request (path: "/answers/abandon", prompt, reason, requestId, session)
then
  AgentSessioning.use (session)
```

### reusable.answering.abandoning.Abandon:not-taken#2

Authored path: `reusable.answering.abandoning.Abandon`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 40.

```reaction
when AgentSessioning.use (session, subject: agent), asked by reusable.answering.abandoning.Abandon
where
  earlier, RequestBoundary.request (path: "/answers/abandon", prompt, reason, requestId, session)
  no Reasoning._taken (reasoner: agent) has (prompt)
then
  RequestBoundary.respond (error: "NOT_TAKEN", requestId)
```

### reusable.answering.abandoning.Abandon:taken#2

Authored path: `reusable.answering.abandoning.Abandon`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 40.

```reaction
when AgentSessioning.use (session, subject: agent), asked by reusable.answering.abandoning.Abandon
where
  Reasoning._taken (reasoner: agent) has (prompt)
  earlier, RequestBoundary.request (path: "/answers/abandon", prompt, reason, requestId, session)
then
  Reasoning.abandon (prompt, reason)
```

### reusable.answering.abandoning.Abandon:taken#3

Authored path: `reusable.answering.abandoning.Abandon`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 40.

```reaction
when Reasoning.abandon (prompt, reason), asked by reusable.answering.abandoning.Abandon:taken#2
where
  earlier, RequestBoundary.request (path: "/answers/abandon", prompt, reason, requestId, session)
then
  RequestBoundary.respond (requestId)
```

### reusable.answering.finding.ShowOpen

Authored path: `reusable.answering.finding.ShowOpen`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 22.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 25.

```reaction
when RequestBoundary.request (path: "/answers/open", requestId, session)
then
  AgentSessioning.use (session)
```

### reusable.answering.finding.ShowOpen#2

Authored path: `reusable.answering.finding.ShowOpen`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 22.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 25.

```reaction
when AgentSessioning.use (session, subject: agent), asked by reusable.answering.finding.ShowOpen
where
  earlier, RequestBoundary.request (path: "/answers/open", requestId, session)
then
  RequestBoundary.respond (requestId, taken: former "the prompts (agent) has taken and not finished" with (agent), waiting: former "the waiting prompts")
```

### reusable.answering.writing.Conclude

Authored path: `reusable.answering.writing.Conclude`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 39.

```reaction
when RequestBoundary.request (path: "/answers/conclude", prompt, requestId, session)
then
  AgentSessioning.use (session)
```

### reusable.answering.writing.Conclude#2

Authored path: `reusable.answering.writing.Conclude`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 39.

```reaction
when AgentSessioning.use (session, subject: agent), asked by reusable.answering.writing.Conclude
where
  earlier, RequestBoundary.request (path: "/answers/conclude", prompt, requestId, session)
then
  Reasoning.conclude (prompt, reasoner: agent)
```

### reusable.answering.writing.Conclude#3

Authored path: `reusable.answering.writing.Conclude`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 39.

```reaction
when Reasoning.conclude (prompt, reasoner: agent), asked by reusable.answering.writing.Conclude#2
where
  earlier, RequestBoundary.request (path: "/answers/conclude", prompt, requestId, session)
then
  RequestBoundary.respond (requestId)
```

### reusable.answering.writing.Extend

Authored path: `reusable.answering.writing.Extend`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 38.

```reaction
when RequestBoundary.request (path: "/answers/extend", prompt, requestId, session, text)
then
  AgentSessioning.use (session)
```

### reusable.answering.writing.Extend#2

Authored path: `reusable.answering.writing.Extend`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 38.

```reaction
when AgentSessioning.use (session, subject: agent), asked by reusable.answering.writing.Extend
where
  earlier, RequestBoundary.request (path: "/answers/extend", prompt, requestId, session, text)
then
  Reasoning.extend (prompt, reasoner: agent, text)
```

### reusable.answering.writing.Extend#3

Authored path: `reusable.answering.writing.Extend`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 38.

```reaction
when Reasoning.extend (prompt, reasoner: agent, text), asked by reusable.answering.writing.Extend#2
where
  earlier, RequestBoundary.request (path: "/answers/extend", prompt, requestId, session, text)
then
  RequestBoundary.respond (requestId)
```

### reusable.answering.writing.Take

Authored path: `reusable.answering.writing.Take`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 37.

```reaction
when RequestBoundary.request (path: "/answers/take", prompt, requestId, session)
then
  AgentSessioning.use (session)
```

### reusable.answering.writing.Take#2

Authored path: `reusable.answering.writing.Take`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 37.

```reaction
when AgentSessioning.use (session, subject: agent), asked by reusable.answering.writing.Take
where
  earlier, RequestBoundary.request (path: "/answers/take", prompt, requestId, session)
then
  Reasoning.take (prompt, reasoner: agent)
```

### reusable.answering.writing.Take#3

Authored path: `reusable.answering.writing.Take`.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 34.
- Covered by [Answering questions](../design/compositions/reusable/answering.md), line 37.

```reaction
when Reasoning.take (prompt, reasoner: agent), asked by reusable.answering.writing.Take#2
where
  earlier, RequestBoundary.request (path: "/answers/take", prompt, requestId, session)
then
  RequestBoundary.respond (prompt, requestId)
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

- `/answers/abandon` — requires `prompt`, `reason`, `session`
- `/answers/conclude` — requires `prompt`, `session`
- `/answers/extend` — requires `prompt`, `session`, `text`
- `/answers/open` — requires `session`
- `/answers/take` — requires `prompt`, `session`
- `/auth/login` — requires `password`, `username`
- `/auth/logout` — requires `session`
- `/auth/me` — requires `session`
- `/auth/register` — requires `password`, `username`
- `/box` — requires `session`
- `/describing/file` — requires `prompt`, `session`
- `/describing/off` — requires `session`
- `/describing/on` — requires `session`
- `/files/describe` — requires `file`, `session`
- `/files/download` — requires `file`, `session`
- `/files/finish` — requires `file`, `session`
- `/files/labeled` — requires `label`, `session`
- `/files/purge` — requires `file`, `session`
- `/files/relabel` — requires `file`, `session`
- `/files/restore` — requires `file`, `session`
- `/files/revoke` — requires `file`, `recipient`, `session`
- `/files/share` — requires `file`, `session`, `username`
- `/files/start` — requires `mediaType`, `name`, `session`
- `/files/trash` — requires `file`, `session`
- `/files/unlabel` — requires `file`, `label`, `session`
- `/files/view` — requires `file`, `session`
- `/people` — requires `session`
