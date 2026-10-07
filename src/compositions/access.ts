import { no, view, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Storing, Sharing, Trashing } = concepts;

/** In ConceptBox, whoever uploaded a file owns it. */
export const owns = view("(user) owns (file)", ({ user, file }) =>
  where(Storing._get({ file }).is({ uploader: user })),
).holds();

/** Someone may read a file they uploaded, or one whose owner finished uploading it, shared it with them, and hasn't moved it to the trash. */
export const canRead = view("(user) can read (file)", ({ user, file }) => [
  where(owns({ user, file })),
  where(
    Storing._get({ file }),
    Sharing._recipients({ item: file }).is({ recipient: user }),
    no(Trashing._trashed({ item: file })),
  ),
]).holds();

export const composition = {
  permissions: { owns, canRead },
};
