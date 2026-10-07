# ConceptBox types

Every person in ConceptBox is a Registering user, whether they signed up with a password or signed in with Commons. That user is the one who has a password in Authenticating, the one a Commons account is linked to in CommonsFederating, the one a session belongs to, the uploader of a file, and the one a file is shared with. The thing people share, and the thing they move to the trash, is a stored file. In ConceptBox a file's uploader is its owner, and the [access](compositions/access.md) views define who may do what with a file.

CommonsFederating is Federating with Commons as the other site. Signing in with Google would add a second instance, `instantiate Federating as GoogleFederating`, with its own provider.

Agents sign in to their own instance of Sessioning, AgentSessioning, under a name such as `describer`. A person's session is refused at an agent's endpoints, and an agent's session at a person's. Each agent is also the reasoner that Reasoning records for its answers. Questions are about stored files, and labels go on stored files. A person consents to features, such as having their uploads described.

```types
concrete Agent
  The name of an agent, such as `describer`.

concrete Feature
  A use of a person's files that needs their consent.
```

```instances
instantiate Registering

instantiate Authenticating with
  User is Registering.User

instantiate Federating as CommonsFederating with
  User is Registering.User

instantiate Sessioning with
  Subject is Registering.User

instantiate Sessioning as AgentSessioning with
  Subject is Agent

instantiate Storing with
  Uploader is Registering.User

instantiate Sharing with
  Item is Storing.File
  Person is Registering.User

instantiate Trashing with
  Item is Storing.File

instantiate Labeling with
  Item is Storing.File

instantiate Reasoning with
  Subject is Storing.File
  Reasoner is Agent

instantiate Consenting with
  Person is Registering.User
  Use is Feature
```
