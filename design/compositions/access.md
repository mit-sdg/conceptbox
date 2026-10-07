# Access

Storing records who uploaded a file and Sharing records whom a file is shared with, but neither concept has a rule for who may do what with it. The designer of ConceptBox wrote that rule as these two views, and every endpoint a person calls about a stored file evaluates one of them first, except finishing an upload, where `Storing.finish` checks the uploader itself.

A person [owns a file](view:access.permissions.owns) when they uploaded it, and only the owner may delete a file, share it, or take a share back. The designer of another application could let a team's administrators manage files, or let someone hand a file to a colleague; they would change this view and leave Storing as it is.

A person [can read a file](view:access.permissions.canRead) when they own it, or when it is still stored, shared with them, and not in the trash.
