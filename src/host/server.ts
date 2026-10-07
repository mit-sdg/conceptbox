/**
 * The HTTP server: the API under /api, a health check, and the built Vue app.
 *
 * Settings come from the environment: PORT, PUBLIC_ORIGIN (the origin browsers use),
 * MONGODB_URI, and the bucket's S3_ENDPOINT, S3_PUBLIC_ENDPOINT, S3_BUCKET, S3_REGION,
 * S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.
 */
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { type Db, MongoClient } from "mongodb";
import type { ConceptBoxWire } from "../../generated/wire.ts";
import { assembleConceptBox } from "../application.ts";
import { S3Bucket } from "../concepts/Storing/bucket.ts";
import { conceptBoxPolicy } from "./http.ts";

const port = Number(process.env.PORT ?? 3000);
const publicOrigin = process.env.PUBLIC_ORIGIN ?? `http://localhost:${port}`;
const site = `${import.meta.dir}/../../frontend/dist`;

const database = await connect(process.env.MONGODB_URI);
const bucket = new S3Bucket({
  endpoint: required("S3_ENDPOINT"),
  publicEndpoint: process.env.S3_PUBLIC_ENDPOINT,
  bucket: required("S3_BUCKET"),
  region: required("S3_REGION"),
  accessKeyId: required("S3_ACCESS_KEY_ID"),
  secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
});

const application = assembleConceptBox({ database, bucket });
const gateway = createGateway<ConceptBoxWire>({ application });
const api = createHttpHandler({ application, gateway, policy: conceptBoxPolicy(publicOrigin) });

const server = Bun.serve({
  port,
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/api/")) return api(request);
    if (pathname === "/health") return new Response("ok");
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });

    // A path such as /assets/index.js names a file in the built app; every other path is served index.html.
    const asset = Bun.file(site + pathname);
    if (pathname !== "/" && (await asset.exists())) return new Response(asset);
    const page = Bun.file(`${site}/index.html`);
    if (await page.exists()) return new Response(page);
    return new Response("The frontend isn't built yet: run `bun run build`.", { status: 404 });
  },
});
console.log(`ConceptBox is listening on ${server.url} for ${publicOrigin}`);

async function connect(uri: string | undefined): Promise<Db> {
  if (uri === undefined) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const memory = await MongoMemoryServer.create();
    console.warn("MONGODB_URI is not set, so the server stores data in memory and loses it when it stops.");
    return (await new MongoClient(memory.getUri()).connect()).db("conceptbox");
  }
  return (await new MongoClient(uri).connect()).db();
}

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} is not set. For local storage, run \`bun run storage\` and \`bun run storage:setup\`.`);
  }
  return value;
}
