/**! @license CircularJS v1.0.0; Copyright (C) 2019 by Peter Dematté */
define('api', ['VOM', 'blick', 'toolbox'], function(VOM, Blick, Toolbox) {
return function addCircularAPI(inbound, Circular) {

var $ = Toolbox.$;
var $$ = Toolbox.$$;
var pubsub = {}; // general data holder
var modulesMap = {}; // list of modules for module switching
var DOC = null; // createHTMLDocument for resorce loader
var prototype = {};

prototype.model = function(model, options) {
  return new VOM(model, options);
};

  /* --------------------  pubsub  ----------------------- */

prototype.subscribe = function(inst, comp, attr, callback, trigger) {
  inst = inst ? inst.name || inst.components && inst.components[comp] || inst : this.name;
  pubsub[inst] = pubsub[inst] || {};
  comp = pubsub[inst][comp] = pubsub[inst][comp] || {};
  comp[attr] = comp[attr] || [];
  if (callback) {
    // check also for routers
    comp[attr].push(callback.callback || callback);
    if (callback.regexp && !comp[attr].regexp) {
      comp[attr].regexp = callback.regexp;
      comp[attr].names = callback.names;
    }
  }
  if (!attr || !comp[attr]) {
    delete pubsub[inst];
    return;
  }
  if (trigger && comp[attr].value !== undefined) {
    (callback.callback || callback).call(this, comp[attr].value);
  }
  return (callback.callback || callback);
};

prototype.publish = function(inst, comp, attr, data) {
  inst = typeof inst === 'string' ? inst : this.name;
  pubsub[inst] = pubsub[inst] || {};
  if (pubsub[inst]) {
    comp = pubsub[inst][comp] = pubsub[inst][comp] || {};
    comp[attr] = comp[attr] || [];
    comp[attr].value = data;
    comp[attr][0] && publish(this, comp[attr], data);
  }
};

prototype.unsubscribe = function(inst, comp, attr, callback) {
  var funcNo = -1,
    funcs = {};

  inst = typeof inst === 'string' ? inst : inst.name || this.name;
  if (pubsub[inst] && pubsub[inst][comp] && pubsub[inst][comp][attr]) {
    funcs = pubsub[inst][comp][attr];
    funcNo = funcs.indexOf(callback.callback || callback);
    if (funcNo !== -1) {
      funcs.splice(funcNo, 1);
    }
  }
  return (callback.callback || callback);
};

function publish(_this, pubsubs, data) {
  for (var n = 0, m = pubsubs.length; n < m; n++) {
    if (pubsubs[n]) pubsubs[n].call(_this, data);
  }
}

/* ----------------------- routing -------------------------- */

prototype.addRoute = function(data, trigger, hash) {
  var path = typeof data.path === 'object' ?
      {regexp: data.path} : routeToRegExp(data.path),
    _hash = hash || this.options.hash,
    parts = extractRouteParameters(path, getPath(_hash)),
    routers = pubsub[this.name] && pubsub[this.name].__router;

  this.subscribe(null, '__router', data.path, {
    callback: data.callback,
    names: path.names,
    regexp: path.regexp || path
  }, trigger);

  if (trigger && parts) {
    data.callback.call(this, parts);
  }
  !routers && installRouter(pubsub[this.name].__router, this, _hash);
  return data;
};

prototype.removedRoute = function(data) {
  return this.unsubscribe(null, '__router', data.path, data.callback);
};

prototype.toggleRoute = function(data, isOn) { // TODO
  var router = pubsub[this.name].__router,
    callbacks = router[data.path].paused || router[data.path];

  router[data.path] = isOn ? callbacks : [];
  router[data.path].paused = !isOn ? callbacks : null;
};

function installRouter(routes, _this, hash) {
  var event = window.onpopstate !== undefined ? 'popstate' : 'hashchange';

  Toolbox.addEvent(window, event, function(e) { // TODO: store uninstall
    var parts = {};

    for (var route in routes) {
      parts = extractRouteParameters(routes[route], getPath(hash));
      parts && publish(_this, routes[route], parts);
    }
  }, _this.id);
}

function getPath(hash) {
  return decodeURI(hash ? location.hash.substr(hash.length) :
    location.pathname + location.search);
}

function routeToRegExp(route) {
  var names = [];

  route = route.replace(/[\-{}\[\]+?.,\\\^$|#\s]/g, '\\$&') // escape
    .replace(/\((.*?)\)/g, '(?:$1)?') // optional
    .replace(/(\(\?)?:\w+/g, function(match, optional) { // named
      names.push(match.substr(1));
      return optional ? match : '([^/?]+)';
    })
    .replace(/\*/g, '([^?]*?)'); // splat

  return {
    regexp: new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$'),
    names: names
  }
}

function extractSearchString(query) {
  query = query ? query.split('&') : [];
  for (var n = 0, m = query.length, out = {}, parts = []; n < m; n++) {
    parts = query[n].split('=');
    out[parts[0]] = parts[1];
  }
  return out;
}

function extractRouteParameters(route, fragment) {
  var params = route.regexp && route.regexp.exec(fragment),
    names = {};

  if (!params) return null;

  params = params.slice(1);

  for (var n = 0, m = params.length; n < m; n++) {
    params[n] = params[n] ? (n === m - 1 ? params[n] :
      decodeURIComponent(params[n])) : null;
    route.names[n] && (names[route.names[n]] = params[n]);
  }
  params.parameters = names;
  params.queries = extractSearchString(params[m - 1]);
  params.path = fragment.replace(/^\//, '').split('/');
  return params;
}

/* ----------------------- template ------------------------- */

prototype.template = function(template, options) {
  options = options || {};
  options.helpers = options.helpers || this.options.helpers;
  var engine = new Blick(template, options);
  if (options.share) {
    for (var partial in engine.schnauzer.partials) {
      if (!this.options.partials[partial] && partial !== 'self') {
        this.options.partials[partial] = engine.schnauzer.partials[partial];
      }
    }
  }
  return engine;
};

/* ------------------- resource loader -------------------- */

prototype.loadResource = function(fileName, cache) {
  var _this = this,
    devFilter = function(elm) {
      return !elm.hasAttribute('cr-dev');
    };

  return Toolbox.ajax(fileName, { cache: cache }).then(function(data) {
    DOC = DOC || document.implementation.createHTMLDocument('');
    DOC.documentElement.innerHTML = data;

    return {
      scripts: [].slice.call(DOC.scripts).filter(function(elm) {
        return elm.type === 'text/javascript' &&
          devFilter(elm.parentNode.removeChild(elm));
      }),
      styleSheets: [].slice.call($$('link', DOC) || []).filter(devFilter)
        .concat([].slice.call($$('style', DOC) || []).filter(devFilter)),
      body: DOC.body,
      head: DOC.head,
      path: fileName.split('/').slice(0, -1).join('/'),
    };
  }).catch();
};

prototype.insertResources = function(container, data) {
  var body = $('[cr-dev="container"]', data.body) || data.body;

  Toolbox.requireResources(data, 'styles', container);
  while(body.childNodes[0]) container.appendChild(body.childNodes[0]);

  return Toolbox.requireResources(data, 'scripts', container);
};

prototype.insertModule = function(fileName, container) {
  var _this = this;

  return this.loadResource(fileName, true).then(function(data) {
    return _this.insertResources(container, data).then(function() {
      return { path: data.path, container: container };
    });
  });
};

function moveChildrenToCache(data) {
  var childNodes = data.container.childNodes;

  while (childNodes[0]) {
    (data.modulesMap || modulesMap)[data.previousName].cache.appendChild(childNodes[0]);
  }
}

function transition(init, data, modules, modulePath) {
  var promise = (init && init.then ? init : data.data),
    container = data.container,
    previousName = data.previousName,
    previousModule = modules[previousName],
    name = data.name,
    wrap = modules[name].wrap,
    remove = function() {
      if (!previousName || previousName === name) return;
      previousModule.cache.appendChild(previousModule.wrap);
    },
    append = function() {
      if (modules[name].dontWrap) {
        modules[name].wrap = wrap = modules[name].wrap.children[0];
        delete modules[name].dontWrap;
      }
      container && container.appendChild(wrap);
      modulePath && data.init !== false && init(data.data, modulePath);
    };

  data.transition === true ? (remove(), append()) :
    data.transition({
      container: container,
      remove: remove,
      append: append,
      promise: new Toolbox.Promise(function(resolve) {
        promise ? promise.then(function(_data) {
          resolve();
          return _data;
        }) : resolve();
      }),
      component: wrap, // TODO: test
      previousComponent: (previousModule || {}).wrap,
    });
}

prototype.renderModule = function(data) {
  var temp = null,
    isInsideDoc = data.container,
    modules = data.modulesMap || modulesMap, // speeds up var search
    name = data.name,
    module = name && modules[name],
    init = module && module.init,
    hasTransition = data.transition,
    Promise = Toolbox.Promise;

  if (modules[data.previousName] && (!hasTransition || !name)) { // remove old app
    moveChildrenToCache(data);
  }
  if (name && module) { // append current app and initialize
    init = init && data.init !== false && init(data.data, module.path);
    hasTransition ? transition(init, data, modules) :
      data.container.appendChild(module.cache);

    return new Promise(function(resolve) { resolve(data.returnData ? data.data : init) });
  }
  // create new app and initialize
  modules[name] = module = {
    cache: document.createDocumentFragment(),
    dontWrap: data.dontWrap
  };

  if (!isInsideDoc) { // TODO: find other solution
    temp = document.createElement('div');
    temp.style.display = 'none';
    document.body.appendChild(temp);
  }
  if (hasTransition) {
    module.wrap = document.createElement('div');
    module.wrap.setAttribute('cr-wrap', name);
    if (temp) {
      temp.appendChild(module.wrap);
    } else if (!data.data || (data.preInit || []).indexOf(data.name) !== -1 ||
        (data.preInit || [])[0] === '*') {
      data.container.appendChild(module.wrap);
    }
  }

  return name ? this.insertModule(data.path, module.wrap || data.container || temp)
    .then(function(moduleData) {
      return new Promise(function(resolve) {
        var moduleName = data.require === true ? name :
            data.require === false ? '' : data.require;
        module.path = moduleData.path;
        if (moduleName) {
          require([moduleName], function(init) {
            module.init = init;

            if (!isInsideDoc && !hasTransition) {
              data.init !== false && init(data.data, moduleData.path);
              data.container = temp;
              moveChildrenToCache(data);
              temp.parentElement.removeChild(temp);
            } else if (hasTransition) {
              transition(init, data, modules, moduleData.path);
            } else {
              data.init !== false && init(data.data, moduleData.path);
            }
            if (data.data && data.data.then) {
              data.data.then(function() {
                resolve(data.returnData ? data.data : init);
              });
            } else {
              resolve(data.returnData ? data.data : init);
            }
          });
        } else if (temp) {
          moveChildrenToCache(data);
          temp.parentElement.removeChild(temp);
          resolve();
        }
      })
    }).catch() : new Promise(function(a){a()});
};

/* ---------------------------------------------------------- */

Object.defineProperties(Circular, { // static
  Toolbox: { value: Toolbox },
  instance: { value: new Circular() },
});

for(var key in prototype) { // methods
  inbound[key] = { value: prototype[key] };
}

return inbound;

}});
