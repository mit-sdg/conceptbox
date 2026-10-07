import { S3Client } from "bun";

/** Where file bytes are stored: an S3-compatible bucket when running, memory in tests. */
export interface Bucket {
  uploadUrl(key: string, seconds: number): string;
  downloadUrl(key: string, filename: string, seconds: number): string;
  viewUrl(key: string, mediaType: string, seconds: number): string;
  size(key: string): Promise<number | undefined>;
  move(from: string, to: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface S3BucketOptions {
  bucket: string;
  /** The bucket endpoint this server connects to. */
  endpoint: string;
  /** The bucket endpoint browsers connect to; links are signed for it. Defaults to `endpoint`. */
  publicEndpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export class S3Bucket implements Bucket {
  private readonly client: S3Client;
  private readonly signer: S3Client;

  constructor(options: S3BucketOptions) {
    const { publicEndpoint, ...shared } = options;
    this.client = new S3Client(shared);
    this.signer = new S3Client({ ...shared, endpoint: publicEndpoint ?? shared.endpoint });
  }

  uploadUrl(key: string, seconds: number): string {
    return this.signer.file(key).presign({ method: "PUT", expiresIn: seconds });
  }

  downloadUrl(key: string, filename: string, seconds: number): string {
    return this.signer.file(key).presign({
      method: "GET",
      expiresIn: seconds,
      contentDisposition: attachment(filename),
    });
  }

  viewUrl(key: string, mediaType: string, seconds: number): string {
    return this.signer.file(key).presign({ method: "GET", expiresIn: seconds, type: mediaType, contentDisposition: "inline" });
  }

  size(key: string): Promise<number | undefined> {
    return within(10, async () => {
      const object = this.client.file(key);
      if (!(await object.exists())) return undefined;
      return (await object.stat()).size;
    });
  }

  /** Copies up to 25 MB through this server, so its deadline is longer, and still inside the 30 seconds the engine waits for a request. */
  move(from: string, to: string): Promise<void> {
    return within(20, async () => {
      await this.client.write(to, this.client.file(from));
      await this.client.file(from).delete();
    });
  }

  remove(key: string): Promise<void> {
    return within(10, async () => {
      await this.client.file(key).delete();
    });
  }
}

/**
 * Runs `work`, or throws once `seconds` pass. The engine runs one Storing action at a time, so a bucket that stops
 * answering would hold up every upload and delete; Bun's S3 requests can't be cancelled, so this stops waiting instead.
 */
async function within<T>(seconds: number, work: () => Promise<T>): Promise<T> {
  let timer: Timer | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`The bucket didn't answer within ${seconds} seconds.`)), seconds * 1000);
  });
  try {
    return await Promise.race([work(), late]);
  } finally {
    clearTimeout(timer);
  }
}

export class MemoryBucket implements Bucket {
  readonly objects = new Map<string, Uint8Array>();

  /** Stands in for the browser sending bytes to an upload address. */
  send(uploadUrl: string, bytes: Uint8Array): void {
    this.objects.set(new URL(uploadUrl).pathname.slice(1), bytes);
  }

  uploadUrl(key: string, seconds: number): string {
    return `memory://upload/${key}?expires=${seconds}`;
  }

  downloadUrl(key: string, filename: string, seconds: number): string {
    return `memory://download/${key}?filename=${encodeURIComponent(filename)}&expires=${seconds}`;
  }

  viewUrl(key: string, mediaType: string, seconds: number): string {
    return `memory://view/${key}?type=${encodeURIComponent(mediaType)}&expires=${seconds}`;
  }

  async size(key: string): Promise<number | undefined> {
    return this.objects.get(key)?.byteLength;
  }

  async move(from: string, to: string): Promise<void> {
    const bytes = this.objects.get(from);
    if (bytes !== undefined) this.objects.set(to, bytes);
    this.objects.delete(from);
  }

  async remove(key: string): Promise<void> {
    this.objects.delete(key);
  }
}

function attachment(filename: string): string {
  const fallback = filename.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
