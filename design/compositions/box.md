# Box

The box is the one screen of ConceptBox. The [box endpoint](reaction:box.showing.ShowBox) reads the user from the session and responds with two lists, `myFiles` and `sharedWithMe`.

[My files](former:box.showing.myFiles) are the files the user uploaded, newest first, each with its media type so the screen can show an image as an image. Each file also comes with the people it is shared with, as users and usernames, so the screen can show each username with a button to take that share back. A file shared with nobody has an empty list.

[Shared with me](former:box.showing.sharedWithMe) are the files other people shared with the user that the user [can read](access.md), each with its owner's username. The file comes from Sharing, its name, media type, and size from Storing, and its owner's username from Authenticating.

```endpoints
box.showing.ShowBox at /box
```
