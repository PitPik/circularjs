define('api', ['VOM', 'blick', 'toolbox'], function(VOM, Blick, Toolbox) { return function(Circular) {

var $ = Toolbox.$;
var $$ = Toolbox.$$;
var pubsub = {}; // general data holder
var modulesMap = {}; // list of modules for module switching
var DOC = null; // createHTMLDocument for resorce loader

Circular.prototype.component = function(selector, defData) { // regression
  if (typeof selector !== 'string') { // TODO: before var
    defData = selector;
    selector = defData.name;
  }
  var element = $(selector) || $('[cr-component="' + selector + '"]') || defData.element;
  var instOptions = this.options;
  var name = defData.name || selector && selector.replace(/^(.)|-(.)/g, function(_, $1, $2) {
    return ($1 || $2).toUpperCase();
  });
  var ComponentKlass = function(element, container, views, events) {
    this[instOptions.element] = element;
    this[instOptions.container] = container;
    this[instOptions.views] = views;
    this[instOptions.events] = events; // TODO: review
    this.name = name; // more like this?
  };

  defData.selector = selector;
  defData.name = name;
  defData.circular = this;
  this.Toolbox = Toolbox;

  for (var key in defData) {
    if (typeof defData[key] === 'function') {
      ComponentKlass.prototype[key] = defData[key];
    }
  }
  for (var key in defData.eventListeners) {
    ComponentKlass.prototype[key] = defData.eventListeners[key];
  }
  for (var key in VOM.prototype) { // TODO: check if we still should need this
    ComponentKlass.prototype[key] = (function(_key) {
      return function() { return this.model[_key].apply(null, [].slice.call(arguments)) }
    })(key);
  }

  return Circular.Component(defData, ComponentKlass).init(
    typeof element === 'string' ? $(element) : element
  );
};

Circular.prototype.constructor = Circular;
Circular.prototype.model = function(model, options) {
  return new VOM(model, options);
};
Circular.prototype.getBaseModel = function(name) { /* attrName, cr-id */ };
Circular.prototype.destroy = function(name) { // TODO: review -> use reset
  // var _instList = instanceList[this.id];
  // var _instance = {};

  // for (var component in _instList) {
  //   if (name && name !== component) continue;
  //   for (var instance in _instList[component]) {
  //     _instance = _instList[component][instance];
  //     _instance && _instance.destroy && _instance.destroy(component);
  //   }
  // }
};
Circular.prototype.getInstances = function() {
  return instances[this.id];
};

  /* --------------------  pubsub  ----------------------- */

Circular.prototype.subscribe = function(inst, comp, attr, callback, trigger) {
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

Circular.prototype.publish = function(inst, comp, attr, data) {
  inst = typeof inst === 'string' ? inst : this.name;
  pubsub[inst] = pubsub[inst] || {};
  if (pubsub[inst]) {
    comp = pubsub[inst][comp] = pubsub[inst][comp] || {};
    comp[attr] = comp[attr] || [];
    comp[attr].value = data;
    comp[attr][0] && publish(this, comp[attr], data);
  }
};

Circular.prototype.unsubscribe = function(inst, comp, attr, callback) {
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

Circular.prototype.addRoute = function(data, trigger, hash) {
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

Circular.prototype.removedRoute = function(data) {
  return this.unsubscribe(null, '__router', data.path, data.callback);
};

Circular.prototype.toggleRoute = function(data, isOn) { // TODO
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

Circular.prototype.template = function(template, options) {
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

Circular.prototype.loadResource = function(fileName, cache) {
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

Circular.prototype.insertResources = function(container, data) {
  var body = $(attrSelector(this.options.devAttribute, 'container'),
    data.body) || data.body;

  Toolbox.requireResources(data, 'styles', container);
  while(body.childNodes[0]) container.appendChild(body.childNodes[0]);

  return Toolbox.requireResources(data, 'scripts', container);
};

Circular.prototype.insertModule = function(fileName, container) {
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

Circular.prototype.renderModule = function(data) {
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

Circular.Toolbox = Toolbox;
Circular.instance = new Circular();

/* ------------------------ from old ----------------------- */
/* ---------------------- remove ASAP ---------------------- */

function attrSelector(attr, value) {
  return '[' + attr + (value ? '="' + value + '"]' : ']');
}

Circular.extend = (function(deeper) {
  return function(obj, objNew, ext) {
    var _extend = false;
    var _prop = '';
    var _deeper = ext ? [].concat(deeper, ext) : deeper;
    var out = {};
    var item = {};
  
    if (this.extend && !this.prototype) {
      ext = objNew;
      objNew = obj;
      obj = this;
    }
  
    objNew = objNew || {};
    for (var prop in obj) {
      out[prop] = obj[prop] || {};
      if (prop === 'model' && !objNew.model)
        out[prop] = JSON.parse(JSON.stringify(obj[prop]));
      if (_deeper[prop]) {
        for (var $prop in obj[prop]) {
          out[prop][$prop] = obj[prop][$prop];
        }
      }
    }
    for (var prop in objNew) {
      if (prop === 'extend') continue;
      _prop = prop;
      _extend = false;
      if (prop.charAt(0) === '$') {
        _extend = true;
        _prop = prop.substr(1);
        if (_deeper.indexOf(_prop) !== -1) {
          _extend = false;
        }
      }
      item = objNew[prop];
  
      if (typeof item === 'function') {
        out[_prop] = _extend && out[_prop] ? (function(func, _item) {
          return function() {
            func.apply(this, arguments);
            return _item.apply(this, arguments);
          }
        })(out[_prop], item) : item;
      } else if (item && item.constructor === Array) {
        out[_prop] = _extend && out[_prop] && item.toString() !== '*' ?
          out[_prop].concat(item) : item;
      } else if (_deeper.indexOf(_prop) !== -1) {
        out[_prop] = Circular.extend(out[_prop], item);
      } else {
        out[_prop] = item;
      }
    }
  
    return out;
  }})(['eventListeners', 'helpers', 'decorators', 'attributes', 'storage']);
  
}});
