# Toolbox helper functions

The **Toolbox** helper functions are not related to an instance of a component and therefore kept as separate functions. **CircularJS** internally also uses quite some of those functions. The resource `circular` (when imported) has a reference to it as `Circular.Toolbox`, but it can of course also be imported as such: `require(['toolbox'])`.

- [convertToType(value)](#converttotypevalue) converts literals to a logical type
- [closest(element, selector, root)](#closestelement-selector-root) in case `Element.closest()` is not available in browser.
- [findParent(element, selector, root)](#findparentelement-selector-root) finds the first parent defined with `VArray`
- [$create(tag, className)](#createtag-classname) creates a HTMLElement
- [$(selector, root)](#selector-root) like `querySelector()`
- [$$(selector, root)](#selector-root-1) like `querySelectorAll()`
- [parentsIndexOf(elements, target)](#parentsindexofelements-target) NOT SUPPORTED ANY MORE
- [keys(obj)](#keysobj) like `Object.keys()` if not supported in browser.
- [cloneObject(newObj, obj)](#cloneobjectnewobj-obj) Creates shallow copy of an Object.
- [isArray: { Array.isArray || function(obj) }](#isarray--arrayisarray--functionobj) like `Array.isArray()`
- [addEvent(element, type, func, cap)](#addeventelement-type-func-cap) Adds event listener on HTMLElement
- [trim(text)](#trimtext) like `String.trim()`
- [storageHelper:](#storagehelper) collection of local storage helpers
  - [fetch(key),](#fetchkey) gets the data from local storage
  - [saveLazy(data, key, obj),](#savelazydata-key-obj) saves data to local storage with a timeout
  - [save(data, key),](#savedata-key) saves data to local storage
- [lazy(fn, obj, pref)](#lazyfn-obj-pref) wraps a function in a timeout. Debounce functionality
- [normalizePath(path)](#normalizepathpath) Sets a composed string to a valid path
- [ajax(url, prefs)](#ajaxurl-prefs) Like in `jQuery.ajax()`
- [Promise(fn, staticData)](#promisefn-staticdata) like `Promise()` but then including missing features


### `convertToType(value)`

This function takes a string and tryes to convert it to a logical literal type (string, number, boolean, string).

Passing `'43'` will return a number `43`, passing `'true'` will return a boolean `true` ... and so on.

### `closest(element, selector, root?)`

Like the regular `HTMLElement.closest()` method. It is a polyfill in case the browser doesn't support it.

### `findParent(element, selector?, root?)`

Tries to find the `VArray` defined parent node in a list or just the parent. `element` as HTMLElement is the starting point of the search, `selector`, if set, is the search requirement, if not set, it will find it by the `VArray` defined selector. `root` limits the search to the defined HTMLElement.

### `$create(tag, className)`

This simple function simply returns a newly created HTMLElement. The tagName is defined by `tag` and the className by `className`.

### `$(selector, root)`

This is an abstraction of the `HTMLElement.querySelector()` method where `root` defines the context.

### `$$(selector, root)`

This is an abstraction of the `HTMLElement.querySelectorAll()` method where `root` defines the context.

### `parentsIndexOf(elements, target)`

NOT SUPPORTED ANY MORE

### `keys(obj)`

Like `Object.keys()` polyfill if not supported by browser, otherwise exactly this method.

### `cloneObject(newObj, obj)`

A function that makes a shallow copy of an Object.

### `isArray: { Array.isArray || function(obj) }`

Polyfill for `Array.isArray()` if browser doesn't support, otherwise exactly this method.

### `addEvent(element, type, func, cap)`

This is exactly like `element.addEventListener(type, func, cap)` but then with some convenience layers. It will set `cap` (meaning `useCapture`) to true in case the `type` is either `focus`, `blur`, `mouseenter`, `mouseleave` or `scroll` and it will return a function (no arguments required) to automatically un-install the event.

Most memory leaks happen when wrongly un-installing event listeners as the function `removeEvent` silently fails if you do something wrong. The returned function will take care that your installed event listener get removed correctly.

### `trim(text)`

A polyfill for `String.trim`

### `storageHelper`

This is the container for the following functions...

#### `fetch(key)`

Gets data defined by `key` from the local storage.

#### `saveLazy(data, key, obj)`

Like the following `save(data, key)` but then with a debounce functionality where `obj` keeps track of the debounce.

#### `save(data, key)`

Saves the `data: any` to local storage defined by `key`.

### `lazy(fn, obj, pref)`

A simple debounce functionality to prevent the function `fn` to get triggered too often if it's just the same operation to be done.

### `normalizePath(path)`

A simple function that takes a string `path` as an argument that defines a path and makes a "clean" path out of it if it's not in a clear format.

### `ajax(url, prefs)`

Like the `jQuery.ajax()` functionality but with the possibility to cancel the request by adding a `.cancel(string, fn)` to identify the request (See `Promise()` in next chapter).

The function also auto detects `json`, `text` or `xml`.

### `Promise(fn(resolve, reject))`

The different `Promise` implementation with the possibility to cancel the Promise calling `new Promise().cancel(string, fn)` where `string` is like an ID to define the previously defined promise and `fn` as a callback being called in case the promise got cancelled.
