import { describe, expect, test } from "bun:test";
import { AlreadyTrashed, NotTrashed, Purged, TrashingConcept } from "../../src/concepts/Trashing/Trashing.ts";
import { testDatabase } from "../support/reusable/mongo.ts";
import { expectOneWinner } from "../support/reusable/race.ts";

async function setup() {
  const database = await testDatabase();
  let now = new Date("2026-10-07T14:00:00Z");
  const clock = () => now;
  const advance = (minutes: number) => (now = new Date(now.getTime() + minutes * 60_000));
  return { trashing: new TrashingConcept(database, "Trashing", clock), advance };
}

describe("Trashing", () => {
  test("its principle: Maya can restore what she trashed until she purges it", async () => {
    const { trashing, advance } = await setup();

    expect(await trashing.trash({ item: "old-draft" })).toEqual({ item: "old-draft" });
    expect(await trashing._trashed({ item: "old-draft" })).toEqual([{ trashedAt: new Date("2026-10-07T14:00:00Z") }]);
    expect(await trashing.restore({ item: "old-draft" })).toEqual({ item: "old-draft" });
    expect(await trashing._trashed({ item: "old-draft" })).toEqual([]);

    advance(5);
    await trashing.trash({ item: "budget" });
    expect(await trashing._trashed({ item: "budget" })).toEqual([{ trashedAt: new Date("2026-10-07T14:05:00Z") }]);

    advance(24 * 60);
    expect(await trashing.purge({ item: "budget" })).toEqual({ item: "budget" });
    expect(await trashing._trashed({ item: "budget" })).toEqual([]);

    const refusal = trashing.restore({ item: "budget" });
    await expect(refusal).rejects.toThrow(Purged);
    await expect(refusal).rejects.toThrow("This was deleted for good.");
  });

  test("Trashing refuses to trash an item twice, and its trashedAt stays the first one", async () => {
    const { trashing, advance } = await setup();
    await trashing.trash({ item: "draft" });
    advance(1);
    const refusal = trashing.trash({ item: "draft" });
    await expect(refusal).rejects.toThrow(AlreadyTrashed);
    await expect(refusal).rejects.toThrow("This is already in the trash.");
    expect(await trashing._trashed({ item: "draft" })).toEqual([{ trashedAt: new Date("2026-10-07T14:00:00Z") }]);
  });

  test("of eight trashings of one item at once, Trashing accepts one and refuses the others with ALREADY_TRASHED", async () => {
    const { trashing } = await setup();
    await expectOneWinner(
      Array.from({ length: 8 }, () => trashing.trash({ item: "draft" })),
      AlreadyTrashed,
    );
  });

  test("of two restores of one item at once, Trashing accepts one and refuses the other with NOT_TRASHED", async () => {
    const { trashing } = await setup();
    await trashing.trash({ item: "draft" });
    await expectOneWinner([trashing.restore({ item: "draft" }), trashing.restore({ item: "draft" })], NotTrashed);
    expect(await trashing._trashed({ item: "draft" })).toEqual([]);
  });

  test("of two purges of one item at once, Trashing accepts one and refuses the other with PURGED", async () => {
    const { trashing } = await setup();
    await trashing.trash({ item: "draft" });
    await expectOneWinner([trashing.purge({ item: "draft" }), trashing.purge({ item: "draft" })], Purged);
    await expect(trashing.restore({ item: "draft" })).rejects.toThrow(Purged);
  });

  test("a purged item can't be trashed, restored, or purged again", async () => {
    const { trashing } = await setup();
    await trashing.trash({ item: "draft" });
    await trashing.purge({ item: "draft" });
    await expect(trashing.trash({ item: "draft" })).rejects.toThrow(Purged);
    await expect(trashing.restore({ item: "draft" })).rejects.toThrow(Purged);
    await expect(trashing.purge({ item: "draft" })).rejects.toThrow(Purged);
  });

  test("Trashing refuses to restore or purge an item that isn't in the trash", async () => {
    const { trashing } = await setup();
    const refusal = trashing.restore({ item: "draft" });
    await expect(refusal).rejects.toThrow(NotTrashed);
    await expect(refusal).rejects.toThrow("This is not in the trash.");
    await expect(trashing.purge({ item: "draft" })).rejects.toThrow(NotTrashed);

    await trashing.trash({ item: "draft" });
    await trashing.restore({ item: "draft" });
    await expect(trashing.restore({ item: "draft" })).rejects.toThrow(NotTrashed);
    await expect(trashing.purge({ item: "draft" })).rejects.toThrow(NotTrashed);
  });
});
