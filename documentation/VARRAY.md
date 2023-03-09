# The view model `VArray`

**CircularJS** uses model mutation to change the view. `VArray` gets created for every model you define as such and adds some **CircularJS** specific methods to it.

`VArray` is a custom implementation of `Array`s, having the same `Array` methods like `push()`, `pop()` etc. but also some additional helper methods:

- `move` moves an item, either new or exising, to the array at a certain position
- `remove` removes the item from the array
- `replace` replace an item of the array
- `filterAll` like `filter` but then also deep into tree structures
- `getCleanModel` brings the model to a state as it was before the `VArray` creation
- `updateModel` updates an existing `VArray` with data from a new model
- `getElementById` mostly for internal use
- `addSubscriber` mostly for internal use
- `destroy` mostly for internal use

The **nine mutating methods** of arrays `shift`, `pop`, `unshift`, `push`, `splice`, `sort`, `reverse`, `fill` and `copyWithin` work like `Array` methods but with a twist... They actually also trigger `Blick` to update the view. The rest of the methods (`find`, `slice`, `forEach`, etc...) work just normal as any other `Array` method.

So using `this.tree.pop()` would do exactly like you would expect. It removes the last item from the array `this.tree` and returns that removed item. But in the background the view represented by that model `this.tree` also gets updated.

**splice()** is a bit optimised though. The return value can include replaced items as well. Assume you have a model like `arr = [{...}, {...}, {...}]` and if you want to replace an item with `arr.splice(1, 1, { ... })` and `arr[1]` actually exists, then it will be replaced instead of removed. Therefore, the return value contains the "replaced" value as `arr[1]` didn't get removed but replaced. To detect items being removed check if index < 0.

### `move(item, index)`

The `item` is the object defining one of your items in your list, table or tree structure and `index` just defines where it should be placed within the array. It's almost like `arr.splice(2, 0, item)` but then it doesn't define the items that should be removed.

The `item` can be just a **new item**, so it gets added to the array or it can be an **existing item** from any other, or even the same array source. In this case it will be removed from the old "parent" automatically.

### `remove(item)`

No index needed here as **VArray** will find out itself. This method works like `arr.splice(2, 1)`.

### `replace(item, index)`

Replaces a child  within the array defined by `index` by a new item. This method works like `arr.splice(2, 1, item)`. Returns the new item.

### `filterAll(fn, thisArg)`

This works like `filter(fn, thisArg)` on normal arrays but can go deeper inside tree/table structures to find things defined by the callback function.

### `getCleanModel(item)`

In case you need to return the model to the server, you can clean it up to a state it was before it got transformed to `VArray`. The `item` can be a `Array`, `VArray` or just an `Object`.

The reason for cleaning up could also be that you need to "clone" an item from the existing model and re-use it at a different position. This item, before it goes back to the model, needs to be clean though, otherwise **CircularJS** will throw an error.

### `updateModel(newModel)`

This method walks through the existing `VArray` and changes all the data to values coming from `newModel`. So, `newModel` has to be an array.

### `getElementById(id, fullId)`

This method is mostly used internally.

### `addSubscriber(property, item)`

This method is mostly used internally.

### `destroy(id)`

This method is mostly used internally.
