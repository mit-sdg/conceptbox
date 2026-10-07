import type { Collection, Db } from "mongodb";
import type { Bucket } from "./bucket.ts";

export class InvalidName extends Error {}
export class FileNotFound extends Error {}
export class AlreadyFinished extends Error {}
export class NotUploaded extends Error {}
export class TooLarge extends Error {}

const MAX_BYTES = 25_000_000;
const UPLOAD_SECONDS = 15 * 60;
const DOWNLOAD_SECONDS = 5 * 60;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
/** A media type such as `image/png`. The browser chooses it, and sends an empty one when it doesn't know. */
const MEDIA_TYPE = /^[\w.+-]{1,127}\/[\w.+-]{1,127}$/;
const UNKNOWN_TYPE = "application/octet-stream";

export type File = string & { readonly __brand: "File" };

interface FileDocument<Uploader> {
  _id: File;
  uploader: Uploader;
  name: string;
  mediaType: string;
  size?: number;
  uploadedAt?: Date;
}

/** A file is in Stored Files once it has an uploadedAt. */
type StoredFile<Uploader> = Required<FileDocument<Uploader>>;

const STORED = { uploadedAt: { $exists: true } };

/** Lets people store a file and get it back later. */
export class StoringConcept<Uploader extends string> {
  private readonly files: Collection<FileDocument<Uploader>>;

  constructor(
    database: Db,
    private readonly bucket: Bucket,
    name = "Storing",
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.files = database.collection(`${name.toLowerCase()}.files`);
  }

  async start({ uploader, name, mediaType }: { uploader: Uploader; name: string; mediaType: string }) {
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > 255) {
      throw new InvalidName("A file name must have 1 to 255 characters.");
    }
    const file = crypto.randomUUID() as File;
    await this.files.insertOne({
      _id: file,
      uploader,
      name: trimmed,
      mediaType: MEDIA_TYPE.test(mediaType) ? mediaType : UNKNOWN_TYPE,
    });
    return { file, uploadUrl: this.bucket.uploadUrl(uploadKey(file), UPLOAD_SECONDS) };
  }

  async finish({ file, uploader }: { file: File; uploader: Uploader }) {
    const found = await this.files.findOne({ _id: file, uploader });
    if (found === null) throw new FileNotFound("There is no such file.");
    if (found.uploadedAt !== undefined) throw new AlreadyFinished("This upload is already finished.");
    if ((await this.bucket.size(uploadKey(file))) === undefined) {
      throw new NotUploaded("The file's bytes have not arrived.");
    }

    // Move the bytes first, then measure and record what was moved, so bytes sent to the upload
    // address in the meantime can't slip past the size check, and a failed move records nothing.
    await this.bucket.move(uploadKey(file), storedKey(file));
    const size = await this.bucket.size(storedKey(file));
    if (size === undefined) throw new NotUploaded("The file's bytes have not arrived.");
    if (size > MAX_BYTES) throw new TooLarge("A file may be at most 25 MB.");

    const { matchedCount } = await this.files.updateOne(
      { _id: file, uploadedAt: { $exists: false } },
      { $set: { size, uploadedAt: this.clock() } },
    );
    if (matchedCount === 0) throw new AlreadyFinished("This upload is already finished.");
    return { file };
  }

  async delete({ file }: { file: File }) {
    await Promise.all([this.bucket.remove(uploadKey(file)), this.bucket.remove(storedKey(file))]);
    const { deletedCount } = await this.files.deleteOne({ _id: file });
    if (deletedCount === 0) throw new FileNotFound("There is no such file.");
    return { file };
  }

  async _uploadedBy({ uploader }: { uploader: Uploader }) {
    const stored = await this.files
      .find<StoredFile<Uploader>>({ uploader, ...STORED })
      .sort({ uploadedAt: -1, _id: 1 })
      .toArray();
    return stored.map(({ _id, name, size, uploadedAt }) => ({ file: _id, name, size, uploadedAt }));
  }

  async _get({ file }: { file: File }) {
    const stored = await this.files.findOne<StoredFile<Uploader>>({ _id: file, ...STORED });
    if (stored === null) return [];
    const { uploader, name, mediaType, size, uploadedAt } = stored;
    return [{ uploader, name, mediaType, size, uploadedAt }];
  }

  async _download({ file }: { file: File }) {
    const stored = await this.files.findOne<StoredFile<Uploader>>({ _id: file, ...STORED });
    if (stored === null) return [];
    return [{ url: this.bucket.downloadUrl(storedKey(file), stored.name, DOWNLOAD_SECONDS) }];
  }

  async _view({ file }: { file: File }) {
    const stored = await this.files.findOne<StoredFile<Uploader>>({ _id: file, ...STORED });
    if (stored === null || !IMAGE_TYPES.has(stored.mediaType)) return [];
    return [{ url: this.bucket.viewUrl(storedKey(file), stored.mediaType, DOWNLOAD_SECONDS) }];
  }
}

function uploadKey(file: File): string {
  return `uploads/${file}`;
}

function storedKey(file: File): string {
  return `files/${file}`;
}
