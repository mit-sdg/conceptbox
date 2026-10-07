import { password as passwordHash } from "bun";
import { type Collection, type Db, MongoServerError } from "mongodb";

export class InvalidUsername extends Error {}
export class InvalidPassword extends Error {}
export class UsernameTaken extends Error {}
export class InvalidCredentials extends Error {}

const USERNAME = /^[A-Za-z0-9_-]{3,32}$/;

export type User = string & { readonly __brand: "User" };

interface UserDocument {
  _id: User;
  username: string;
  verifier: string;
}

/** Lets people come back to the same account by proving who they are. */
export class AuthenticatingConcept {
  private readonly users: Collection<UserDocument>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "Authenticating") {
    this.users = database.collection(`${name.toLowerCase()}.users`);
  }

  /** Creates the unique index once. It makes MongoDB refuse a username that is already taken, even when two people register it at once. If creating it fails, the next action tries again. */
  #ready() {
    this.indexes ??= this.users
      .createIndex({ username: 1 }, { unique: true })
      .catch((error: unknown) => {
        this.indexes = undefined;
        throw error;
      });
    return this.indexes;
  }

  async register({ username, password }: { username: string; password: string }) {
    if (!USERNAME.test(username)) {
      throw new InvalidUsername("A username must have 3 to 32 letters, digits, underscores, or hyphens.");
    }
    if (password.length < 8 || password.length > 128) {
      throw new InvalidPassword("A password must have 8 to 128 characters.");
    }
    const user = crypto.randomUUID() as User;
    const verifier = await passwordHash.hash(password, { algorithm: "argon2id" });
    await this.#ready();
    try {
      await this.users.insertOne({ _id: user, username, verifier });
    } catch (error) {
      if (isDuplicate(error)) throw new UsernameTaken("That username is taken.");
      throw error;
    }
    return { user };
  }

  async authenticate({ username, password }: { username: string; password: string }) {
    const found = await this.users.findOne({ username });
    if (found === null || !(await passwordHash.verify(password, found.verifier))) {
      throw new InvalidCredentials("The username or password is incorrect.");
    }
    return { user: found._id };
  }

  async _byUsername({ username }: { username: string }) {
    const found = await this.users.findOne({ username });
    return found === null ? [] : [{ user: found._id }];
  }

  async _username({ user }: { user: User }) {
    const found = await this.users.findOne({ _id: user });
    return found === null ? [] : [{ username: found.username }];
  }
}

/** 11000 is the code MongoDB gives a write that breaks a unique index. */
const isDuplicate = (error: unknown) => error instanceof MongoServerError && error.code === 11000;
