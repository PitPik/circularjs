
# AMD (Asynchronous Module Definition)

**amd.js** is almost like **require.js** but simpler. You can also have configurations for path definitions and use `require()` and `define()` from the global scope `window`, but also get some extra features for non-module resource loading and a look-ahead feature for faster loading of dependencies.

The helper scripts in the `scripts` folder work together with `amd.js` and your `amd.config.js` file.

`register.js` scans your project folder and re-configures your `amd.config.js` file for optimal bundling later on with `package.js`. It can also be used to register a newly created component so you don't have to configure your `amd.config.js` yourself. Run `node scripts/register.js` to get help.

`package.js` then takes all entries from your project `amd.config.js` file and starts minifying all of the files, including `HTML`, `CSS` and `JSON` files into one big package or several ones if used with `lazyPackages`. Optional inclusion of `CircularJS` is also possible so you end up with a single JavaScript file including all your resources for optimal page performance. Run `node scripts/package.js` to get help.

**If performance is in your mind**: Copy/paste this minification file into your `index.html` file inside a `<script>` tag so you have only **1 file** and nothing else, so you don't have to load any resources after `index.html` is loaded. This garantees the fastest possible loading time there is.

>`require()`can also be used inside your components.

### `define(name?, dependencies?, factory)`

`define` and `require` are on the global scope (window). Those are the only ones though produced by **CircularJS**. From there on everything is handled through factories of amd.js.

Calling `define()` without a name as first argument ends up as if you called `require()`. Calling  `define()` also without the `dependencies` argument will end up like calling `require([], () => {})`. The same for calling `require()` without `dependencies`, they will default to an empty array.

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

### `require(dependencies?, factory)`

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
        debug: false,
        devMocks: false,
    },
    development: {
        'dependency-02': 'js/deps2-dev',
    },
    mocks: {
        'dependency-03': 'modules/module3/js/dep.mock',
    },
    lazyPackages: {
      //
    }
});
```

When copy pasting the `define`/`require` part of your components into the section `lookaheadMap` then you can realise a faster resource loading as `amd.js` will check this section and downloads the dependencies already without waiting for the main component to request its dependencies.

`development` is overwriting everything that would be the same in `paths` in unpackaged/development mode. For development reasons you might want to relate to some alternative JSON or JS that has some extra mocks or data just relevant for development like server paths configuration etc. When packaging with `scripts/package.js` the original dependencies will be taken/packaged in place of the mocks.

`mocks` are just like dependency definitions in `development` but only for packaged mode. When using `scripts/package.js` with the option `-m` or `--mocks` then the dependencies from the `mocks` sections will be taken instead of the `paths` section. In development mode, this section will be ignore unless `options.devMocks` is set to `true`. But even in this case `development` section will be looked up before the `mocks` section.

`options.devMocks` turn on mocks in development mode (unpacked).

`lazyPackages` is not yet implemented because the package tool doesn't respect it yet. You will be able though to package all your components, that you think will be not needed right away or are being lazy-loaded anyhow, into separate (minified) files. It's like lazy loading but then from a bundle holding more components and component parts together. Once this package is requested, all included files will register in `AMD` and be available from that moment on without having to request the bundle again.
