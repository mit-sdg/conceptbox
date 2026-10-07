import { ref } from "vue";
import { api } from "../api/client.ts";

/** The sentence to show for each HTTP category the `/auth` endpoints return, by endpoint. */
const messages: Record<string, Record<string, string>> = {
  "/auth/register": {
    CONFLICT: "That username is taken.",
    INVALID_REQUEST: "That username or password doesn't follow the rules under each box.",
  },
  "/auth/login": { UNAUTHORIZED: "The username or password is incorrect." },
};

interface Me {
  username: string;
}

const me = ref<Me | null>(null);
const checked = ref(false);
const error = ref<string | null>(null);

async function load() {
  const result = await api.auth.me();
  me.value = "error" in result ? null : result;
  checked.value = true;
}

async function enter(path: string, answer: Promise<{ error: string } | Me>) {
  const result = await answer;
  if ("error" in result) {
    error.value = messages[path]?.[result.error] ?? "Something went wrong. Try again.";
    return;
  }
  error.value = null;
  me.value = { username: result.username };
}

const register = (username: string, password: string) =>
  enter("/auth/register", api.auth.register({ username, password }));
const signIn = (username: string, password: string) =>
  enter("/auth/login", api.auth.login({ username, password }));

/** Signs out, then reloads the page so that the tab's uploads, polling, and requests stop. */
async function signOut() {
  await api.auth.logout();
  window.location.assign("/");
}

/** Shows the sign-in screen when an endpoint call is refused because the session ended. */
function sessionEnded() {
  error.value = "Your session has ended. Sign in again.";
  me.value = null;
}

/** The signed-in person, and the functions that call `/auth/me`, `/auth/register`, `/auth/login`, and `/auth/logout`, shared by every component. */
export function useSession() {
  return { me, checked, error, load, register, signIn, signOut, sessionEnded };
}
