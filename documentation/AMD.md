
# AMD (Asyncronous Module Definition)

**amd.js** is almost like **require.js** but simpler. You can also have configurations for path definitions and use `require()` and `define()` from the global scope `window`, but also get some extra features for non-module resource loading and a look-ahead feature for faster loading of dependencies.

### `define(name?, dependencies?, factory)`

`define` and `require` are on the global scope (window). Those are the only ones though produced by **CircularJS**. From there on everything is handled through factories of amd.js.

Calling `define()` without a name as first argument ends up as if you called `require()`.

Assume you have the following folder structure:

```
index.html
  |_ js/
  |   |_ deps1.js
  |      deps1.min.js
  |      deps2.js
  |_ modules/
      |_ module3/
      |   |_ index.html
      |   |_ js/
      |       |_dep.js
      |_ module4/
          |_ index.html
          |_ js/
              |_dep.js
```

### require

```js
require(['dependency-01', 'dependency-02'], function(dep1, dep2) {
    // do something with dep1 and dep2
}
```

### require.config

```js
require.config({
    baseUrl: '',
    lookaheadMap: {
        'dependency-01': ['dependency-03', 'dependency-04'],
    },
    paths: {
        'dependency-01': 'js/deps1.min',
        'dependency-02': 'js/deps2',
        'dependency-03': 'modules/module3/js/dep',
        'dependency-04': 'modules/module4/js/dep',
   },
    options: {
        minifyPrefix: '.min',
        debug: false
    }
});
```
