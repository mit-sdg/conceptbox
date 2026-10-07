import { ref } from "vue";
import type { ConceptBoxWireHttp } from "../../../generated/wire.ts";
import { api } from "../api/client.ts";
import { messageFor } from "../api/errors.ts";
import { useSession } from "../reusable/session.ts";

type Wire = ConceptBoxWireHttp;
type Path = keyof Wire;
export type Box = Wire["/box"]["output"];
export type MyFile = Box["myFiles"][number];
export type SharedFile = Box["sharedWithMe"][number];
export type TrashedFile = Box["myTrash"][number];
export type Person = Wire["/people"]["output"]["people"][number];
export type FileId = MyFile["file"];
export type UserId = Person["person"];

const box = ref<Box | null>(null);
const error = ref<string | null>(null);
/** The label I searched for, and my files that have it (null until `/files/labeled` returns). */
const search = ref<{ label: string; files: FileId[] | null } | null>(null);
/** True while `change` waits for a call and the reload after it. */
const working = ref(false);

/**
 * Waits for an endpoint call and returns its output, or `{ error }` with the sentence to show.
 * `path` picks the sentence. UNAUTHORIZED means the session ended, so the sign-in screen is shown.
 */
async function call<T extends object>(path: Path, request: Promise<T | { error: string }>): Promise<T | { error: string }> {
  const result = await request;
  if (!("error" in result)) return result;
  if (result.error === "UNAUTHORIZED") useSession().sessionEnded();
  return { error: messageFor(path, result.error) };
}

/** Loads my box from `/box`, and repeats the label search if one is showing. */
async function refresh() {
  const result = await call("/box", api.box());
  if ("error" in result) error.value = result.error;
  else box.value = result;
  if (search.value) await searchByLabel(search.value.label);
}

/**
 * Waits for a call to an endpoint that changes my box, then reloads the box. A refusal is shown in the banner.
 * Controls are disabled until the box reloads, so a second click can't send the request again.
 */
async function change<T extends object>(path: Path, request: Promise<T | { error: string }>) {
  working.value = true;
  const result = await call(path, request);
  if ("error" in result) error.value = result.error;
  else await refresh();
  working.value = false;
}

/** Downloads a file, or shows why it can't be downloaded and reloads the box without it. */
async function download(file: FileId) {
  const result = await call("/files/download", api.files.download({ file }));
  if (!("error" in result)) return window.location.assign(result.url);
  error.value = result.error;
  await refresh();
}

/** Shows my files labeled `label`. A reply that arrives after I change or clear the search is ignored. */
async function searchByLabel(label: string) {
  const stillShowing = () => search.value?.label === label;
  if (!stillShowing()) search.value = { label, files: null };
  const result = await call("/files/labeled", api.files.labeled({ label }));
  if (!stillShowing()) return;
  if ("error" in result) error.value = result.error;
  else search.value = { label, files: result.labeled.map((row) => row.file) };
}

function clearSearch() {
  search.value = null;
}

/** Clears my box when my session ends, so the next person to sign in on this tab doesn't see it. */
function reset() {
  box.value = null;
  error.value = null;
  search.value = null;
}

/**
 * My box, shared by every component under BoxPage, and the functions that call endpoints for it.
 * BoxPage passes each component the rows it shows; components read everything else from here.
 */
export function useBox() {
  return { box, error, search, working, call, refresh, change, download, searchByLabel, clearSearch, reset };
}
