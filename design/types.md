# ConceptBox types

Every person in ConceptBox is an Authenticating user: the one a session belongs to, the uploader of a file, and the one a file is shared with. The thing people share, and the thing they move to the trash, is a stored file. In ConceptBox a file's uploader is its owner, and the [access](compositions/access.md) views define who may do what with a file.

```instances
instantiate Authenticating

instantiate Sessioning with
  Subject is Authenticating.User

instantiate Storing with
  Uploader is Authenticating.User

instantiate Sharing with
  Item is Storing.File
  Person is Authenticating.User

instantiate Trashing with
  Item is Storing.File
```
