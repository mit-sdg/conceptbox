# Shares

People share a file by typing a username, but `Sharing.share` takes a user, so the [share endpoint](reaction:shares.granting.Share) first looks the username up with `Authenticating._byUsername`. The endpoint has four branches: `shared`, when the owner names another user who exists, and the file is shared with them; `yourself`, when the owner types their own username, refused with `SHARING_WITH_YOURSELF`; `no-such-user`, when nobody has the username, refused with `USER_NOT_FOUND`; and `refused`, when someone who doesn't own the file asks, refused with `NOT_FOUND`. If the owner has already shared the file with that person, the share is refused with `ALREADY_SHARED`.

```endpoints
shares.granting.Share at /files/share
```

To [take a share back](reaction:shares.revoking.Revoke), the owner picks the person from their box, which already has that person's user, so the revoke endpoint does no lookup. Anyone but the owner is refused with `NOT_FOUND`, and the revoke is refused with `NOT_SHARED` when the owner hasn't shared the file with that person.

```endpoints
shares.revoking.Revoke at /files/revoke
```

When the owner opens the share dialog, it shows people they already share files with, so they rarely type a whole username. The view [who the user shares files with](view:shares.suggesting.sharesFilesWith) matches the recipients of the user's own files and the owners of files shared with the user. The [people](former:shares.suggesting.people) former adds each person's username, and the [people endpoint](reaction:shares.suggesting.ShowPeople) responds with them. The view reads only Sharing and Storing, so the suggestions include only people who have shared a file with the user or received one from them.

```endpoints
shares.suggesting.ShowPeople at /people
```
