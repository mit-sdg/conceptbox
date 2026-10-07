import { describe, expect, test } from "bun:test";
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { conceptBoxPolicy } from "../../src/host/http.ts";
import { startConceptBox } from "../support/app.ts";

const ORIGIN = "http://localhost:3000";
const SAM = { subject: "u7f3", username: "sam" };
const LEO = { subject: "u2b9", username: "leo" };

/** ConceptBox behind its HTTP server, and browsers that each keep their own cookies, so a test can see each cookie set and cleared. */
async function serve() {
  const app = await startConceptBox();
  const handle = createHttpHandler({
    application: app.application,
    gateway: createGateway({ application: app.application }),
    policy: conceptBoxPolicy(ORIGIN),
  });

  function browser() {
    const jar = new Map<string, string>();

    async function post(path: string, body: object = {}) {
      const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
      const response = await handle(
        new Request(`${ORIGIN}/api${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: ORIGIN, Cookie: cookie },
          body: JSON.stringify(body),
        }),
      );
      const cookies = response.headers.getSetCookie();
      const set = cookies.map((line) => line.split(";")[0]?.split("=") ?? []);
      for (const [name = "", value = ""] of set) {
        if (value === "") jar.delete(name);
        else jar.set(name, value);
      }
      const cleared = set.filter(([, value]) => value === "").map(([name]) => name);
      return { status: response.status, body: await response.json(), cookies, cleared };
    }

    return { jar, post };
  }

  return { ...app, browser };
}

const SIGN_IN = "__Host-conceptbox-sign-in";
const SESSION = "__Host-conceptbox-session";

describe("Signing in with Commons over HTTP", () => {
  test("starting sets the sign-in cookie, and finishing swaps it for a session", async () => {
    const { browser, commons } = await serve();
    const sam = browser();
    const start = await sam.post("/auth/commons/start");
    expect(start.body).toEqual({ address: expect.any(String) });
    expect(sam.jar.has(SIGN_IN)).toBe(true);
    expect(start.cookies[0]).toMatch(/^__Host-conceptbox-sign-in=[^;]+; .*Expires=/);
    expect(start.cookies[0]).toContain("HttpOnly");
    expect(start.cookies[0]).toContain("Secure");
    expect(start.cookies[0]).toContain("SameSite=Strict");

    const { code, state } = commons.approve(start.body.address, SAM);
    expect((await sam.post("/auth/commons/finish", { state, code })).status).toBe(200);
    expect(sam.jar.has(SIGN_IN)).toBe(false);
    expect(sam.jar.has(SESSION)).toBe(true);
    expect((await sam.post("/auth/me")).body).toEqual({ username: "sam" });
  });

  test("Leo's link is refused with 403 in Sam's browser, and Sam's own attempt keeps its cookie", async () => {
    const { browser, commons } = await serve();
    const leo = browser();
    const sam = browser();
    const leos = await leo.post("/auth/commons/start");
    const { code, state } = commons.approve(leos.body.address, LEO);

    await sam.post("/auth/commons/start");
    const samsAttempt = sam.jar.get(SIGN_IN);
    const forged = await sam.post("/auth/commons/finish", { attempt: leo.jar.get(SIGN_IN), state, code });
    expect(forged).toMatchObject({ status: 403, body: { error: "FORBIDDEN" }, cleared: [] });
    expect(sam.jar.get(SIGN_IN)).toBe(samsAttempt);
    expect(sam.jar.has(SESSION)).toBe(false);

    expect((await leo.post("/auth/commons/finish", { state, code })).status).toBe(200);
  });

  test("a taken username answers 409 and keeps the attempt, so Sam can choose another", async () => {
    const { browser, commons, register } = await serve();
    await register("sam");
    const sam = browser();
    const start = await sam.post("/auth/commons/start");
    const { code, state } = commons.approve(start.body.address, SAM);

    expect(await sam.post("/auth/commons/finish", { state, code })).toMatchObject({ status: 409, cleared: [] });
    expect(sam.jar.has(SIGN_IN)).toBe(true);
    expect(await sam.post("/auth/commons/choose", { username: "sam" })).toMatchObject({ status: 409, cleared: [] });

    expect((await sam.post("/auth/commons/choose", { username: "sam-lee" })).status).toBe(200);
    expect(sam.jar.has(SIGN_IN)).toBe(false);
    expect((await sam.post("/auth/me")).body).toEqual({ username: "sam-lee" });
  });
});
