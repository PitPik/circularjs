# Toolbox helper functions

The **Toolbox** helper functions are not related to an instance of a component and therefore kept as seperate functions. **CircularJS** internally also uses quite some of those functions. The resource `circular` (when imported) has a reference to it as `Circular.Toolbox`, but it can ofcourse also imported as such: `require(['toolbox'])`.

- [convertToType(value)](#converttotypevalue) converts literals to a logical type
- [closest(element, selector, root)](#closestelement-selector-root) in case `Element.closest()` is not vailable in browser.
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
- [errorHandler(e)](#errorhandlere) useless ... makes `console.error()`
- [Promise(fn, staticData)](#promisefn-staticdata) like `Promise()` but then including missing features


### `convertToType(value)`

### `closest(element, selector, root)`

### `findParent(element, selector, root)`

### `$create(tag, className)`

### `$(selector, root)`

### `$$(selector, root)`

### `parentsIndexOf(elements, target)`

NOT SUPPORTED ANY MORE

### `keys(obj)`

### `cloneObject(newObj, obj)`

### `isArray: { Array.isArray || function(obj) }`

### `addEvent(element, type, func, cap)`

### `trim(text)`

### `storageHelper`

#### `fetch(key)`

#### `saveLazy(data, key, obj)`

#### `save(data, key)`

### `lazy(fn, obj, pref)`

### `normalizePath(path)`

### `ajax(url, prefs)`

### `errorHandler(e)`

### `Promise(fn, staticData)`

