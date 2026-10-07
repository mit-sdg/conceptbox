import { view, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Storing, Sharing } = concepts;

/** In ConceptBox, whoever uploaded a file owns it. */
export const owns = view("(user) owns (file)", ({ user, file }) =>
  where(Storing._get({ file }).is({ uploader: user })),
).holds();

/** Someone may read a file they uploaded, or one whose owner finished uploading it and shared it with them. */
export const canRead = view("(user) can read (file)", ({ user, file }) => [
  where(owns({ user, file })),
  where(
    Storing._get({ file }),
    Sharing._recipients({ item: file }).is({ recipient: user }),
  ),
]).holds();

export const composition = {
  permissions: { owns, canRead },
};
