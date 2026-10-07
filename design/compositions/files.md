# Files

The browser sends a file's bytes straight to the bucket, and the application handles three small requests around them: one returns an address to send the bytes to, one checks that they arrived, and one returns a link to download them. A fourth returns a link that shows an image in the page.

The [start endpoint](reaction:files.uploading.StartUpload) records a file for the signed-in user with Storing and responds with an address that accepts its bytes for fifteen minutes. The browser sends the bytes there, then calls the [finish endpoint](reaction:files.uploading.FinishUpload). `Storing.finish` checks the bucket, and the request is refused with `NOT_UPLOADED` if nothing arrived or `TOO_LARGE` if the file is over 25 MB, so nobody sees a file in their box until all its bytes are there. When a file is refused as too large, a reaction [deletes the file](reaction:files.uploading.DeleteOversized) and its bytes, since nothing else in ConceptBox would ever remove them. The finish endpoint passes the signed-in user to `Storing.finish` as the uploader, so someone else's upload is refused with `FILE_NOT_FOUND`, as if it didn't exist.

```endpoints
files.uploading.StartUpload at /files/start
files.uploading.FinishUpload at /files/finish
```

When the person [can read](access.md) the file, the [download endpoint](reaction:files.downloading.Download) responds with a link that works for five minutes. Anyone else is refused with `NOT_FOUND` (the `refused` branch), the same refusal as for a file that doesn't exist, so a stranger can't tell which files exist.

```endpoints
files.downloading.Download at /files/download
```

To show a photo on screen without downloading it, the [view endpoint](reaction:files.downloading.View) calls `Storing._view` for a link that a browser shows as an image, under the same rule: only someone who can read the file gets one. It responds with that link for a PNG, JPEG, GIF, or WebP file (the `image` branch). Any other file is refused with `NOT_FOUND` (the `not-an-image` branch), and so is anyone who can't read the file (the `refused` branch).

```endpoints
files.downloading.View at /files/view
```

Only the owner may [delete a file](reaction:files.deleting.Delete), and anyone else is refused with `NOT_FOUND`. For the owner, Storing deletes the file's record and its bytes. When Storing deletes a file, a reaction [revokes every share of that file](reaction:files.deleting.RevokeSharesOfDeleted), one person at a time. Without that reaction, Sharing would still record shares of a file that no longer exists.

```endpoints
files.deleting.Delete at /files/delete
```
