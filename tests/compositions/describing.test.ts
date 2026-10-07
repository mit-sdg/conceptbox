import { describe, expect, test } from "bun:test";
import { answerFromFileName, createDescriber, type FileMaterial, readFile } from "../../src/agents/describer.ts";
import { type AnsweringClient, createAgent, type Reasoner, ReasonerFailure } from "../../src/agents/reusable/agent.ts";
import { scriptedReasoner } from "../../src/agents/reusable/reasoners.ts";
import { DESCRIPTION_ASK, LABELS_ASK } from "../../src/compositions/describing.ts";
import type { Session } from "../../src/concepts/Sessioning/Sessioning.ts";
import { startConceptBox } from "../support/app.ts";
import { eventually, ok } from "../support/reusable/results.ts";

const offline = scriptedReasoner(answerFromFileName);

/** ConceptBox with Maya signed up and describing on, and, given a reasoner, the describer answering with it. */
async function setup(reasoner?: Reasoner<FileMaterial>) {
  let app: Awaited<ReturnType<typeof startConceptBox>>;
  const describer = (reasoner: Reasoner<FileMaterial>) => createDescriber(reasoner, (url) => app.bucket.read(url));
  const agent = reasoner && describer(reasoner);
  app = await startConceptBox(agent ? [agent.observer] : []);
  if (agent) void agent.start({ application: app.application, api: app.api });
  /** Starts a session as the describer, for calling its endpoints by hand. */
  const signIn = async () => ok(await app.application.concepts.AgentSessioning.start({ subject: "describer" })).session;

  const maya = await app.register("maya");
  ok(await app.api.describing.on({ session: maya.session }));

  /** Maya's file as her box shows it now. */
  const myFile = async (file: string) => {
    const row = ok(await app.api.box({ session: maya.session })).myFiles.find((f) => f.file === file);
    if (row === undefined) throw new Error(`${file} isn't in Maya's box`);
    return row;
  };
  /** Waits until Maya's file in her box matches `expected`. */
  const describedAs = (file: string, expected: object) =>
    eventually(async () => expect(await myFile(file)).toMatchObject(expected));
  return { ...app, maya, signIn, describer, myFile, describedAs };
}

