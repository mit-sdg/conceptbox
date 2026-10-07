import { describe, expect, test } from "bun:test";
import { MemoryBucket } from "../../src/concepts/Storing/bucket.ts";
import {
  AlreadyFinished,
  type File,
  FileNotFound,
  InvalidName,
  NotUploaded,
  StoringConcept,
  TooLarge,
} from "../../src/concepts/Storing/Storing.ts";
import { testDatabase } from "../support/reusable/mongo.ts";
import { expectOneWinner } from "../support/reusable/race.ts";

async function setup(bucket = new MemoryBucket()) {
  const database = await testDatabase();
  const clock = () => new Date("2026-10-07T14:00:00Z");
  return { storing: new StoringConcept(database, bucket, "Storing", clock), bucket };
}

const bytes = (count: number) => new Uint8Array(count);

describe("Storing", () => {
  test("its principle: Maya's photo appears in her list once its bytes reach the bucket, and disappears with its bytes when she deletes it", async () => {
    const { storing, bucket } = await setup();

    const { file: photo, uploadUrl } = await storing.start({
      uploader: "maya",
      name: "beach.jpg",
      mediaType: "image/jpeg",
    });
    bucket.send(uploadUrl, bytes(2_400));
    expect(await storing.finish({ file: photo, uploader: "maya" })).toEqual({ file: photo });
    expect(await storing._uploadedBy({ uploader: "maya" })).toEqual([
      {
        file: photo,
        name: "beach.jpg",
        size: 2_400,
        uploadedAt: new Date("2026-10-07T14:00:00Z"),
      },
    ]);

    const [link] = await storing._download({ file: photo });
    expect(link?.url).toContain("beach.jpg");

    const { file: dropped } = await storing.start({
      uploader: "maya",
      name: "notes.pdf",
      mediaType: "application/pdf",
    });
    await expect(storing.finish({ file: dropped, uploader: "maya" })).rejects.toThrow(NotUploaded);
    expect((await storing._uploadedBy({ uploader: "maya" })).map((row) => row.file)).toEqual([photo]);

    await storing.delete({ file: photo });
    expect(await storing._uploadedBy({ uploader: "maya" })).toEqual([]);
    expect(await storing._download({ file: photo })).toEqual([]);
    expect(bucket.objects.size).toBe(0);
  });

  test("Maya's photo has a link to view it as an image, and her notes don't", async () => {
    const { storing, bucket } = await setup();
    const { file: photo, uploadUrl } = await storing.start({ uploader: "maya", name: "beach.jpg", mediaType: "image/jpeg" });
    bucket.send(uploadUrl, bytes(2_400));
    expect(await storing._view({ file: photo })).toEqual([]);
    await storing.finish({ file: photo, uploader: "maya" });
    const [link] = await storing._view({ file: photo });
    expect(link?.url).toContain("image%2Fjpeg");

    const { file: notes, uploadUrl: notesUrl } = await storing.start({ uploader: "maya", name: "notes.svg", mediaType: "image/svg+xml" });
    bucket.send(notesUrl, bytes(300));
    await storing.finish({ file: notes, uploader: "maya" });
    expect(await storing._view({ file: notes })).toEqual([]);
  });

  test("bytes sent to the upload address after the upload finished don't change the stored file", async () => {
    const { storing, bucket } = await setup();
    const { file, uploadUrl } = await storing.start({ uploader: "maya", name: "beach.jpg", mediaType: "image/jpeg" });
    bucket.send(uploadUrl, bytes(2_400));
    await storing.finish({ file, uploader: "maya" });

    bucket.send(uploadUrl, bytes(30_000_000));
    expect((await storing._get({ file }))[0]?.size).toBe(2_400);
    expect(bucket.objects.get(`files/${file}`)?.byteLength).toBe(2_400);

    await storing.delete({ file });
    expect(bucket.objects.size).toBe(0);
  });

  test("finish refuses a file over 25 MB and stores one of exactly 25 MB", async () => {
    const { storing, bucket } = await setup();
    const { file, uploadUrl } = await storing.start({ uploader: "maya", name: "film.mov", mediaType: "video/quicktime" });
    bucket.send(uploadUrl, bytes(25_000_001));
    await expect(storing.finish({ file, uploader: "maya" })).rejects.toThrow(TooLarge);
    expect(await storing._get({ file })).toEqual([]);

    const { file: fits, uploadUrl: fitsUrl } = await storing.start({ uploader: "maya", name: "clip.mov", mediaType: "video/quicktime" });
    bucket.send(fitsUrl, bytes(25_000_000));
    await storing.finish({ file: fits, uploader: "maya" });
    expect((await storing._get({ file: fits }))[0]?.size).toBe(25_000_000);
  });

  test("finish refuses an upload someone else started, as if it were unknown", async () => {
    const { storing, bucket } = await setup();
    const { file, uploadUrl } = await storing.start({ uploader: "maya", name: "a.txt", mediaType: "text/plain" });
    bucket.send(uploadUrl, bytes(3));
    await expect(storing.finish({ file, uploader: "sam" })).rejects.toThrow(FileNotFound);
    expect(await storing.finish({ file, uploader: "maya" })).toEqual({ file });
  });

  test("when moving the bytes fails, nothing is recorded, and finishing again stores the file", async () => {
    let failures = 1;
    const bucket = new (class extends MemoryBucket {
      override async move(from: string, to: string) {
        if (failures-- > 0) throw new Error("The bucket didn't answer.");
        return super.move(from, to);
      }
    })();
    const { storing } = await setup(bucket);
    const { file, uploadUrl } = await storing.start({ uploader: "maya", name: "a.txt", mediaType: "text/plain" });
    bucket.send(uploadUrl, bytes(3));
    await expect(storing.finish({ file, uploader: "maya" })).rejects.toThrow("The bucket didn't answer.");
    expect(await storing._get({ file })).toEqual([]);
    expect(await storing.finish({ file, uploader: "maya" })).toEqual({ file });
  });

  test("bytes sent to the upload address while finish runs are measured after the move, so they can't pass the 25 MB limit", async () => {
    const bucket = new (class extends MemoryBucket {
      override async move(from: string, to: string) {
        this.objects.set(from, bytes(30_000_000));
        return super.move(from, to);
      }
    })();
    const { storing } = await setup(bucket);
    const { file, uploadUrl } = await storing.start({ uploader: "maya", name: "a.txt", mediaType: "text/plain" });
    bucket.send(uploadUrl, bytes(3));
    await expect(storing.finish({ file, uploader: "maya" })).rejects.toThrow(TooLarge);
    expect(await storing._get({ file })).toEqual([]);
  });

  test("finish refuses an upload that already finished", async () => {
    const { storing, bucket } = await setup();
    const { file, uploadUrl } = await storing.start({ uploader: "maya", name: "a.txt", mediaType: "text/plain" });
    bucket.send(uploadUrl, bytes(3));
    await storing.finish({ file, uploader: "maya" });
    await expect(storing.finish({ file, uploader: "maya" })).rejects.toThrow(AlreadyFinished);
  });

  test("of two finishes of one upload at once, Storing stores the file once and refuses the other", async () => {
    const { storing, bucket } = await setup();
    const { file, uploadUrl } = await storing.start({ uploader: "maya", name: "a.txt", mediaType: "text/plain" });
    bucket.send(uploadUrl, bytes(3));
    const finish = () => storing.finish({ file, uploader: "maya" });
    // The engine runs one Storing action at a time, so the second sees ALREADY_FINISHED. Called directly, the
    // second can also find the bytes already moved, and is refused with NOT_UPLOADED.
    await expectOneWinner([finish(), finish()], AlreadyFinished, NotUploaded);
    expect(await storing._uploadedBy({ uploader: "maya" })).toHaveLength(1);
  });

  test("a name must have 1 to 255 characters once trimmed, and Storing stores it trimmed", async () => {
    const { storing, bucket } = await setup();
    const refusal = storing.start({ uploader: "maya", name: "  ", mediaType: "text/plain" });
    await expect(refusal).rejects.toThrow(InvalidName);
    await expect(refusal).rejects.toThrow("A file name must have 1 to 255 characters.");
    await expect(
      storing.start({ uploader: "maya", name: "x".repeat(256), mediaType: "text/plain" }),
    ).rejects.toThrow(InvalidName);

    const { file, uploadUrl } = await storing.start({ uploader: "maya", name: ` ${"x".repeat(255)} `, mediaType: "text/plain" });
    bucket.send(uploadUrl, bytes(3));
    await storing.finish({ file, uploader: "maya" });
    expect((await storing._get({ file }))[0]?.name).toBe("x".repeat(255));
  });

  test("finish and delete refuse an unknown file", async () => {
    const { storing } = await setup();
    await expect(storing.finish({ file: "missing" as File, uploader: "maya" })).rejects.toThrow(FileNotFound);
    await expect(storing.delete({ file: "missing" as File })).rejects.toThrow(FileNotFound);
  });

  test("Maya can delete a file before its bytes arrive, and then can't finish it", async () => {
    const { storing } = await setup();
    const { file } = await storing.start({ uploader: "maya", name: "a.txt", mediaType: "text/plain" });
    expect(await storing.delete({ file })).toEqual({ file });
    await expect(storing.finish({ file, uploader: "maya" })).rejects.toThrow(FileNotFound);
  });

  test("a media type that isn't a type and subtype is stored as application/octet-stream", async () => {
    const { storing, bucket } = await setup();
    for (const mediaType of ["", "not a type", `text/${"x".repeat(200)}`]) {
      const { file, uploadUrl } = await storing.start({ uploader: "maya", name: "a.bin", mediaType });
      bucket.send(uploadUrl, bytes(3));
      await storing.finish({ file, uploader: "maya" });
      expect((await storing._get({ file }))[0]?.mediaType).toBe("application/octet-stream");
    }
  });

  test("a stored file's details include its media type", async () => {
    const { storing, bucket } = await setup();
    const { file, uploadUrl } = await storing.start({ uploader: "maya", name: "beach.jpg", mediaType: "image/jpeg" });
    bucket.send(uploadUrl, bytes(3));
    await storing.finish({ file, uploader: "maya" });
    expect(await storing._get({ file })).toEqual([
      {
        uploader: "maya",
        name: "beach.jpg",
        mediaType: "image/jpeg",
        size: 3,
        uploadedAt: new Date("2026-10-07T14:00:00Z"),
      },
    ]);
  });

  test("of two deletes of one file at once, Storing removes the file and its bytes once and refuses the other with FILE_NOT_FOUND", async () => {
    const { storing, bucket } = await setup();
    const { file, uploadUrl } = await storing.start({ uploader: "maya", name: "a.txt", mediaType: "text/plain" });
    bucket.send(uploadUrl, bytes(3));
    await storing.finish({ file, uploader: "maya" });
    await expectOneWinner([storing.delete({ file }), storing.delete({ file })], FileNotFound);
    expect(bucket.objects.size).toBe(0);
  });
});
