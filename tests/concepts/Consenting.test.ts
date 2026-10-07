import { describe, expect, test } from "bun:test";
import {
  AlreadyConsented,
  ConsentingConcept,
  NotConsented,
} from "../../src/concepts/Consenting/Consenting.ts";
import { testDatabase } from "../support/reusable/mongo.ts";
import { expectOneWinner } from "../support/reusable/race.ts";

async function setup() {
  const database = await testDatabase();
  return { consenting: new ConsentingConcept(database) };
}

describe("Consenting", () => {
  test("its principle: Maya's consent counts from when she gives it until she withdraws it", async () => {
    const { consenting } = await setup();

    expect(await consenting.consent({ person: "maya", use: "description" })).toEqual({
      person: "maya",
      use: "description",
    });
    expect(await consenting._consented({ person: "maya", use: "description" })).toEqual({ consented: true });

    expect(await consenting.withdraw({ person: "maya", use: "description" })).toEqual({
      person: "maya",
      use: "description",
    });
    expect(await consenting._consented({ person: "maya", use: "description" })).toEqual({ consented: false });

    expect(await consenting._consented({ person: "sam", use: "description" })).toEqual({ consented: false });

    const refusal = consenting.withdraw({ person: "maya", use: "description" });
    await expect(refusal).rejects.toThrow(NotConsented);
    await expect(refusal).rejects.toThrow("You haven't consented to this.");
  });

  test("one person's consent to one use doesn't extend to another person or another use", async () => {
    const { consenting } = await setup();
    await consenting.consent({ person: "maya", use: "description" });
    expect(await consenting._consented({ person: "sam", use: "description" })).toEqual({ consented: false });
    expect(await consenting._consented({ person: "maya", use: "training" })).toEqual({ consented: false });
  });

  test("a person can't consent to the same use twice", async () => {
    const { consenting } = await setup();
    await consenting.consent({ person: "maya", use: "description" });
    const refusal = consenting.consent({ person: "maya", use: "description" });
    await expect(refusal).rejects.toThrow(AlreadyConsented);
    await expect(refusal).rejects.toThrow("You have already consented to this.");
    expect(await consenting._consented({ person: "maya", use: "description" })).toEqual({ consented: true });
  });

  test("of two consents to one use at once, Consenting accepts one, so one withdrawal takes the consent back", async () => {
    const { consenting } = await setup();
    await expectOneWinner(
      [
        consenting.consent({ person: "maya", use: "description" }),
        consenting.consent({ person: "maya", use: "description" }),
      ],
      AlreadyConsented,
    );
    await consenting.withdraw({ person: "maya", use: "description" });
    expect(await consenting._consented({ person: "maya", use: "description" })).toEqual({ consented: false });
  });

  test("a person can't withdraw a consent they never gave", async () => {
    const { consenting } = await setup();
    await expect(consenting.withdraw({ person: "sam", use: "description" })).rejects.toThrow(NotConsented);
  });
});
