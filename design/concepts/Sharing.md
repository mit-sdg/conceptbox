# Sharing

## Purpose

Let people give others access to something, and take that access back.

*Prevents:* someone takes back a person's access, and that person still finds the thing among what is shared with them; someone shares a thing with the same person twice, takes it back once, and the person still has access.

## Principle

Maya shares her photo `beach.jpg` with Sam, and Sam finds it among the things shared with him. She also shares it with Ada. A week later she takes Sam's access back; Sam no longer finds the photo among the things shared with him, and Ada still finds it among hers.

## Types

```types
external Item
  The thing someone shares.

external Person
  Someone people can share a thing with.
```

## State

```state
a set of Shares with
  an Item
  a recipient Person
  unique item and recipient
```

## Actions

```actions
share(item: Item, recipient: Person) : returns (item: Item, recipient: Person)
  where a share has item and recipient
  then
    refuses ALREADY_SHARED "This is already shared with that person."
  where no share has item and recipient
  then
    append a new share with item and recipient
    returns item, recipient

revoke(item: Item, recipient: Person) : returns (item: Item, recipient: Person)
  where no share has item and recipient
  then
    refuses NOT_SHARED "This is not shared with that person."
  where a share has item and recipient
  then
    remove that share
    returns item, recipient
```

## Queries

```queries
_recipients(item: Item) : many (recipient: Person)
  Returns everyone the item is shared with, in the order it was shared with them, or no rows when it is shared with nobody.

_sharedWith(recipient: Person) : many (item: Item)
  Returns every item shared with the person, in the order they were shared, or no rows when none is.
```
