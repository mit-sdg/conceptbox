import { describe, expect, test } from "bun:test";
import {
  AuthenticatingConcept,
  InvalidCredentials,
  InvalidPassword,
  InvalidUsername,
  type User,
  UsernameTaken,
} from "../../src/concepts/Authenticating/Authenticating.ts";
import { testDatabase } from "../support/reusable/mongo.ts";
import { expectOneWinner } from "../support/reusable/race.ts";

async function setup() {
  const database = await testDatabase();
  return { authenticating: new AuthenticatingConcept(database), database };
}

describe("Authenticating", () => {
  test("its principle: Maya signs in again with her password, and a wrong password and an unknown username get the same refusal", async () => {
    const { authenticating } = await setup();

    const { user: maya } = await authenticating.register({ username: "maya", password: "sea-shells-42" });
    expect(await authenticating._byUsername({ username: "maya" })).toEqual([{ user: maya }]);
    expect(await authenticating._username({ user: maya })).toEqual([{ username: "maya" }]);

    expect(await authenticating.authenticate({ username: "maya", password: "sea-shells-42" })).toEqual({
      user: maya,
    });

    await expect(authenticating.register({ username: "maya", password: "another-password" })).rejects.toThrow(
      UsernameTaken,
    );

    const wrongPassword = authenticating.authenticate({ username: "maya", password: "guessed-password" });
    await expect(wrongPassword).rejects.toThrow(InvalidCredentials);
    await expect(wrongPassword).rejects.toThrow("The username or password is incorrect.");
    const unknownUser = authenticating.authenticate({ username: "nobody", password: "guessed-password" });
    await expect(unknownUser).rejects.toThrow(InvalidCredentials);
    await expect(unknownUser).rejects.toThrow("The username or password is incorrect.");
  });

  test("Authenticating stores an argon2id hash, never the password", async () => {
    const { authenticating, database } = await setup();
    const { user } = await authenticating.register({ username: "maya", password: "sea-shells-42" });
    const users = database.collection<{ _id: string; verifier: string }>("authenticating.users");
    const stored = await users.findOne({ _id: user });
    expect(user).not.toBe("maya");
    expect(JSON.stringify(stored)).not.toContain("sea-shells-42");
    expect(stored?.verifier).toStartWith("$argon2id$");
  });

  test("a username must have 3 to 32 ASCII letters, digits, underscores, or hyphens", async () => {
    const { authenticating } = await setup();
    for (const username of ["ma", "x".repeat(33), "maya lee", "maya!", ""]) {
      await expect(authenticating.register({ username, password: "sea-shells-42" })).rejects.toThrow(
        InvalidUsername,
      );
    }
    for (const username of ["abc", "x".repeat(32), "maya_lee-2"]) {
      await authenticating.register({ username, password: "sea-shells-42" });
    }
  });

  test("a password must have 8 to 128 characters", async () => {
    const { authenticating } = await setup();
    await expect(authenticating.register({ username: "maya", password: "short12" })).rejects.toThrow(
      InvalidPassword,
    );
    await expect(authenticating.register({ username: "maya", password: "p".repeat(129) })).rejects.toThrow(
      InvalidPassword,
    );
    expect(await authenticating._byUsername({ username: "maya" })).toEqual([]);
  });

  test("register refuses a short password with INVALID_PASSWORD even when the username is taken", async () => {
    const { authenticating } = await setup();
    await authenticating.register({ username: "maya", password: "sea-shells-42" });
    await expect(authenticating.register({ username: "maya", password: "short12" })).rejects.toThrow(InvalidPassword);
  });

  test("of two registrations of one username at once, Authenticating accepts one and refuses the other with USERNAME_TAKEN", async () => {
    const { authenticating } = await setup();
    await expectOneWinner(
      [
        authenticating.register({ username: "maya", password: "sea-shells-42" }),
        authenticating.register({ username: "maya", password: "other-password" }),
      ],
      UsernameTaken,
    );
  });

  test("_username and _byUsername return no row for an unknown user or username", async () => {
    const { authenticating } = await setup();
    expect(await authenticating._username({ user: "missing" as User })).toEqual([]);
    expect(await authenticating._byUsername({ username: "nobody" })).toEqual([]);
  });
});
