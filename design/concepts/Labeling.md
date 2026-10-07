# Labeling

## Purpose

Let people find things again by the words they attach to them.

*Prevents:* someone labels a thing "beach" and later "Beach", and finds the same label on it twice; someone removes a label from a thing and still finds the thing when they search for that label.

## Principle

Maya labels her photo `beach.jpg` with "beach" and "summer", and labels another photo "summer" too. When she looks for "summer" later, she finds both photos. She decides the first photo isn't really a summer one and removes that label; when she looks for "summer" now, she finds only the other photo. When she labels the first photo "Beach", she is refused because the photo already has that label.

## Types

```types
external Item
  The thing someone labels.
```

## State

```state
a set of Labels with
  an Item
  a name String
  unique item and name

Rule: Labeling stores each label's name trimmed and in lowercase, and compares names the same way.
```

## Actions

```actions
label(item: Item, name: String) : returns (item: Item)
  where name is blank or longer than 40 characters once trimmed
  then
    refuses INVALID_LABEL "A label must have 1 to 40 characters."
  where a label has item and name
  then
    refuses ALREADY_LABELED "This already has that label."
  where name is accepted and no label has item and name
  then
    append a new label with item and name, trimmed and in lowercase
    returns item

remove(item: Item, name: String) : returns (item: Item)
  where no label has item and name
  then
    refuses NOT_LABELED "This doesn't have that label."
  where a label has item and name
  then
    remove that label
    returns item
```

## Queries

```queries
_labels(item: Item) : many (name: String)
  Returns the item's labels in alphabetical order, or no rows when it has none.

_labeled(name: String) : many (item: Item)
  Returns every item that has this label, in the order they were labeled, or no rows when none has it.
```
