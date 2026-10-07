import { type Collection, type Db, MongoServerError } from "mongodb";

export class AlreadyShared extends Error {}
export class NotShared extends Error {}

interface ShareDocument<Item, Person> {
  item: Item;
  recipient: Person;
}

/** Lets people give others access to something, and take that access back. */
export class SharingConcept<Item extends string, Person extends string> {
  private readonly shares: Collection<ShareDocument<Item, Person>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "Sharing") {
    this.shares = database.collection(`${name.toLowerCase()}.shares`);
  }

  /** Creates the unique index once. It makes MongoDB refuse a second share of an item with the same person, even when two requests arrive at once. If creating it fails, the next action tries again. */
  #ready() {
    this.indexes ??= this.shares
      .createIndex({ item: 1, recipient: 1 }, { unique: true })
      .catch((error: unknown) => {
        this.indexes = undefined;
        throw error;
      });
    return this.indexes;
  }

  async share({ item, recipient }: { item: Item; recipient: Person }) {
    await this.#ready();
    try {
      await this.shares.insertOne({ item, recipient });
    } catch (error) {
      if (isDuplicate(error)) throw new AlreadyShared("This is already shared with that person.");
      throw error;
    }
    return { item, recipient };
  }

  async revoke({ item, recipient }: { item: Item; recipient: Person }) {
    const { deletedCount } = await this.shares.deleteOne({ item, recipient });
    if (deletedCount === 0) throw new NotShared("This is not shared with that person.");
    return { item, recipient };
  }

  async _recipients({ item }: { item: Item }) {
    // MongoDB makes each _id from the time the document was added, so sorting by _id keeps the order they were added.
    const shares = await this.shares.find({ item }).sort({ _id: 1 }).toArray();
    return shares.map(({ recipient }) => ({ recipient }));
  }

  async _sharedWith({ recipient }: { recipient: Person }) {
    const shares = await this.shares.find({ recipient }).sort({ _id: 1 }).toArray();
    return shares.map(({ item }) => ({ item }));
  }
}

/** 11000 is the code MongoDB gives a write that breaks a unique index. */
const isDuplicate = (error: unknown) => error instanceof MongoServerError && error.code === 11000;
