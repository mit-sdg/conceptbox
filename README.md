# ConceptBox

ConceptBox is a small app for keeping files and sharing them with classmates, and a reference app for building with concepts on [sync-engine](https://github.com/mit-sdg/sync-engine). You create an account with a password, upload files, share them with other people, take a share back, and delete files.

This is the first step of ConceptBox's history: the Authenticating, Sessioning, Storing, and Sharing concepts, and the compositions that connect them. `src/concepts/` also holds Trashing, Labeling, Reasoning, and Consenting, written and tested, for the next steps. The next commits add a trash, an agent that describes and labels uploads, and signing in with Commons. The README in the last commit walks through the whole app and explains how to copy its parts.

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

- While you edit, run `bun run dev` and `bun run --cwd frontend dev`, and open http://localhost:5173.
- If `bun run storage` stops with an error about "Address already in use", Garage is already running, perhaps in another terminal.
- `bun run test` runs the tests. Some print errors on purpose; the last lines show how many passed.
- `bun run check` checks each concept's code against its specification, checks the generated files, and runs TypeScript.
