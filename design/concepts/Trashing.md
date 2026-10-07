# Trashing

## Purpose

Let people remove something and change their mind until they remove it for good.

*Prevents:* someone removes something for good without first moving it to the trash; someone brings back something they removed for good.

## Principle

Maya moves an old draft to the trash, then realizes it was the wrong file and restores it. She moves a different file to the trash and, a day later, deletes it from the trash for good. When she tries to restore that file, she is refused with "This was deleted for good."

## Types

```types
external Item
  The thing someone moves to the trash.
```

## State

```state
a set of Trashed Items with
  a trashedAt DateTime

a set of Purged Items

Rule: no item is in both Trashed Items and Purged Items.
```

## Actions

```actions
trash(item: Item) : returns (item: Item)
  where item is in Purged Items
  then
    refuses PURGED "This was deleted for good."
  where item is in Trashed Items
  then
    refuses ALREADY_TRASHED "This is already in the trash."
  where item is in neither Trashed Items nor Purged Items
  then
    add item to Trashed Items with trashedAt now
    returns item

restore(item: Item) : returns (item: Item)
  where item is in Purged Items
  then
    refuses PURGED "This was deleted for good."
  where item is not in Trashed Items
  then
    refuses NOT_TRASHED "This is not in the trash."
  where item is in Trashed Items
  then
    remove item from Trashed Items
    returns item

purge(item: Item) : returns (item: Item)
  where item is in Purged Items
  then
    refuses PURGED "This was deleted for good."
  where item is not in Trashed Items
  then
    refuses NOT_TRASHED "This is not in the trash."
  where item is in Trashed Items
  then
    remove item from Trashed Items
    add item to Purged Items
    returns item
```

## Queries

```queries
_trashed(item: Item) : optional (trashedAt: DateTime)
  Returns when the item was moved to the trash, or no row when it isn't in the trash.
```
