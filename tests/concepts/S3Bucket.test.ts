import { describe, expect, test } from "bun:test";
import { S3Bucket } from "../../src/concepts/Storing/bucket.ts";

const {
  S3_ENDPOINT = "",
  S3_BUCKET = "",
  S3_REGION = "",
  S3_ACCESS_KEY_ID = "",
  S3_SECRET_ACCESS_KEY = "",
} = process.env;
const configured = [S3_ENDPOINT, S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY].every(Boolean);
const running = configured && (await fetch(S3_ENDPOINT).then(() => true, () => false));

describe.skipIf(!running)("S3Bucket against a running bucket (start it with `bun run storage`)", () => {
  const bucket = new S3Bucket({
    endpoint: S3_ENDPOINT,
    bucket: S3_BUCKET,
    region: S3_REGION,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  });
  const origin = "http://localhost:5173";

  test("a browser sends bytes to an upload link, and fetches them from a download link once they are moved", async () => {
    const id = crypto.randomUUID();
    const uploadKey = `uploads/test-${id}`;
    const key = `files/test-${id}`;
    const upload = bucket.uploadUrl(uploadKey, 60);

    const preflight = await fetch(upload, {
      method: "OPTIONS",
      headers: { Origin: origin, "Access-Control-Request-Method": "PUT" },
    });
    expect(preflight.headers.get("access-control-allow-origin")).toBe(origin);

    const sent = await fetch(upload, { method: "PUT", body: "hello", headers: { Origin: origin } });
    expect(sent.status).toBe(200);
    expect(await bucket.size(uploadKey)).toBe(5);

    await bucket.move(uploadKey, key);
    expect(await bucket.size(uploadKey)).toBeUndefined();

    const fetched = await fetch(bucket.downloadUrl(key, "héllo.txt", 60));
    expect(await fetched.text()).toBe("hello");
    expect(fetched.headers.get("content-disposition")).toContain("attachment");

    const viewed = await fetch(bucket.viewUrl(key, "image/png", 60));
    expect(viewed.headers.get("content-type")).toBe("image/png");
    expect(viewed.headers.get("content-disposition")).toBe("inline");

    await bucket.remove(key);
    expect(await bucket.size(key)).toBeUndefined();
  });
});
