/**! @license amd v0.1.0; Copyright (C) 2019 by Peter Dematté */
!(function (root, undefined) { 'use strict';
  var mathRand = root.Math.random;
  var link = document.createElement('a');
  var documentFragment = root.document.createDocumentFragment();
  var timer = 0;
  var modules = require.modules = {};
  var justExecutedModule = {};

  define.amd = {};
  root.define = define;
  root.require = require;
  require.config = config;
  require.getFile = function(resource, checkIfDone) { return resource; };

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
    var deps = module.deps || []; // fallback for file checker
    var parentModules = module.parentModules;
    var done = true;

    for (var n = deps.length; n--; ) {
      if (modules[deps[n]] && !modules[deps[n]].done) {
        done = false;
      }
    }
    if (!done) return;

    if (module.factory) {
      module.done = module.factory.apply(null, module.deps.map(function(dep) {
        return modules[dep].done;
      }));
      delete module.factory;
    }

    for (var n = parentModules.length; n--; ) {
      if (modules[parentModules[n]]) {
        checkIfDone(modules[parentModules[n]]);
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

  function applyScript(module, sync, modules, parentName) {
    var script = root.document.createElement('script');

    script.type = 'text/javascript';
    script.async = script.defer = !sync ? true : false;
    script.charset = 'utf-8';
    script.onload = script.onreadystatechange = (function(data) {
      return function(e) {
        onScriptLoad(data);
        script.onload = script.onreadystatechange = null;
      }
    })(module);
    script.src = module.path;

    return script;
  }

  function onScriptLoad(module) {
    var module = modules[module.name];

    if (justExecutedModule.name.indexOf('_mod') === 0) { // TODO...
      module.done = justExecutedModule.done;
      if (justExecutedModule.factory) {
        module.factory = justExecutedModule.factory;
      }
      module.deps = justExecutedModule.deps;
      module.parentModules.concat(justExecutedModule.parentModules);
      delete modules[justExecutedModule.name];
    }
    checkIfDone(module);
  }

  function getDependencies(parentName, deps, sync) {
    for (var n = 0, m = deps.length, module = {}, name = ''; n < m; n++) {
      name = deps[n];
      module = modules[name];

      if (!module) {
        module = modules[name] = {
          name: name,
          isFile: name.charAt(0) === '!',
          path: getPathFromName(name),
          parentModules: [parentName]
        };
        if (module.isFile) {
          require.getFile(module, checkIfDone);
        } else {
          appendScript(applyScript(module, sync, modules, parentName));
          lookaheadForDeps(name);
        }
      } else {
        module.parentModules.push(parentName);
      }
    }
  }

  function require(deps, factory, sync) {
    var rand = '_mod' + (mathRand() + mathRand());

    deps.constructor === Array ?
      define(rand, deps, factory, sync) : define(rand, [], deps, factory);
  }

  function define(name, deps, factory, sync) {
    if (typeof name !== 'string') {
      return require(name, deps, factory); // shifting arguments
    }
    if (name === '') {
      name = '_mod' + (mathRand() + mathRand());
    }

    getDependencies(name, deps, sync);

    if (modules[name]) { // is dependency
      modules[name].deps = deps;
      modules[name].factory = factory;
    } else { // is not dependency
      modules[name] = {
        name: name,
        deps: deps,
        factory: factory,
        parentModules: [],
      };
      checkIfDone(modules[name]);
    }
    justExecutedModule = modules[name];

    if (!factory && !require.options.debug) {
      delete modules[name]; // from lookaheadForDeps()
    }
  }
  return modules[name];
})(this);
