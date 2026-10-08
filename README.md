# ConceptBox

ConceptBox is a small app for keeping files and sharing them with classmates. People sign in with a password or with Commons, upload files, share them by username, take a share back, and move files to the trash. When someone turns on "Describe uploads", an agent sends each of their new uploads to a language model and saves the description and labels the model writes.

ConceptBox is also a reference app for building with concepts on [sync-engine](https://github.com/mit-sdg/sync-engine). Read it to see concepts, reactions, views, formers, endpoints, and an agent in working code, and copy any of its parts into your own app.

## Where things are

| | Design | Code | Tests |
|---|---|---|---|
| Concepts | `design/concepts/` | `src/concepts/` | `tests/concepts/` |
| Reactions, views, formers, endpoints | `design/compositions/` | `src/compositions/` | `tests/compositions/` |
| Which types each concept is instantiated with | `design/types.md` | `src/concepts.ts` | |
| The assembled app | | `src/application.ts` | `tests/support/app.ts` |
| The agent | `design/compositions/reusable/answering.md` | `src/agents/` | `tests/compositions/describing.test.ts` |
| The HTTP server | | `src/host/` | `tests/compositions/signing-in-http.test.ts` |
| The Vue frontend | | `frontend/src/` | |

A design document and its code have the same name, such as `design/compositions/shares.md` and `src/compositions/shares.ts`.

## Follow one share

Maya shares `beach.jpg` with Sam. She types `sam` in the share dialog and clicks Add, and her browser calls `/files/share`. The endpoint `Share` in `src/compositions/shares.ts` calls `Sessioning.use`, which returns Maya's user from her session. The `shared` branch runs when the view `owns` holds for Maya and the file, `Registering._byUsername` returns Sam's user for `sam`, and that user isn't Maya. Then `Share` calls `Sharing.share`. `Share` has four named branches, one for each outcome: `shared`, `yourself`, `no-such-user`, and `refused`.

Sam opens his box. His browser calls `/box`, and the former `sharedWithMe` in `src/compositions/box.ts` returns each file shared with him for which the view `canRead` holds, with the file's name from Storing and the owner's username from Registering.

Maya moves the photo to the trash, and later deletes it there. The endpoint `Purge` calls `Storing.delete`. Then three reactions run: one calls `Reasoning.forget`, one calls `Sharing.revoke` for each person the photo was shared with, and one calls `Trashing.purge`. This is the purge in the walkthrough test, where Maya shared the photo with Sam and Ada:

```
-> /files/purge {"session":"[redacted]","file":"beach.jpg"}
   Sessioning.use({"session":"[redacted]"}) -> {"subject":"maya"}    [trash.discarding.Purge]
   Storing.delete({"file":"beach.jpg"}) -> {"file":"beach.jpg"}    [trash.discarding.Purge]
   Reasoning.forget({"subject":"beach.jpg"}) -> {"subject":"beach.jpg"}    [describing.forgetting.ForgetQuestionsOfDeleted]
   Sharing.revoke({"item":"beach.jpg","recipient":"sam"}) -> {"item":"beach.jpg","recipient":"sam"}    [files.deleting.RevokeSharesOfDeleted]
   Sharing.revoke({"item":"beach.jpg","recipient":"ada"}) -> {"item":"beach.jpg","recipient":"ada"}    [files.deleting.RevokeSharesOfDeleted]
<- {"file":"beach.jpg"}
   Trashing.purge({"item":"beach.jpg"}) -> {"item":"beach.jpg"}    [trash.discarding.RecordPurge]
```

Each line is one action, and the brackets name the endpoint or reaction that called it. Two rows, for Sam and Ada, match the where clause of `RevokeSharesOfDeleted`, so its then clause runs twice. `bun run trace -t "Maya uploads a photo"` prints this for the whole test. Pass another test name from `tests/compositions/walkthrough.test.ts` to trace that test.

To read sharing from design to test, open these in order:

1. [`design/concepts/Sharing.md`](design/concepts/Sharing.md)
2. `src/concepts/Sharing/Sharing.ts`
3. [`design/compositions/shares.md`](design/compositions/shares.md)
4. `src/compositions/shares.ts`
5. `tests/compositions/walkthrough.test.ts`, the tests that mention sharing

## Concepts

Each concept has a specification, a class, and a test that runs the steps of the specification's principle. No concept class imports another. In `design/types.md`, each concept is instantiated with types from other concepts, for example:

```instances
instantiate Sharing with
  Item is Storing.File
  Person is Registering.User
```

- **Sharing**: start here.
- **Storing** stores file bytes in an S3 bucket through the `Bucket` interface in `bucket.ts`. The browser sends the bytes straight to the bucket.
- **Federating** links a person's account on another site, such as Commons, to a user, and calls the site through the `Provider` interface in `provider.ts`. It is instantiated as CommonsFederating in `design/types.md`.
- **Sessioning** is instantiated twice: as Sessioning for people, and as AgentSessioning for the agent.
- **Reasoning** stores questions that take time to answer, and each answer as it is written. Each question is `WAITING`, `FORMING`, `CONCLUDED`, or `ABANDONED`.
- Registering, Authenticating, Trashing, Labeling, and Consenting.

## Reactions

In `src/compositions/files.ts`, after `Storing.delete`, `Sharing.revoke` runs once for each person the file was shared with:

```ts
const RevokeSharesOfDeleted = reaction(({ file, recipient }) =>
  when(Storing.delete({ file }).responds({}))
    .where(Sharing._recipients({ item: file }).is({ recipient }))
    .then(Sharing.revoke({ item: file, recipient })),
);
```

- `DeleteOversized`, in the same file, runs when `Storing.finish` is refused with `TOO_LARGE`.
- `AskForDescription`, in `src/compositions/describing.ts`, runs only when the uploader has describing on.
- `LabelFromAnswer`, in the same file, adds one label for each line of the answer, up to five.

## Views

`canRead`, in `src/compositions/access.ts`, holds when you uploaded the file, or when it was shared with you and isn't in the trash:

```ts
export const canRead = view("(user) can read (file)", ({ user, file }) => [
  where(owns({ user, file })),
  where(
    Storing._get({ file }),
    Sharing._recipients({ item: file }).is({ recipient: user }),
    no(Trashing._trashed({ item: file })),
  ),
]).holds();
```

- `owns`, in the same file, holds for whoever uploaded the file. Every endpoint a person calls about a stored file checks `owns` or `canRead`, except `FinishUpload`, which passes the user to `Storing.finish` as the uploader. The agent's endpoint `ReadFile` checks `Reasoning._taken` instead.
- `sharesFilesWith`, in `src/compositions/shares.ts`, matches the people you share files with and the people who share files with you.

## Formers

`myTrash`, in `src/compositions/trash.ts`, returns the files in your trash, most recently trashed first:

```ts
export const myTrash = former("the trash of (user)", ({ user }, { file, name, size, trashedAt }) =>
  each(Storing._uploadedBy({ uploader: user }).is({ file, name, size }))
    .where(Trashing._trashed({ item: file }).is({ trashedAt }))
    .arranged(trashedAt, "descending")
    .form({ file, name, size, trashedAt }),
);
```

- `myFiles`, in `src/compositions/box.ts`, returns each file with a list of the people it is shared with, and adds its descriptions and labels with `.splicing(describingOf({ file }))`.
- `describingOf`, in `src/compositions/describing.ts`, uses `whether` for an abandoned question's reason, which a question may not have, and `.count()` for the number of open questions.

## Endpoints

In `src/compositions/files.ts`, the endpoint that starts an upload:

```ts
const StartUpload = endpoint(
  "/files/start",
  ({ session, name, mediaType, user, file, uploadUrl }) =>
    receive({ session, name, mediaType })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(Storing.start({ uploader: user, name, mediaType }).responds({ file, uploadUrl }))
      .then(respond({ file, uploadUrl })),
  { validators: { input: textInput } },
);
```

- `Share`, in `src/compositions/shares.ts`, has the four branches from the scene above.
- `Download`, in `src/compositions/files.ts`, checks `canRead` in its where clause.
- `FinishCommons`, in `src/compositions/reusable/commons.ts`, has two branches: `returning`, and `new` for a person signing in with Commons for the first time.

## The agent

The describer starts a session in AgentSessioning and calls endpoints with it, as Maya's browser does. It runs inside the server.

1. Maya uploads a photo with describing on. When the upload finishes, `AskForDescription` and `AskForLabels` each call `Reasoning.prompt` with their question.
2. The describer calls `/answers/take` for a question, then calls the endpoint `ReadFile` (`/describing/file`), which returns a link to the photo.
3. The describer sends the question and the photo to the model, and calls `/answers/extend` with each piece of the answer as it arrives.
4. The describer calls `/answers/conclude`. For the label question, `LabelFromAnswer` then adds the labels.

The describer is defined in `src/agents/describer.ts`. Its loop is in `src/agents/reusable/agent.ts`, the calls to Gemini are in `src/agents/reusable/reasoners.ts`, and the endpoints the describer calls are specified in [answering questions](design/compositions/reusable/answering.md).

## The frontend

`frontend/src/api/client.ts` makes a client typed from every endpoint in `generated/wire.ts`, so TypeScript checks a call such as `api.files.share({ file, username })`:

```ts
export const api = createHttpClient<ConceptBoxWireHttp>({ baseUrl: "/api" });
```

In `frontend/src/box/useBox.ts`, `change` waits for a call to an endpoint, then reloads the box from `/box`. The Restore button in `frontend/src/box/Trash.vue` uses it:

```vue
<button type="button" class="button soft" :disabled="working" @click="change('/files/restore', api.files.restore({ file: row.file }))">Restore</button>
```

## History

The first commit has files, sharing, and password sign-in, with Trashing, Labeling, Reasoning, and Consenting already written and tested. The trash, the agent, and Commons sign-in follow, one commit each. `git log --stat` lists the files each commit changed.

## Copy parts into your app

To copy a part, follow three steps:

1. **Copy its files** to the same paths.
2. **Register it.**
   - A concept: in `src/concepts.ts` and `design/types.md`.
   - A composition: in your assembly (`src/application.ts` here) and in `design.documents` in `generated.config.ts`.
3. **Run `bun run generate` and `bun run check`.**

The compositions in `reusable` folders import concepts by the names used here, such as `Sessioning`, so register the concepts under those names. They all import `src/compositions/reusable/inputs.ts`, so copy it with them.

### Starting from a copy of ConceptBox

Delete what you don't need, then run `bun run check` and `bun run test` to find what still refers to it. Run `git show --stat` on the commit for the trash, the agent, or Commons sign-in to see the files it added or changed.

To rename the app, change `title` and `wireName` in `generated.config.ts`, and `ConceptBoxWire` in `src/host/server.ts` and `tests/support/app.ts`. Rename `ConceptBoxWireHttp` too: in `projections` in `generated.config.ts`, and in `frontend/src/api/client.ts` and `frontend/src/box/useBox.ts`.

### Starting from `sync-engine setup`

Your app has `generated.config.ts`, `src/concepts.ts`, `src/assembly.ts` (`src/application.ts` here), and `src/main.ts`.

<details>
<summary>Once, before the first part</summary>

- Run `bun add mongodb`, and `bun add -d mongodb-memory-server` for the tests. Every concept here is implemented on MongoDB.
- For sign-in or the HTTP server, run `bun add @mit-sdg/sync-engine-http` at the same version as `@mit-sdg/sync-engine`.
- In `src/assembly.ts`, pass `instances: applicationConceptSet.implementations("mongo", { database })` to `assemble`, as `src/application.ts` does. Connect to the database the way `connect` in `src/host/server.ts` does.
- In `generated.config.ts`, give the assembly a database whose client never connects, as `generated.config.ts` does here.
- For concept tests, copy `tests/support/reusable/`.

</details>

### The parts

**A concept.** For Sharing: `design/concepts/Sharing.md`, `src/concepts/Sharing/`, and `tests/concepts/Sharing.test.ts`. In `registry.ts`, import your app's types in place of `User` and `File`. Storing also takes a bucket, and Federating a provider. Pass them to `implementations("mongo", …)` beside `database`, as `src/application.ts` does, and use `MemoryBucket` or `MemoryProvider` in `generated.config.ts` and the tests.

**Signing in with a password.** The accounts and passwords compositions (`design/compositions/reusable/` and `src/compositions/reusable/`); Registering, Sessioning, and Authenticating; and `frontend/src/reusable/` without `CommonsButton.vue`, `CommonsCallback.vue`, and `CommonsMark.vue`.

<details>
<summary>Connect it</summary>

- In `src/host/http.ts`, add `accountsHttp.publicErrors` and `passwordsHttp.publicErrors` to `publicErrors`, and make the session cookie with `accountsHttp.sessionCookie`, passing `passwordsHttp.startingSessions`.
- In your `App.vue`, put `PasswordForm.vue` inside `SignIn.vue`.

</details>

**Signing in with Commons.** The accounts and commons compositions; Registering, Sessioning, and Federating (with `provider.ts`, `tests/concepts/Federating.test.ts`, and `tests/concepts/CommonsProvider.test.ts`); and `frontend/src/reusable/` without `PasswordForm.vue`.

<details>
<summary>Connect it</summary>

- Register Federating as `CommonsFederating` in `src/concepts.ts`, and write `instantiate Federating as CommonsFederating` in `design/types.md`.
- Give the assembly a `CommonsProvider` as `commons`, as `src/host/server.ts` does. In `generated.config.ts` and the tests, give it a `MemoryProvider`.
- Pass `redaction: { fields: ["attempt", "nonce", "state", "code"] }` to `assemble`, as `src/application.ts` does, to keep those values out of the logs.
- In `src/host/http.ts`, add `accountsHttp.publicErrors` and `commonsHttp.publicErrors` to `publicErrors`, pass `commonsHttp.startingSessions` to the session cookie, and add `commonsHttp.signInCookie` as a second cookie. If a refusal has no category in `publicErrors`, the browser receives `INTERNAL_ERROR`. Without `commonsHttp.publicErrors`, a refusal from `CommonsFederating`, such as an expired sign-in, reaches the browser as `INTERNAL_ERROR`.
- In your `App.vue`, put `CommonsButton.vue` inside `SignIn.vue`, and show `CommonsCallback.vue` on `/auth/commons/callback`, as `frontend/src/App.vue` does.
- Serve every page with `Referrer-Policy: no-referrer`, as `src/host/server.ts` and `frontend/vite.config.ts` do.

</details>

For both ways of signing in, bring both parts. `tests/compositions/signing-in-modules.test.ts` assembles an app with only passwords and an app with only Commons.

**An agent.** The answering composition, `src/agents/reusable/`, and Reasoning.

<details>
<summary>Add an agent to your app</summary>

1. Register Reasoning, and Sessioning a second time as AgentSessioning, in `src/concepts.ts` and in `design/types.md` with `concrete Agent`. Register the answering composition.
2. Write a reaction that calls `Reasoning.prompt`, like `AskForDescription`. If you send people's data to a model's provider, ask for their consent first. In ConceptBox, each reaction that calls `Reasoning.prompt` checks the `describingOn` view, which reads Consenting.
3. Write an endpoint that returns what the agent reads, like `ReadFile`. Start it with `AgentSessioning.use`, and look up the question with `Reasoning._taken`.
4. Define the agent with `createAgent({ name, asks, reasoner, read })`, like `createDescriber`.
5. Pass `agent.observer` to `assemble`, then call `agent.start({ application, api })`, as `src/host/server.ts` and `tests/compositions/describing.test.ts` do.
6. To use an answer, write a reaction on `Reasoning.conclude`, like `LabelFromAnswer`. Check the answer against the values you expect first, because a model can write anything.

</details>

**The HTTP server and the frontend**, for an app from `sync-engine setup`.

<details>
<summary>Files, and what to change in them</summary>

- `src/host/server.ts` and `src/host/http.ts`. In `server.ts`, call your assembly in place of `assembleConceptBox`, and keep only the bucket, Commons, and agent your app uses. In `http.ts`, keep the categories for your app's refusals.
- In `generated.config.ts`, add `projections` like the one here. `bun run generate` then writes the type that `frontend/src/api/client.ts` imports.
- From `frontend/`: `package.json`, `vite.config.ts`, the `tsconfig*.json` files, `index.html`, `src/main.ts`, `src/api/client.ts`, and `src/reusable/styles/`. Write your own `src/App.vue`, and in `src/main.ts`, remove the line that imports `./styles/base.css`.
- From `package.json`, the `dev`, `build`, and `start` scripts. From `.gitignore`, the lines that keep `.env` and `.garage/` out of git.

</details>

## Change it

- A new concept: write `design/concepts/<Name>.md`, then `src/concepts/<Name>/` with a `registry.ts`, and add it to `src/concepts.ts` and `design/types.md`.
- A new composition: write `src/compositions/<name>.ts` and `design/compositions/<name>.md`, and add it to `src/application.ts` and `generated.config.ts`.
- A new refusal: give it an HTTP category in `src/host/http.ts`, and a sentence in `frontend/src/api/errors.ts` (for signing in, in the component that calls the endpoint). In tests, a refused call returns the refusal's code, such as `USERNAME_TAKEN`; over HTTP it returns only the category, such as `CONFLICT`.
- Then run `bun run generate` and `bun run check`.

The engine documentation is in `node_modules/@mit-sdg/sync-engine/docs/user/` after `bun install`. If you work with a coding agent, point it at `llms.txt` there, or install the [sync-engine skill](https://github.com/mit-sdg/sync-engine/blob/main/packages/skill/README.md) at the engine version in `package.json`.

## Run it

You need [Bun](https://bun.sh) and [Garage](https://garagehq.deuxfleurs.fr), an S3-compatible server that stores the file bytes (`brew install garage` on a Mac).

```sh
bun install && bun install --cwd frontend
bun run storage                    # starts Garage; leave it running
```

In a second terminal, in the same folder:

```sh
bun run storage:setup              # first time only: makes the bucket and writes .env
bun run build && bun run start
```

Open http://localhost:3000 and create an account. To try sharing, create a second account in a private window.

| In `.env` | Without it |
|---|---|
| `MONGODB_URI=mongodb://localhost:27017/conceptbox` | Records are kept in an in-memory MongoDB and lost when the server stops. |
| `GEMINI_API_KEY=…` | Descriptions and labels are written from each file's name. |
| `COMMONS_ORIGIN=…` | The Commons button sends people to https://class.mit-sdg.dev, which allows any app on `http://localhost` with a port. |

- While you edit, run `bun run dev` and `bun run --cwd frontend dev`, and open http://localhost:5173.
- If `bun run storage` stops with an error about "Address already in use", Garage is already running, perhaps in another terminal.
- `bun run test` runs the tests. Some print errors on purpose; the last lines show how many passed.
- `bun run check` checks each concept's code against its specification, checks the generated files, and runs TypeScript. The type check of the Vue files uses `vue-tsc`, which needs [Node.js](https://nodejs.org) installed; `bun run build` builds the frontend without it.
