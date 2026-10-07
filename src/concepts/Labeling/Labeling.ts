import { type Collection, type Db, MongoServerError } from "mongodb";

export class InvalidLabel extends Error {}
export class AlreadyLabeled extends Error {}
export class NotLabeled extends Error {}

const MAX_NAME = 40;

interface LabelDocument<Item> {
  item: Item;
  name: string;
}

/** Lets people find things again by the words they attach to them. */
export class LabelingConcept<Item extends string> {
  private readonly labels: Collection<LabelDocument<Item>>;
  private indexes: Promise<unknown> | undefined;

  constructor(database: Db, name = "Labeling") {
    this.labels = database.collection(`${name.toLowerCase()}.labels`);
  }

  /** Creates the unique index once. It makes MongoDB refuse the same label twice on one item, even when two requests arrive at once. If creating it fails, the next action tries again. */
  #ready() {
    this.indexes ??= this.labels
      .createIndex({ item: 1, name: 1 }, { unique: true })
      .catch((error: unknown) => {
        this.indexes = undefined;
        throw error;
      });
    return this.indexes;
  }

  async label({ item, name }: { item: Item; name: string }) {
    const stored = normalize(name);
    if (stored.length === 0 || stored.length > MAX_NAME) {
      throw new InvalidLabel("A label must have 1 to 40 characters.");
    }
    await this.#ready();
    try {
      await this.labels.insertOne({ item, name: stored });
    } catch (error) {
      if (isDuplicate(error)) throw new AlreadyLabeled("This already has that label.");
      throw error;
    }
    return { item };
  }

  async remove({ item, name }: { item: Item; name: string }) {
    const stored = normalize(name);
    const { deletedCount } = await this.labels.deleteOne({ item, name: stored });
    if (deletedCount === 0) throw new NotLabeled("This doesn't have that label.");
    return { item };
  }

  async _labels({ item }: { item: Item }) {
    const labels = await this.labels.find({ item }).sort({ name: 1 }).toArray();
    return labels.map(({ name }) => ({ name }));
  }

  async _labeled({ name }: { name: string }) {
    // MongoDB makes each _id from the time the document was added, so sorting by _id keeps the order they were added.
    const labels = await this.labels.find({ name: normalize(name) }).sort({ _id: 1 }).toArray();
    return labels.map(({ item }) => ({ item }));
  }
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/** 11000 is the code MongoDB gives a write that breaks a unique index. */
const isDuplicate = (error: unknown) => error instanceof MongoServerError && error.code === 11000;
