/**! @license amd v1.0.0; Copyright (C) 2023 by Peter Dematté */
!(function (root) { 'use strict';

var mathRand = root.Math.random;
var link = document.createElement('a');
var documentFragment = root.document.createDocumentFragment();
// var timer = 0;
var modules = require.modules = {};
var executedModule = {};

if (root.define && root.define.amd) return;

define.amd = {};
require.config = config;
require.getFile = function(resource, markAsDone) { return resource; };
require.debug = function() { return { modules: modules, executed: executedModule } };
root.define = define;
root.require = require;
config({});

function getRandomName() {
  return '_module_' + (mathRand() + mathRand());
}

function normalizePath(path) {
  link.href = path;
  return (path.indexOf(link.host) !== -1 ? link.origin : '') +
    link.pathname + link.search;
}

function getPathFromName(name) {
  var postFix = /(?:^\!|^http[s]*:|.*\.js$)/.test(name) ? '' : '.js';
  var path = '';

  name = (require.paths[name] || name).replace(/^[!%]/, '');
  path = normalizePath((require.baseUrl || '.') + '/' +
    name + postFix).replace(/^.\//, '');
  return require.mapPath ? require.mapPath(name, postFix, path) : path;
}

function config(config) {
  var exceptions = { mapPath: 'function', baseUrl: 'string' };
  var items = ['lookaheadMap', 'paths', 'options', 'mapPath', 'baseUrl', 'lazyPackages'];

  if (!require[items[0]]) { // init first time
    for (var n = items.length; n--; ) {
      require[items[n]] = exceptions[items[n]] === 'string' ? '' :
        exceptions[items[n]] === 'function' ? null : {};
    }
  }
  for (var item in config) {
    if (items.indexOf(item) === -1) continue; // whitelist only
    if (!exceptions[item]) {
      for (var key in config[item]) require[item][key] = config[item][key];
    } else {
      require[item] = config[item];
    }
  }
  return require;
}

function lookaheadForDeps(name) {
  var deps = require.lookaheadMap[name];
  var minifyPrefix = require.options.minifyPrefix; // ??

  if (!deps || (require.paths[name] || '').indexOf(minifyPrefix) !== -1) {
    return;
  }
  require(deps);
  for (var n = 0, m = deps.length; n < m; n++) {
    if (!modules[deps[n]]) {
      lookaheadForDeps(deps[n]);
    }
  }
}

function checkIfDone(module) {
  var deps = module.deps;
  var done = true;
  // TODO: no module => !deps;
  for (var n = deps.length; n--; ) {
    if (modules[deps[n]] && modules[deps[n]].done === undefined) {
      done = false;
    }
  }
  if (done) markAsDone(module);
}

function markAsDone(module) {
  var parents = module.parents || [];

  if (module.factory && !module.isFile) {
    module.done = module.factory.apply(null, module.deps.map(function(dep) {
      return modules[dep].done;
    }));
    delete module.factory;
  } else if (module.done === undefined) {
    delete modules[module.name]; // from lookaheadForDeps()
  }

  for (var n = parents.length; n--; ) {
    if (modules[parents[n]]) {
      checkIfDone(modules[parents[n]]);
    }
  }
}

// function appendScript(script) {
//   documentFragment.appendChild(script);
//   clearTimeout(timer);
//   timer = setTimeout(function() {
//     document.head.appendChild(documentFragment);
//   });
// }

function applyScript(module, sync) {
  var script = root.document.createElement('script');

  script.type = 'text/javascript';
  script.async = script.defer = !sync ? true : false;
  script.charset = 'utf-8';
  script.onload = script.onreadystatechange = (function(data) {
    return function(e) {
      var target = e.currentTarget || e.srcElement;

      if (e.type === 'load' || target.readyState === 'complete') {
        script.onload = script.onreadystatechange = null;
        onScriptLoaded(data);
      }
    };
  })(module);
  script.src = module.path;

  return script;
}

function onScriptLoaded(module) {
  var module = modules[module.name];

  if (executedModule.name.indexOf('_module_') === 0) {
    module.done = executedModule.done;
    module.factory = executedModule.factory;
    module.deps = executedModule.deps;
    // renaming in dependencies for anonymous modules
    for (var n = module.deps.length, parents = {}; n--; ) {
      parents = modules[module.deps[n]].parents;
      parents[parents.indexOf(executedModule.name)] = module.name;
    }
    delete modules[executedModule.name];
  }
  checkIfDone(module);
}

function getDependencies(parentName, deps, sync) {
  for (var n = deps.length, module = {}, name = ''; n--; ) {
    name = deps[n];
    if (modules[name]) {
      modules[name].parents.push(parentName);
      continue;
    }
    module = modules[name] = {
      name: name,
      isInline: name.charAt(0) === '%', // TODO: ... make wait all others until this loaded...
      isFile: name.charAt(0) === '!',
      path: getPathFromName(name),
      parents: [parentName],
    };
    if (module.isFile) {
      require.getFile(module, markAsDone);
    } else if (!module.isInline) {
      // appendScript(applyScript(module, sync));
      documentFragment.appendChild(applyScript(module, sync));
      lookaheadForDeps(name);
    }
  }
  if (documentFragment.children.length) document.head.appendChild(documentFragment);
}

function require(deps, factory, bName, sync) {
  deps.constructor === Array ?
    define(getRandomName(), deps, factory, bName, sync) :
    define(getRandomName(), [], deps, factory, bName);
}

function define(name, deps, factory, bName, sync) {
  var module = {};

  if (typeof name !== 'string') {
    return require(name, deps, factory, bName); // shifting arguments
  }
  if (!name && factory && factory.name || bName) name = bName || factory.name;
  name = name || getRandomName();
  module = modules[name];
  getDependencies(name, deps, sync);

  if (module) { // is dependency
    module.deps = deps;
    module.factory = factory;
    if (module.isInline) markAsDone(module);
  } else { // is not dependency
    module = modules[name] =
      { name: name, deps: deps, factory: factory, parents: [] };
    checkIfDone(module);
  }
  executedModule = module;
}

})(this);
