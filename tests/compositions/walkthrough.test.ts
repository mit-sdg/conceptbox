import { describe, expect, test } from "bun:test";
import { startConceptBox } from "../support/app.ts";
import { ok } from "../support/reusable/results.ts";

describe("ConceptBox", () => {
  test("Maya uploads a photo, shares it with Sam and Ada, Sam downloads it, and Maya deletes it for good", async () => {
    const { api, application, register, upload } = await startConceptBox();
    const maya = await register("maya");
    const sam = await register("sam");
    const ada = await register("ada");

    const photo = await upload(maya.session, "beach.jpg");
    expect(ok(await api.box({ session: maya.session })).myFiles).toMatchObject([
      { file: photo, name: "beach.jpg", size: 1_000, sharedWith: [] },
    ]);

    expect(await api.files.download({ session: sam.session, file: photo })).toEqual({ error: "NOT_FOUND" });
    ok(await api.files.share({ session: maya.session, file: photo, username: "sam" }));
    ok(await api.files.share({ session: maya.session, file: photo, username: "ada" }));

    expect(ok(await api.box({ session: sam.session })).sharedWithMe).toMatchObject([
      { file: photo, name: "beach.jpg", ownerName: "maya" },
    ]);
    expect(ok(await api.files.download({ session: sam.session, file: photo })).url).toContain("beach.jpg");
    expect(ok(await api.box({ session: maya.session })).myFiles[0]?.sharedWith).toEqual(
      expect.arrayContaining([
        { recipient: sam.user, username: "sam" },
        { recipient: ada.user, username: "ada" },
      ]),
    );

    ok(await api.files.trash({ session: maya.session, file: photo }));
    ok(await api.files.purge({ session: maya.session, file: photo }));
    await application.whenIdle();
    expect(ok(await api.box({ session: maya.session })).myFiles).toEqual([]);
    expect(ok(await api.box({ session: sam.session })).sharedWithMe).toEqual([]);
    expect(ok(await api.box({ session: ada.session })).sharedWithMe).toEqual([]);
    expect(await application.concepts.Sharing._recipients({ item: photo })).toEqual([]);
    expect(await api.files.download({ session: sam.session, file: photo })).toEqual({ error: "NOT_FOUND" });
  });

  test("Sam can't share, delete, or revoke access to Maya's photo, and Maya can revoke his access", async () => {
    const { api, register, upload } = await startConceptBox();
    const maya = await register("maya");
    const sam = await register("sam");
    const photo = await upload(maya.session, "beach.jpg");

    expect(await api.files.share({ session: sam.session, file: photo, username: "sam" })).toEqual({ error: "NOT_FOUND" });
    expect(await api.files.trash({ session: sam.session, file: photo })).toEqual({ error: "NOT_FOUND" });
    ok(await api.files.share({ session: maya.session, file: photo, username: "sam" }));
    expect(await api.files.revoke({ session: sam.session, file: photo, recipient: sam.user })).toEqual({
      error: "NOT_FOUND",
    });

    ok(await api.files.revoke({ session: maya.session, file: photo, recipient: sam.user }));
    expect(ok(await api.box({ session: sam.session })).sharedWithMe).toEqual([]);
  });

  test("Sam can't finish an upload Maya started", async () => {
    const { api, bucket, register } = await startConceptBox();
    const maya = await register("maya");
    const sam = await register("sam");
    const { file, uploadUrl } = ok(await api.files.start({ session: maya.session, name: "beach.jpg", mediaType: "image/jpeg" }));
    bucket.send(uploadUrl, new Uint8Array(3));
    expect(await api.files.finish({ session: sam.session, file })).toEqual({ error: "FILE_NOT_FOUND" });
    ok(await api.files.finish({ session: maya.session, file }));
  });

  test("Sam can view Maya's photo once she shares it, but nobody can view her notes as an image", async () => {
    const { api, register, upload } = await startConceptBox();
    const maya = await register("maya");
    const sam = await register("sam");
    const photo = await upload(maya.session, "beach.jpg");
    const notes = await upload(maya.session, "notes.html", "text/html");

    expect(ok(await api.box({ session: maya.session })).myFiles).toMatchObject([
      { name: "notes.html", mediaType: "text/html" },
      { name: "beach.jpg", mediaType: "image/jpeg" },
    ]);
    expect(await api.files.view({ session: sam.session, file: photo })).toEqual({ error: "NOT_FOUND" });
    ok(await api.files.share({ session: maya.session, file: photo, username: "sam" }));
    expect(ok(await api.files.view({ session: sam.session, file: photo })).url).toContain("image%2Fjpeg");
    expect(await api.files.view({ session: maya.session, file: notes })).toEqual({ error: "NOT_FOUND" });
  });

  test("the share dialog suggests the people Maya shared with and the people who shared with her", async () => {
    const { api, register, upload } = await startConceptBox();
    const maya = await register("maya");
    const sam = await register("sam");
    const ada = await register("ada");
    await register("ben");
    const photo = await upload(maya.session, "beach.jpg");
    const notes = await upload(maya.session, "notes.pdf", "application/pdf");
    const plan = await upload(ada.session, "plan.pdf", "application/pdf");

    expect(ok(await api.people({ session: maya.session })).people).toEqual([]);
    ok(await api.files.share({ session: maya.session, file: photo, username: "sam" }));
    ok(await api.files.share({ session: maya.session, file: notes, username: "sam" }));
    ok(await api.files.share({ session: ada.session, file: plan, username: "maya" }));

    expect(ok(await api.people({ session: maya.session })).people).toEqual([
      { person: sam.user, username: "sam" },
      { person: ada.user, username: "ada" },
    ]);
    expect(ok(await api.people({ session: sam.session })).people).toEqual([{ person: maya.user, username: "maya" }]);
  });

  test("Maya can't share her photo with herself", async () => {
    const { api, register, upload } = await startConceptBox();
    const maya = await register("maya");
    const photo = await upload(maya.session, "beach.jpg");
    expect(await api.files.share({ session: maya.session, file: photo, username: "maya" })).toEqual({
      error: "SHARING_WITH_YOURSELF",
    });
  });

  test("Maya can't share with a username nobody has, or with Sam twice", async () => {
    const { api, register, upload } = await startConceptBox();
    const maya = await register("maya");
    await register("sam");
    const photo = await upload(maya.session, "beach.jpg");

    expect(await api.files.share({ session: maya.session, file: photo, username: "ben" })).toEqual({
      error: "USER_NOT_FOUND",
    });
    ok(await api.files.share({ session: maya.session, file: photo, username: "sam" }));
    expect(await api.files.share({ session: maya.session, file: photo, username: "sam" })).toMatchObject({
      error: "ALREADY_SHARED",
    });
  });

  test("registering a 33-character username returns Authenticating's INVALID_USERNAME", async () => {
    const { api } = await startConceptBox();
    expect(await api.auth.register({ username: "m".repeat(33), password: "correct horse" })).toMatchObject({
      error: "INVALID_USERNAME",
    });
  });

  test("finishing an upload over 25 MB returns TOO_LARGE and deletes its bytes", async () => {
    const { api, application, bucket, register } = await startConceptBox();
    const maya = await register("maya");
    const { file, uploadUrl } = ok(await api.files.start({ session: maya.session, name: "film.mov", mediaType: "video/quicktime" }));
    bucket.send(uploadUrl, new Uint8Array(25_000_001));
    expect(await api.files.finish({ session: maya.session, file })).toMatchObject({ error: "TOO_LARGE" });
    await application.whenIdle();
    expect(bucket.objects.size).toBe(0);
  });

  test("finishing an upload before its bytes arrive returns NOT_UPLOADED, and Maya's box stays empty", async () => {
    const { api, register } = await startConceptBox();
    const maya = await register("maya");
    const { file } = ok(await api.files.start({ session: maya.session, name: "notes.pdf", mediaType: "application/pdf" }));
    expect(await api.files.finish({ session: maya.session, file })).toMatchObject({ error: "NOT_UPLOADED" });
    expect(ok(await api.box({ session: maya.session })).myFiles).toEqual([]);
  });

  test("when Maya trashes a shared photo it leaves both boxes and Sam can't download it, and when she restores it Sam can read it again", async () => {
    const { api, register, upload } = await startConceptBox();
    const maya = await register("maya");
    const sam = await register("sam");
    const photo = await upload(maya.session, "beach.jpg");
    ok(await api.files.share({ session: maya.session, file: photo, username: "sam" }));

    ok(await api.files.trash({ session: maya.session, file: photo }));
    const mayasBox = ok(await api.box({ session: maya.session }));
    expect(mayasBox.myFiles).toEqual([]);
    expect(mayasBox.myTrash).toMatchObject([{ file: photo, name: "beach.jpg" }]);
    expect(ok(await api.box({ session: sam.session })).sharedWithMe).toEqual([]);
    expect(await api.files.download({ session: sam.session, file: photo })).toEqual({ error: "NOT_FOUND" });

    ok(await api.files.restore({ session: maya.session, file: photo }));
    expect(ok(await api.box({ session: maya.session })).myTrash).toEqual([]);
    expect(ok(await api.box({ session: sam.session })).sharedWithMe).toMatchObject([{ file: photo }]);

    ok(await api.files.trash({ session: maya.session, file: photo }));
    ok(await api.files.purge({ session: maya.session, file: photo }));
    expect(await api.files.restore({ session: maya.session, file: photo })).toEqual({ error: "NOT_FOUND" });
  });

  test("Maya can't purge a photo that isn't in the trash", async () => {
    const { api, register, upload } = await startConceptBox();
    const maya = await register("maya");
    const photo = await upload(maya.session, "beach.jpg");

    expect(await api.files.purge({ session: maya.session, file: photo })).toEqual({ error: "NOT_TRASHED" });
    expect(ok(await api.box({ session: maya.session })).myFiles).toMatchObject([{ file: photo }]);
  });

  test("when the bucket fails during a purge, the photo stays in Maya's trash and Sam still can't read it", async () => {
    const { api, application, bucket, register, upload } = await startConceptBox();
    const maya = await register("maya");
    const sam = await register("sam");
    const photo = await upload(maya.session, "beach.jpg");
    ok(await api.files.share({ session: maya.session, file: photo, username: "sam" }));
    ok(await api.files.trash({ session: maya.session, file: photo }));

    const remove = bucket.remove.bind(bucket);
    bucket.remove = async () => {
      bucket.remove = remove;
      throw new Error("The bucket is unavailable.");
    };
    expect(await api.files.purge({ session: maya.session, file: photo })).toMatchObject({ error: expect.any(String) });
    await application.whenIdle();
    expect(ok(await api.box({ session: maya.session })).myTrash).toMatchObject([{ file: photo }]);
    expect(ok(await api.box({ session: sam.session })).sharedWithMe).toEqual([]);
    expect(await api.files.download({ session: sam.session, file: photo })).toEqual({ error: "NOT_FOUND" });

    ok(await api.files.purge({ session: maya.session, file: photo }));
    await application.whenIdle();
    expect(ok(await api.box({ session: maya.session })).myTrash).toEqual([]);
  });

  test("signing out ends Maya's session, and only her own password signs her in again", async () => {
    const { api, register } = await startConceptBox();
    const maya = await register("maya");
    expect(ok(await api.auth.me({ session: maya.session }))).toEqual({ username: "maya" });

    ok(await api.auth.logout({ session: maya.session }));
    expect(await api.box({ session: maya.session })).toMatchObject({ error: "NOT_SIGNED_IN" });
    expect(await api.auth.login({ username: "maya", password: "wrong password" })).toMatchObject({
      error: "INVALID_CREDENTIALS",
    });
    const again = ok(await api.auth.login({ username: "maya", password: "correct horse" }));
    expect(ok(await api.auth.me({ session: again.session })).username).toBe("maya");
  });
});
