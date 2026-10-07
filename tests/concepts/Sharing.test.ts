import { describe, expect, test } from "bun:test";
import { AlreadyShared, NotShared, SharingConcept } from "../../src/concepts/Sharing/Sharing.ts";
import { testDatabase } from "../support/reusable/mongo.ts";
import { expectOneWinner } from "../support/reusable/race.ts";

async function setup() {
  const database = await testDatabase();
  return { sharing: new SharingConcept(database) };
}

describe("Sharing", () => {
  test("its principle: Maya shares beach.jpg with Sam and Ada, and revoking Sam's access leaves Ada's", async () => {
    const { sharing } = await setup();

    expect(await sharing.share({ item: "beach.jpg", recipient: "sam" })).toEqual({
      item: "beach.jpg",
      recipient: "sam",
    });
    expect(await sharing._sharedWith({ recipient: "sam" })).toEqual([{ item: "beach.jpg" }]);

    await sharing.share({ item: "beach.jpg", recipient: "ada" });
    expect(await sharing._recipients({ item: "beach.jpg" })).toEqual(expect.arrayContaining([{ recipient: "sam" }, { recipient: "ada" }]));

    expect(await sharing.revoke({ item: "beach.jpg", recipient: "sam" })).toEqual({
      item: "beach.jpg",
      recipient: "sam",
    });
    expect(await sharing._sharedWith({ recipient: "sam" })).toEqual([]);
    expect(await sharing._sharedWith({ recipient: "ada" })).toEqual([{ item: "beach.jpg" }]);
    expect(await sharing._recipients({ item: "beach.jpg" })).toEqual([{ recipient: "ada" }]);
  });

  test("_sharedWith returns every item shared with a person", async () => {
    const { sharing } = await setup();
    for (const item of ["c.txt", "a.txt", "b.txt"]) await sharing.share({ item, recipient: "sam" });
    const items = await sharing._sharedWith({ recipient: "sam" });
    expect(items.map(({ item }) => item).sort()).toEqual(["a.txt", "b.txt", "c.txt"]);
    expect(await sharing._recipients({ item: "unshared.txt" })).toEqual([]);
  });

  test("Sharing refuses to share the same thing with the same person twice", async () => {
    const { sharing } = await setup();
    await sharing.share({ item: "beach.jpg", recipient: "sam" });
    const refusal = sharing.share({ item: "beach.jpg", recipient: "sam" });
    await expect(refusal).rejects.toThrow(AlreadyShared);
    await expect(refusal).rejects.toThrow("This is already shared with that person.");
    expect(await sharing._recipients({ item: "beach.jpg" })).toEqual([{ recipient: "sam" }]);
  });

  test("of two shares of one thing with one person at once, Sharing accepts one and refuses the other with ALREADY_SHARED", async () => {
    const { sharing } = await setup();
    const access = { item: "beach.jpg", recipient: "sam" };
    await expectOneWinner([sharing.share(access), sharing.share(access)], AlreadyShared);
    expect(await sharing._recipients({ item: "beach.jpg" })).toEqual([{ recipient: "sam" }]);
  });

  test("Sharing refuses to revoke access nobody gave or someone already took back", async () => {
    const { sharing } = await setup();
    const refusal = sharing.revoke({ item: "beach.jpg", recipient: "sam" });
    await expect(refusal).rejects.toThrow(NotShared);
    await expect(refusal).rejects.toThrow("This is not shared with that person.");
    await sharing.share({ item: "beach.jpg", recipient: "sam" });
    await sharing.revoke({ item: "beach.jpg", recipient: "sam" });
    await expect(sharing.revoke({ item: "beach.jpg", recipient: "sam" })).rejects.toThrow(NotShared);
  });

  test("of two revokes of one access at once, Sharing accepts one and refuses the other with NOT_SHARED", async () => {
    const { sharing } = await setup();
    const access = { item: "beach.jpg", recipient: "sam" };
    await sharing.share(access);
    await expectOneWinner([sharing.revoke(access), sharing.revoke(access)], NotShared);
  });
});
