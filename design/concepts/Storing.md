# Storing

## Purpose

Let people store a file and get it back later.

*Prevents:* someone downloads a file before all of its bytes have arrived; someone changes a file's bytes after the upload finished, and people download something else; someone finishes an upload another person started; someone deletes a file, and people can still download it.

## Principle

Maya starts uploading `beach.jpg`, a JPEG photo, and Storing returns an address for the bytes. Her browser sends the bytes to that address, she finishes the upload, and the photo appears among the files she uploaded, with its size. The next week she downloads it from a link that works for five minutes. She starts uploading a second file, but her connection drops before the bytes arrive; when she tries to finish the upload, she is refused, and the file never appears among her files. When she deletes the photo, it disappears from her files, and nobody can download it anymore.

## Types

```types
external Uploader
  Whoever starts an upload.
```

## State

```state
a set of Files with
  an Uploader
  a name String
  a mediaType String

a set of Stored Files with
  a size Number
  an uploadedAt DateTime

Rule: each file's bytes are stored in a bucket, and a file is added to Stored Files only once the bucket holds them.
Rule: finishing an upload moves the bytes away from the upload address, so bytes sent to that address afterwards never change the stored file.
Rule: a stored file is at most 25 MB.
```

## Actions

```actions
start(uploader: Uploader, name: String, mediaType: String) : returns (file: File, uploadUrl: String)
  where name is blank or longer than 255 characters once trimmed
  then
    refuses INVALID_NAME "A file name must have 1 to 255 characters."
  where name is accepted
  then
    add a new file with uploader, the name trimmed, and mediaType, or application/octet-stream when mediaType isn't a type and subtype such as image/png
    set uploadUrl to an address that accepts the file's bytes for the next 15 minutes
    returns file, uploadUrl

finish(file: File, uploader: Uploader) : returns (file: File)
  where file is unknown, or another uploader started it
  then
    refuses FILE_NOT_FOUND "There is no such file."
  where file is in Stored Files
  then
    refuses ALREADY_FINISHED "This upload is already finished."
  where the bucket holds no bytes for file
  then
    refuses NOT_UPLOADED "The file's bytes have not arrived."
  where the bytes, once moved away from the upload address, are more than 25 MB
  then
    refuses TOO_LARGE "A file may be at most 25 MB."
  where the bucket holds the file's bytes
  then
    move the bytes away from the upload address
    add file to Stored Files with the size of the moved bytes and uploadedAt now
    returns file

delete(file: File) : returns (file: File)
  where file is unknown
  then
    refuses FILE_NOT_FOUND "There is no such file."
  where file is known
  then
    remove the file's bytes from the bucket
    remove file
    returns file
```

## Queries

```queries
_uploadedBy(uploader: Uploader) : many (file: File, name: String, size: Number, uploadedAt: DateTime)
  Returns the uploader's stored files, newest first, or no rows when there are none.

_get(file: File) : optional (uploader: Uploader, name: String, mediaType: String, size: Number, uploadedAt: DateTime)
  Returns a stored file's details, or no row when the file is unknown or its upload isn't finished.

_download(file: File) : optional (url: String)
  Returns a link that anyone can use for the next 5 minutes to download a stored file under its name, or no row when the file isn't stored.

_view(file: File) : optional (url: String)
  Returns a link that anyone can use for the next 5 minutes to show a stored PNG, JPEG, GIF, or WebP file in a browser as an image. The bytes are served under that media type, whatever they contain. Returns no row when the file isn't stored or isn't one of those types.
```
