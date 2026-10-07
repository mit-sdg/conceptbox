# Labels

In ConceptBox, a reaction in [describing](describing.md#applying-answers) labels each file with the labels a model suggests. With the endpoints below, the owner can remove a wrong label and find their files by label, and a reaction removes the labels of a file when Storing deletes it.

A model can attach a wrong label, and it is stored like any other. The owner removes it with the [unlabel endpoint](reaction:labels.correcting.RemoveLabel). Anyone but the owner is refused with `NOT_FOUND`, and a label the file doesn't have is refused with `NOT_LABELED`.

```endpoints
labels.correcting.RemoveLabel at /files/unlabel
```

When a person searches by a label, the [search endpoint](reaction:labels.finding.FindByLabel) responds with [their own files that have it](former:labels.finding.myFilesLabeled), newest first, except the ones in the trash. `Labeling._labeled` returns every item with a label, whoever uploaded it, so the former starts from `Storing._uploadedBy` for the person.

```endpoints
labels.finding.FindByLabel at /files/labeled
```

When Storing deletes a file, a reaction [removes every label of that file](reaction:labels.deleting.RemoveLabelsOfDeleted), one label at a time. Without that reaction, Labeling would still record labels for a file that no longer exists.
