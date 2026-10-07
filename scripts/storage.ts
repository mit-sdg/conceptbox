/**
 * Local file storage for development: a single-node Garage, an S3-compatible server.
 * Install it with `brew install garage`, then:
 *
 *   bun run storage          start Garage in the foreground (leave it running)
 *   bun run storage:setup    once, in another terminal: create the bucket and key, allow
 *                            the frontend's origin, and write the S3 settings to .env
 *
 * Garage has no command for CORS settings, so everything below `setup()` signs that one S3
 * request by hand.
 */
import { $ } from "bun";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..", ".garage");
const config = resolve(root, "garage.toml");
const endpoint = "http://127.0.0.1:3900";
const bucket = "conceptbox";
const region = "garage";
const origins = ["http://localhost:5173", "http://localhost:3000"];

const command = process.argv[2];
if (command === "start") await start();
else if (command === "setup") await setup();
else throw new Error("Use `bun scripts/storage.ts start` or `bun scripts/storage.ts setup`.");

async function start() {
  if (!existsSync(config)) {
    mkdirSync(resolve(root, "meta"), { recursive: true });
    mkdirSync(resolve(root, "data"), { recursive: true });
    writeFileSync(
      config,
      `metadata_dir = "${root}/meta"
data_dir = "${root}/data"
db_engine = "sqlite"
replication_factor = 1
rpc_bind_addr = "127.0.0.1:3901"
rpc_public_addr = "127.0.0.1:3901"
rpc_secret = "${randomHex(32)}"

[s3_api]
s3_region = "${region}"
api_bind_addr = "127.0.0.1:3900"
root_domain = ".s3.localhost"
`,
    );
  }
  await $`garage -c ${config} server`;
}

async function setup() {
  const garage = (...args: string[]) => $`garage -c ${config} ${args}`.text();

  const status = await garage("status").catch(() => "");
  const node = status.match(/^([0-9a-f]{16})\s/m)?.[1];
  if (node === undefined) throw new Error("Garage is not running; start it with `bun run storage`.");
  if (status.includes("NO ROLE ASSIGNED")) {
    await garage("layout", "assign", "-z", "local", "-c", "1G", node);
    await garage("layout", "apply", "--version", "1");
  }

  if (!(await garage("bucket", "list")).includes(bucket)) await garage("bucket", "create", bucket);
  const name = `${bucket}-app`;
  if (!(await garage("key", "list")).includes(name)) await garage("key", "create", name);
  const key = await garage("key", "info", name, "--show-secret");
  const accessKeyId = key.match(/Key ID:\s+(\S+)/)?.[1];
  const secretAccessKey = key.match(/Secret key:\s+(\S+)/)?.[1];
  if (accessKeyId === undefined || secretAccessKey === undefined) {
    throw new Error(`Could not read the key from Garage:\n${key}`);
  }
  await garage("bucket", "allow", "--read", "--write", "--owner", bucket, "--key", accessKeyId);

  await allowOrigins(accessKeyId, secretAccessKey);
  const settings = { S3_ENDPOINT: endpoint, S3_BUCKET: bucket, S3_REGION: region, S3_ACCESS_KEY_ID: accessKeyId, S3_SECRET_ACCESS_KEY: secretAccessKey };
  const env = resolve(import.meta.dir, "..", ".env");
  const kept = existsSync(env) ? readFileSync(env, "utf8").split("\n").filter((line) => line && !line.startsWith("S3_")) : [];
  writeFileSync(env, [...kept, ...Object.entries(settings).map(([name, value]) => `${name}=${value}`)].join("\n") + "\n");
  console.log(`Bucket "${bucket}" is ready; its S3 settings are in .env.`);
}

/** Lets browsers on the development origins send and fetch bytes with presigned links. */
async function allowOrigins(accessKeyId: string, secretAccessKey: string) {
  const body = `<CORSConfiguration><CORSRule>${origins
    .map((origin) => `<AllowedOrigin>${origin}</AllowedOrigin>`)
    .join("")}<AllowedMethod>GET</AllowedMethod><AllowedMethod>PUT</AllowedMethod><AllowedHeader>*</AllowedHeader><ExposeHeader>ETag</ExposeHeader><MaxAgeSeconds>3600</MaxAgeSeconds></CORSRule></CORSConfiguration>`;
  const url = new URL(`${endpoint}/${bucket}?cors=`);
  const headers = await signCorsPut(url, body, accessKeyId, secretAccessKey);
  const response = await fetch(url, { method: "PUT", headers, body });
  if (!response.ok) throw new Error(`Setting CORS failed: ${response.status} ${await response.text()}`);
}

async function signCorsPut(url: URL, body: string, accessKeyId: string, secretAccessKey: string) {
  const now = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
  const day = now.slice(0, 8);
  const payloadHash = hex(await sha256(body));
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": now,
  };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonical = [
    "PUT",
    url.pathname,
    "cors=",
    ...Object.keys(headers)
      .sort()
      .map((name) => `${name}:${headers[name]}`),
    "",
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = `${day}/${region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", now, scope, hex(await sha256(canonical))].join("\n");
  let key: ArrayBuffer = new TextEncoder().encode(`AWS4${secretAccessKey}`).buffer as ArrayBuffer;
  for (const part of [day, region, "s3", "aws4_request"]) key = await hmac(key, part);
  const signature = hex(await hmac(key, toSign));
  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

async function sha256(text: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}

async function hmac(key: ArrayBuffer, text: string) {
  const imported = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", imported, new TextEncoder().encode(text));
}

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomHex(bytes: number) {
  return hex(crypto.getRandomValues(new Uint8Array(bytes)).buffer as ArrayBuffer);
}
