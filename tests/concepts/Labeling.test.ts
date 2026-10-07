import { describe, expect, test } from "bun:test";
import {
  AlreadyLabeled,
  InvalidLabel,
  LabelingConcept,
  NotLabeled,
} from "../../src/concepts/Labeling/Labeling.ts";
import { testDatabase } from "../support/reusable/mongo.ts";
import { expectOneWinner } from "../support/reusable/race.ts";

async function setup() {
  const database = await testDatabase();
  return { labeling: new LabelingConcept(database) };
}

describe("Labeling", () => {
  test("its principle: Maya finds every item she labeled summer, and beach.jpg drops out once she removes its label", async () => {
    const { labeling } = await setup();

    expect(await labeling.label({ item: "beach.jpg", name: "beach" })).toEqual({ item: "beach.jpg" });
    await labeling.label({ item: "beach.jpg", name: "summer" });
    await labeling.label({ item: "picnic.jpg", name: "summer" });
    expect(await labeling._labeled({ name: "summer" })).toEqual(expect.arrayContaining([{ item: "beach.jpg" }, { item: "picnic.jpg" }]));
    expect(await labeling._labels({ item: "beach.jpg" })).toEqual([{ name: "beach" }, { name: "summer" }]);

    expect(await labeling.remove({ item: "beach.jpg", name: "summer" })).toEqual({ item: "beach.jpg" });
    expect(await labeling._labeled({ name: "summer" })).toEqual([{ item: "picnic.jpg" }]);

    const refusal = labeling.label({ item: "beach.jpg", name: "Beach" });
    await expect(refusal).rejects.toThrow(AlreadyLabeled);
    await expect(refusal).rejects.toThrow("This already has that label.");
  });

  test("Labeling stores names trimmed and lowercase, and compares them the same way", async () => {
    const { labeling } = await setup();
    expect(await labeling.label({ item: "a", name: "  Summer " })).toEqual({ item: "a" });
    expect(await labeling._labels({ item: "a" })).toEqual([{ name: "summer" }]);
    expect(await labeling._labeled({ name: " SUMMER" })).toEqual([{ item: "a" }]);
    expect(await labeling.remove({ item: "a", name: "SUMMER  " })).toEqual({ item: "a" });
    expect(await labeling._labels({ item: "a" })).toEqual([]);
  });

  test("a label must have 1 to 40 characters once trimmed", async () => {
    const { labeling } = await setup();
    const refusal = labeling.label({ item: "a", name: "   " });
    await expect(refusal).rejects.toThrow(InvalidLabel);
    await expect(refusal).rejects.toThrow("A label must have 1 to 40 characters.");
    await expect(labeling.label({ item: "a", name: "x".repeat(41) })).rejects.toThrow(InvalidLabel);
    expect(await labeling.label({ item: "a", name: ` ${"x".repeat(40)} ` })).toEqual({ item: "a" });
    expect(await labeling._labels({ item: "a" })).toEqual([{ name: "x".repeat(40) }]);
  });

  test("Labeling refuses the same label on one item twice, even at once", async () => {
    const { labeling } = await setup();
    await expectOneWinner(
      [labeling.label({ item: "a", name: "beach" }), labeling.label({ item: "a", name: "BEACH" })],
      AlreadyLabeled,
    );
    expect(await labeling._labels({ item: "a" })).toEqual([{ name: "beach" }]);
  });

  test("Labeling refuses to remove a label the item doesn't have, including one already removed", async () => {
    const { labeling } = await setup();
    const refusal = labeling.remove({ item: "a", name: "beach" });
    await expect(refusal).rejects.toThrow(NotLabeled);
    await expect(refusal).rejects.toThrow("This doesn't have that label.");
    await labeling.label({ item: "a", name: "beach" });
    await labeling.remove({ item: "a", name: "beach" });
    await expect(labeling.remove({ item: "a", name: "beach" })).rejects.toThrow(NotLabeled);
  });

  test("of two removals of one label at once, Labeling accepts one and refuses the other with NOT_LABELED", async () => {
    const { labeling } = await setup();
    await labeling.label({ item: "a", name: "beach" });
    await expectOneWinner(
      [labeling.remove({ item: "a", name: "beach" }), labeling.remove({ item: "a", name: "Beach" })],
      NotLabeled,
    );
  });
});
