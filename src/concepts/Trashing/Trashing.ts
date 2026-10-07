import { type Collection, type Db, MongoServerError } from "mongodb";

export class Purged extends Error {}
export class AlreadyTrashed extends Error {}
export class NotTrashed extends Error {}

/** One `stage` field encodes Trashed Items and Purged Items from the specification; an item in neither has no document. */
interface ItemDocument<Item> {
  _id: Item;
  stage: "trashed" | "purged";
  trashedAt?: Date;
}

type TrashedItem<Item> = Required<ItemDocument<Item>>;

/** Lets people remove something and change their mind until they remove it for good. */
export class TrashingConcept<Item extends string> {
  private readonly items: Collection<ItemDocument<Item>>;

  constructor(
    database: Db,
    name = "Trashing",
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.items = database.collection(`${name.toLowerCase()}.items`);
  }

  async trash({ item }: { item: Item }) {
    try {
      await this.items.insertOne({ _id: item, stage: "trashed", trashedAt: this.clock() });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      throw await refusalFor(this.items, item, new AlreadyTrashed("This is already in the trash."));
    }
    return { item };
  }

  async restore({ item }: { item: Item }) {
    const { deletedCount } = await this.items.deleteOne({ _id: item, stage: "trashed" });
    if (deletedCount === 0) throw await refusalFor(this.items, item, new NotTrashed("This is not in the trash."));
    return { item };
  }

  async purge({ item }: { item: Item }) {
    const { matchedCount } = await this.items.updateOne(
      { _id: item, stage: "trashed" },
      { $set: { stage: "purged" }, $unset: { trashedAt: "" } },
    );
    if (matchedCount === 0) throw await refusalFor(this.items, item, new NotTrashed("This is not in the trash."));
    return { item };
  }

  async _trashed({ item }: { item: Item }) {
    const trashed = await this.items.findOne<TrashedItem<Item>>({ _id: item, stage: "trashed" });
    return trashed === null ? [] : [{ trashedAt: trashed.trashedAt }];
  }
}

/** Reads the item once after a write matched nothing: a purged item is refused as purged, any other with the given refusal. */
async function refusalFor<Item extends string>(items: Collection<ItemDocument<Item>>, item: Item, otherwise: Error): Promise<Error> {
  const found = await items.findOne({ _id: item });
  return found?.stage === "purged" ? new Purged("This was deleted for good.") : otherwise;
}

/** 11000 is the code MongoDB gives a write that breaks a unique index. */
const isDuplicate = (error: unknown) => error instanceof MongoServerError && error.code === 11000;
