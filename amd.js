/**! @license amd v0.1.0; Copyright (C) 2019 by Peter Dematté */
!(function (root) { 'use strict';

  var mathRand = root.Math.random;
  var link = document.createElement('a');
  var documentFragment = root.document.createDocumentFragment();
  var timer = 0;
  var modules = require.modules = {};
  var executedModule = {};

  define.amd = {};
  require.config = config;
  require.getFile = function(resource, markAsDone) { return resource; };
  root.define = define;
  root.require = require;

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

    name = (require.paths[name] || name).replace(/^\!/, '');
    return  normalizePath((require.baseUrl || '.') + '/' +
      name + postFix).replace(/^.\//, '');
  }

  function config(config) {
    var items = ['lookaheadMap', 'paths', 'options', 'baseUrl|string'];

    if (!require[items[0]]) { // init first time
      for (var n = items.length, value = []; n--; ) {
        value = items[n].split('|');
        require[value[0]] = value[1] === 'string' ? '' : {};
      }
    }
    for (var item in config) {
      if (items.indexOf(item) === -1) continue; // whitelist only
      for (var key in config[item]) {
        require[item][key] = config[item][key];
      }
    }
  }

  function lookaheadForDeps(name) {
    var deps = require.lookaheadMap[name];
    var minifyPrefix = require.options.minifyPrefix; // ??

    if (deps && (require.paths[name] || '').indexOf(minifyPrefix) === -1) {
      require(deps);
      for (var n = 0, m = deps.length; n < m; n++) {
        if (!modules[deps[n]]) {
          lookaheadForDeps(deps[n]);
        }
      }
    }
  }

  function checkIfDone(module) {
    var deps = module.deps;
    var done = true;

    for (var n = deps.length; n--; ) {
      if (modules[deps[n]] && !modules[deps[n]].done) {
        done = false;
      }
    }
    if (done) markAsDone(module);
  }

  function markAsDone(module) {
    var parents = module.parents || [];

    if (module.factory) {
      module.done = module.factory.apply(null, module.deps.map(function(dep) {
        return modules[dep].done;
      }));
      delete module.factory;
    } else if (!module.done) {
      delete modules[module.name]; // from lookaheadForDeps()
    }

    for (var n = parents.length; n--; ) {
      if (modules[parents[n]]) {
        checkIfDone(modules[parents[n]]);
      }
    }
  }

  function appendScript(script) {
    documentFragment.appendChild(script);
    clearTimeout(timer);
    timer = setTimeout(function() {
      document.head.appendChild(documentFragment);
    });
  }

  function applyScript(module, sync) {
    var script = root.document.createElement('script');

    script.type = 'text/javascript';
    script.async = script.defer = !sync ? true : false;
    script.charset = 'utf-8';
    script.onload = script.onreadystatechange = (function(data) {
      return function() {
        onScriptLoad(data);
        script.onload = script.onreadystatechange = null;
      };
    })(module);
    script.src = module.path;

    return script;
  }

  function onScriptLoad(module) {
    var module = modules[module.name];

    if (executedModule.name.indexOf('_module_') === 0) { // TODO...
      module.done = executedModule.done;
      if (executedModule.factory) {
        module.factory = executedModule.factory;
      }
      module.deps = executedModule.deps;
      module.parents.concat(executedModule.parents);
      delete modules[executedModule.name];
    }
    checkIfDone(module);
  }

  function getDependencies(parentName, deps, sync) {
    for (var n = 0, m = deps.length, module = {}, name = ''; n < m; n++) {
      name = deps[n];
      if (modules[name]) {
        modules[name].parents.push(parentName);
        continue;
      }

      module = modules[name] = {
        name: name,
        isFile: name.charAt(0) === '!',
        path: getPathFromName(name),
        parents: [parentName]
      };
      if (module.isFile) {
        require.getFile(module, markAsDone);
      } else {
        appendScript(applyScript(module, sync));
        lookaheadForDeps(name);
      }
    }
  }

  function require(deps, factory, sync) {
    deps.constructor === Array ?
      define(getRandomName(), deps, factory, sync) :
      define(getRandomName(), [], deps, factory);
  }

  function define(name, deps, factory, sync) {
    var module = {};

    if (typeof name !== 'string') {
      return require(name, deps, factory); // shifting arguments
    }
    name = name || getRandomName();
    module = modules[name];
    getDependencies(name, deps, sync);

    if (module) { // is dependency
      module.deps = deps;
      module.factory = factory;
    } else { // is not dependency
      module = modules[name] =
        { name: name, deps: deps, factory: factory, parents: [] };
      checkIfDone(module);
    }
    executedModule = module;
  }
})(this);
