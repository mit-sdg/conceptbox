# Trash

In ConceptBox, a file someone deletes goes to the trash first, so they can take back a mistake. Trashing records only which items are in the trash and which were purged; the endpoints and reactions below connect it to the files in Storing.

Only the owner may [move a file to the trash](reaction:trash.discarding.MoveToTrash), [restore it](reaction:trash.restoring.Restore), or [purge it](reaction:trash.discarding.Purge) (labeled "Delete" in the trash); anyone else is refused with `NOT_FOUND`. Restoring or purging a file that isn't in the trash is refused with `NOT_TRASHED`, and a purge is refused before anything is deleted (the `not-trashed` branch). Once a file is purged, it is no longer in Storing, so any later request about it is refused with `NOT_FOUND`, and nobody in ConceptBox ever sees the `PURGED` refusal from Trashing.

```endpoints
trash.discarding.MoveToTrash at /files/trash
trash.restoring.Restore at /files/restore
trash.discarding.Purge at /files/purge
```

When the owner purges a file that is in the trash, the purge endpoint deletes it from Storing, bytes and record. When Storing deletes a file that is in the trash, a reaction [records the purge](reaction:trash.discarding.RecordPurge) in Trashing, and the reaction in [files](files.md) revokes every share of that file. One purge calls actions on Storing, Trashing, and Sharing in turn, and no concept reads the state of another. The file is deleted before the purge is recorded, so it is never both stored and out of the trash, and the people it was shared with can't read it in between. Only two things delete a file: the purge endpoint, for a file in the trash, and the reaction that removes a too-large upload. The purge endpoint reads whether the file is in the trash instead of calling `Trashing.purge` first, so if Maya restores the file between that read and the delete, the restore succeeds, the file is still deleted, and no purge is recorded. Only the owner can send both requests at once, and reading first is what keeps a purged file from being stored and out of the trash at the same moment.

[The trash](former:trash.listing.myTrash) returns the owner's trashed files, most recently trashed first. While a file is in the trash, it is left out of My files, and the people it is shared with [can't read it](access.md), so it disappears from their lists and they can't download it. The shares of the file stay in Sharing, so when the owner restores it, the same people can read it again.
