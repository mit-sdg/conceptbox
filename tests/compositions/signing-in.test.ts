import { describe, expect, test } from "bun:test";
import { startConceptBox } from "../support/app.ts";
import { ok } from "../support/reusable/results.ts";

const SAM = { subject: "u7f3", username: "sam" };
const LEO = { subject: "u2b9", username: "leo" };

describe("Signing in", () => {
  test("Ben signs up with a password, Sam signs in with Commons, and Maya shares beach.jpg with both by username", async () => {
    const { api, register, signInWithCommons, upload } = await startConceptBox();
    const maya = await register("maya");
    const ben = await register("ben");
    const sam = ok((await signInWithCommons(SAM)).result);
    expect(await api.auth.me({ session: sam.session })).toEqual({ username: "sam" });

    const photo = await upload(maya.session, "beach.jpg");
    ok(await api.files.share({ session: maya.session, file: photo, username: "sam" }));
    ok(await api.files.share({ session: maya.session, file: photo, username: "ben" }));

    for (const session of [sam.session, ben.session]) {
      expect(ok(await api.box({ session })).sharedWithMe).toMatchObject([
        { file: photo, name: "beach.jpg", ownerName: "maya" },
      ]);
    }
    expect(ok(await api.box({ session: maya.session })).myFiles[0]?.sharedWith).toEqual(
      expect.arrayContaining([
        { recipient: sam.user, username: "sam" },
        { recipient: ben.user, username: "ben" },
      ]),
    );
  });

  test("Sam comes back with Commons after his Commons username changes, and reaches the same box as `sam`", async () => {
    const { api, signInWithCommons, upload } = await startConceptBox();
    const first = ok((await signInWithCommons(SAM)).result);
    const photo = await upload(first.session, "notes.jpg");

    const again = ok((await signInWithCommons({ subject: SAM.subject, username: "samuel" })).result);
    expect(again.user).toBe(first.user);
    expect(await api.auth.me({ session: again.session })).toEqual({ username: "sam" });
    expect(ok(await api.box({ session: again.session })).myFiles).toMatchObject([{ file: photo }]);
  });

  test("when Ben already took `sam`, Sam chooses another username, and his next sign-in reaches it", async () => {
    const { api, register, signInWithCommons } = await startConceptBox();
    const ben = await register("sam");

    const { attempt, result } = await signInWithCommons(SAM);
    expect(result).toEqual({ error: "USERNAME_TAKEN" });
    expect(await api.auth.commons.choose({ attempt, username: "sam" })).toEqual({ error: "USERNAME_TAKEN" });
    expect(await api.auth.commons.choose({ attempt, username: "s" })).toEqual({ error: "INVALID_USERNAME" });
    const sam = ok(await api.auth.commons.choose({ attempt, username: "sam-lee" }));
    expect(sam.user).not.toBe(ben.user);
    expect(await api.auth.me({ session: sam.session })).toEqual({ username: "sam-lee" });

    expect(await api.auth.commons.choose({ attempt, username: "sam-two" })).toEqual({ error: "SIGN_IN_EXPIRED" });
    const again = ok((await signInWithCommons(SAM)).result);
    expect(again.user).toBe(sam.user);
  });

  test("when Sam's Commons username is too short for a username here, he chooses another", async () => {
    const { api, signInWithCommons } = await startConceptBox();
    const { attempt, result } = await signInWithCommons({ subject: "u7f3", username: "sa" });
    expect(result).toEqual({ error: "INVALID_USERNAME" });
    const sam = ok(await api.auth.commons.choose({ attempt, username: "sam" }));
    expect(await api.auth.me({ session: sam.session })).toEqual({ username: "sam" });
  });

  test("Leo's link finishes no sign-in in Sam's browser, with Sam's own attempt or with none, and Leo's code still works for Leo", async () => {
    const { api, commons } = await startConceptBox();
    const leos = ok(await api.auth.commons.start({}));
    const { code, state } = commons.approve(leos.address, LEO);

    const sams = ok(await api.auth.commons.start({}));
    expect(await api.auth.commons.finish({ attempt: sams.attempt, state, code })).toEqual({ error: "SIGN_IN_EXPIRED" });
    expect(await api.auth.commons.finish({ attempt: null as never, state, code })).toEqual({ error: "SIGN_IN_EXPIRED" });
    expect(await api.auth.commons.choose({ attempt: null as never, username: "leo" })).toEqual({ error: "SIGN_IN_EXPIRED" });

    const leo = ok(await api.auth.commons.finish({ attempt: leos.attempt, state, code }));
    expect(await api.auth.me({ session: leo.session })).toEqual({ username: "leo" });
  });

  test("an attempt older than ten minutes can't be finished, and choosing a username for it registers nobody", async () => {
    const { api, commons, database, register, signInWithCommons } = await startConceptBox();
    const attempts = database.collection("commonsfederating.attempts");
    const expire = (attempt: string) => attempts.updateOne({ _id: attempt as never }, { $set: { expiresAt: new Date(0) } });

    const { attempt, address } = ok(await api.auth.commons.start({}));
    const { code, state } = commons.approve(address, SAM);
    await expire(attempt);
    expect(await api.auth.commons.finish({ attempt, state, code })).toEqual({ error: "SIGN_IN_EXPIRED" });

    await register("sam");
    const taken = await signInWithCommons(SAM);
    expect(taken.result).toEqual({ error: "USERNAME_TAKEN" });
    await expire(taken.attempt);
    expect(await api.auth.commons.choose({ attempt: taken.attempt, username: "sam-lee" })).toEqual({
      error: "SIGN_IN_EXPIRED",
    });
    expect(ok(await api.auth.register({ username: "sam-lee", password: "correct horse" })).user).toBeString();
  });

  test("a code Commons refuses signs nobody in and registers nobody", async () => {
    const { api, register } = await startConceptBox();
    const { attempt, address } = ok(await api.auth.commons.start({}));
    const state = new URL(address).searchParams.get("state") ?? "";
    expect(await api.auth.commons.finish({ attempt, state, code: "a-code-commons-never-issued" })).toEqual({
      error: "SIGN_IN_REFUSED",
    });
    expect(ok(await register("sam")).user).toBeString();
  });

  test("a 5-character password is refused before `ben` is registered, so Ben can sign up again", async () => {
    const { api } = await startConceptBox();
    expect(await api.auth.register({ username: "ben", password: "short" })).toEqual({ error: "INVALID_PASSWORD" });
    const ben = ok(await api.auth.register({ username: "ben", password: "correct horse" }));
    expect(await api.auth.me({ session: ben.session })).toEqual({ username: "ben" });
  });

  test("nobody signs up or signs in with a password as Sam, who signed in with Commons", async () => {
    const { api, signInWithCommons } = await startConceptBox();
    ok((await signInWithCommons(SAM)).result);
    expect(await api.auth.register({ username: "sam", password: "leos-password" })).toEqual({ error: "USERNAME_TAKEN" });
    expect(await api.auth.login({ username: "sam", password: "leos-password" })).toEqual({ error: "INVALID_CREDENTIALS" });
  });

  test("a username nobody has gets the same refusal as a wrong password", async () => {
    const { api, register } = await startConceptBox();
    await register("ben");
    expect(await api.auth.login({ username: "ben", password: "guessed-password" })).toEqual({ error: "INVALID_CREDENTIALS" });
    expect(await api.auth.login({ username: "nobody", password: "guessed-password" })).toEqual({ error: "INVALID_CREDENTIALS" });
  });
});