describe("Describing", () => {
  test("the agent describes and labels Maya's upload when she has describing on", async () => {
    const { maya, upload, describedAs } = await setup(offline);
    await describedAs(await upload(maya.session, "beach-sunset.jpg"), {
      descriptions: [{ answer: "An image file named beach-sunset.jpg.", stage: "CONCLUDED" }],
      labels: ["beach", "image", "sunset"],
      openQuestions: 0,
    });
  });

  test("only the agent's session can call the agent's endpoints, and the agent reads only the file of a prompt it took", async () => {
    const { api, application, maya, signIn, upload } = await setup();
    const photo = await upload(maya.session, "beach.jpg");
    const [question] = await application.concepts.Reasoning._about({ subject: photo });
    const prompt = question!.prompt;
    expect(await api.answers.open({ session: maya.session })).toEqual({ error: "NOT_SIGNED_IN" });
    expect(await api.answers.take({ session: maya.session, prompt })).toEqual({ error: "NOT_SIGNED_IN" });
    expect(await api.describing.file({ session: maya.session, prompt })).toEqual({ error: "NOT_SIGNED_IN" });

    const session = await signIn();
    expect(await api.describing.file({ session, prompt })).toEqual({ error: "NOT_TAKEN" });
    ok(await api.answers.take({ session, prompt }));
    expect(ok(await api.describing.file({ session, prompt }))).toMatchObject({ name: "beach.jpg", mediaType: "image/jpeg" });
    expect(await api.answers.take({ session, prompt })).toEqual({ error: "ALREADY_TAKEN" });
  });

  test("with describing off, no reaction asks about Maya's upload, and the describe endpoint refuses her", async () => {
    const { api, maya, upload } = await setup(offline);
    ok(await api.describing.off({ session: maya.session }));
    const photo = await upload(maya.session, "beach-sunset.jpg");
    const box = ok(await api.box({ session: maya.session }));
    expect(box.describing).toEqual({ on: false });
    expect(box.myFiles[0]).toMatchObject({ descriptions: [], labels: [], openQuestions: 0 });
    expect(await api.files.describe({ session: maya.session, file: photo })).toEqual({ error: "NOT_CONSENTED" });
  });

  test("when Maya turns describing off, a reaction abandons her questions that no reasoner has taken", async () => {
    const { api, maya, upload } = await setup();
    const photo = await upload(maya.session, "beach-sunset.jpg");
    expect(ok(await api.box({ session: maya.session })).myFiles[0]?.descriptions).toMatchObject([
      { stage: "WAITING" },
    ]);

    ok(await api.describing.off({ session: maya.session }));
    const [row] = ok(await api.box({ session: maya.session })).myFiles;
    expect(row?.file).toBe(photo);
    expect(row?.descriptions).toMatchObject([{ stage: "ABANDONED", reason: "You turned off “Describe uploads”." }]);
    expect(row?.openQuestions).toBe(0);
  });

  test("when the agent starts, it abandons the prompt it took before the restart", async () => {
    const { api, application, maya, signIn, describer, upload } = await setup();
    const photo = await upload(maya.session, "beach-sunset.jpg");
    const [question] = await application.concepts.Reasoning._about({ subject: photo });
    ok(await api.answers.take({ session: await signIn(), prompt: question!.prompt }));

    void describer(offline).start({ application, api });
    await eventually(async () =>
      expect(ok(await api.box({ session: maya.session })).myFiles[0]?.descriptions).toMatchObject([
        { stage: "ABANDONED", reason: "The agent stopped before the answer finished." },
      ]),
    );
  });

  test("when the agent's session ends, the agent signs in again and keeps answering", async () => {
    const { application, database, maya, upload, describedAs } = await setup(offline);
    await describedAs(await upload(maya.session, "beach.jpg"), { openQuestions: 0 });
    const sessions = database.collection<{ _id: Session }>("agentsessioning.sessions");
    const [first] = await sessions.find().toArray();
    ok(await application.concepts.AgentSessioning.end({ session: first!._id }));

    await describedAs(await upload(maya.session, "dunes.jpg"), { descriptions: [{ stage: "CONCLUDED" }], openQuestions: 0 });
    const now = await sessions.find().toArray();
    expect(now).toHaveLength(1);
    expect(now[0]!._id).not.toBe(first!._id);
  });

  test("when the agent can't reach the model, it abandons the prompt with that reason, and Maya asks again", async () => {
    let reachable = false;
    const flaky: Reasoner<FileMaterial> = {
      name: "flaky",
      async answer(ask, material, write) {
        if (!reachable) throw new ReasonerFailure("The model couldn't be reached.");
        await offline.answer(ask, material, write);
      },
    };
    const { api, maya, upload, describedAs } = await setup(flaky);
    const photo = await upload(maya.session, "beach-sunset.jpg");
    await describedAs(photo, {
      descriptions: [{ stage: "ABANDONED", reason: "The model couldn't be reached." }],
      labelQuestions: [{ stage: "ABANDONED" }],
    });

    reachable = true;
    ok(await api.files.describe({ session: maya.session, file: photo }));
    ok(await api.files.relabel({ session: maya.session, file: photo }));
    await describedAs(photo, {
      descriptions: [{ stage: "ABANDONED" }, { stage: "CONCLUDED" }],
      labels: ["beach", "image", "sunset"],
    });
  });

  test("asking again while the same question is still open doesn't ask it twice", async () => {
    const { api, maya, upload, myFile } = await setup();
    const photo = await upload(maya.session, "beach-sunset.jpg");
    expect((await myFile(photo)).openQuestions).toBe(2);
    for (let i = 0; i < 3; i++) {
      ok(await api.files.describe({ session: maya.session, file: photo }));
      ok(await api.files.relabel({ session: maya.session, file: photo }));
    }
    expect((await myFile(photo)).openQuestions).toBe(2);
  });

  test("however many lines the model writes, a file gets at most five labels", async () => {
    const chatty = scriptedReasoner<FileMaterial>((ask) => (ask === LABELS_ASK ? "a\nb\nc\nd\ne\nf\ng\nh" : "A file."));
    const { maya, upload, describedAs } = await setup(chatty);
    await describedAs(await upload(maya.session, "notes.txt"), { labels: ["a", "b", "c", "d", "e"] });
  });

  test("the label Maya removed stays removed when she asks for a new description", async () => {
    const { api, maya, upload, myFile, describedAs } = await setup(offline);
    const photo = await upload(maya.session, "beach-sunset.jpg");
    await describedAs(photo, { labels: ["beach", "image", "sunset"], openQuestions: 0 });
    ok(await api.files.unlabel({ session: maya.session, file: photo, label: "image" }));

    ok(await api.files.describe({ session: maya.session, file: photo }));
    await describedAs(photo, { descriptions: [{ stage: "CONCLUDED" }, { stage: "CONCLUDED" }], openQuestions: 0 });
    expect((await myFile(photo)).labels).toEqual(["beach", "sunset"]);
  });

  test("the agent describes and labels a burst of uploads, a few at a time", async () => {
    const { maya, upload, describedAs } = await setup(offline);
    const names = Array.from({ length: 12 }, (_, i) => `photo-${i}.jpg`);
    const files = await Promise.all(names.map((name) => upload(maya.session, name)));
    for (const [i, file] of files.entries()) {
      await describedAs(file, {
        descriptions: [{ answer: `An image file named ${names[i]}.`, stage: "CONCLUDED" }],
        labelQuestions: [{ stage: "CONCLUDED" }],
        openQuestions: 0,
      });
    }
  });

  test("Maya finds her files by label, a trashed file drops out of the search, and purging it removes its labels and descriptions", async () => {
    const { api, application, maya, upload, describedAs } = await setup(offline);
    const older = await upload(maya.session, "beach-day.jpg");
    const newer = await upload(maya.session, "beach-sunset.jpg");
    await describedAs(older, { labels: ["beach", "day", "image"] });
    await describedAs(newer, { labels: ["beach", "image", "sunset"] });

    expect(ok(await api.files.labeled({ session: maya.session, label: "beach" })).labeled).toMatchObject([
      { file: newer },
      { file: older },
    ]);

    ok(await api.files.trash({ session: maya.session, file: newer }));
    expect(ok(await api.files.labeled({ session: maya.session, label: "beach" })).labeled).toMatchObject([
      { file: older },
    ]);
    ok(await api.files.purge({ session: maya.session, file: newer }));
    await eventually(async () => expect(await application.concepts.Labeling._labels({ item: newer })).toEqual([]));
    expect(await application.concepts.Reasoning._about({ subject: newer })).toEqual([]);
    expect(await application.concepts.Reasoning._about({ subject: older })).toHaveLength(2);
  });

  test("two agents with their own names and questions answer side by side", async () => {
    const slow: Reasoner<FileMaterial> = {
      name: "slow",
      async answer(ask, material, write) {
        for (const word of answerFromFileName(ask, material).split(" ")) {
          await Bun.sleep(20);
          await write(`${word} `);
        }
      },
    };
    let app: Awaited<ReturnType<typeof startConceptBox>>;
    const read = readFile((url) => app.bucket.read(url));
    const describer = createAgent({ name: "describer", asks: [DESCRIPTION_ASK], reasoner: slow, read });
    const labeler = createAgent({ name: "labeler", asks: [LABELS_ASK], reasoner: slow, read });
    app = await startConceptBox([describer.observer, labeler.observer]);
    void describer.start({ application: app.application, api: app.api });
    void labeler.start({ application: app.application, api: app.api });
    const maya = await app.register("maya");
    ok(await app.api.describing.on({ session: maya.session }));
    const files = await Promise.all(Array.from({ length: 6 }, (_, i) => app.upload(maya.session, `photo-${i}.jpg`)));
    await eventually(async () => {
      const box = ok(await app.api.box({ session: maya.session }));
      expect(box.myFiles).toHaveLength(files.length);
      for (const row of box.myFiles) {
        expect(row).toMatchObject({ descriptions: [{ stage: "CONCLUDED" }], labelQuestions: [{ stage: "CONCLUDED" }] });
      }
    });
    const { Reasoning } = app.application.concepts;
    for (const file of files) {
      for (const { prompt, ask } of await Reasoning._about({ subject: file })) {
        expect(await Reasoning._reasoner({ prompt })).toEqual([{ reasoner: ask === DESCRIPTION_ASK ? "describer" : "labeler" }]);
      }
    }
  });

  test("the agent's session is refused at every person's endpoint", async () => {
    const { api, signIn } = await setup();
    const session = await signIn();
    expect(await api.auth.me({ session })).toEqual({ error: "NOT_SIGNED_IN" });
    expect(await api.describing.on({ session })).toEqual({ error: "NOT_SIGNED_IN" });
    expect(await api.files.start({ session, name: "notes.txt", mediaType: "text/plain" })).toEqual({ error: "NOT_SIGNED_IN" });
  });

  test("when taking a prompt keeps failing, the agent waits to be woken instead of retrying at once", async () => {
    let app: Awaited<ReturnType<typeof startConceptBox>>;
    const describer = createDescriber(offline, (url) => app.bucket.read(url));
    app = await startConceptBox([describer.observer]);
    let takes = 0;
    const real = app.api.answers;
    const failing: AnsweringClient = {
      answers: {
        open: real.open,
        async take() {
          takes++;
          return { error: "INTERNAL_ERROR" };
        },
        extend: real.extend,
        conclude: real.conclude,
        abandon: real.abandon,
      },
    };
    void describer.start({ application: app.application, api: { ...failing, describing: app.api.describing } });
    const maya = await app.register("maya");
    ok(await app.api.describing.on({ session: maya.session }));
    await app.upload(maya.session, "photo.jpg");
    await Bun.sleep(500);
    expect(takes).toBeLessThan(10);
  });
});
