/**! @license CircularJS v1.0.0; Copyright (C) 2019 by Peter Dematté */
define('api', ['VOM', 'blick', 'toolbox'], function(VOM, Blick, Toolbox) {
return function addCircularAPI(inbound, Circular) {

var pubsub = {}; // general data holder
var modulesMap = {}; // list of modules for module switching
var prototype = {};

prototype.model = function(model, options) {
  return new VOM(model, options);
};

  /* --------------------  pubsub  ----------------------- */

prototype.subscribe = function(inst, comp, attr, callback, trigger) {
  var _this = this;

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

  return function() { _this.unsubscribe(inst, comp, attr, callback) };
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
  var _this = this,
    path = typeof data.path === 'object' ?
      {regexp: data.path} : routeToRegExp(data.path),
    _hash = hash || this.options.hash,
    parts = extractRouteParameters(path, getPath(_hash)),
    routers = pubsub[this.name] && pubsub[this.name].__router,
    uninstall = {};

  this.subscribe(null, '__router', data.path, {
    callback: data.callback,
    names: path.names,
    regexp: path.regexp || path
  }, trigger);

  if (trigger && parts) {
    data.callback.call(this, parts);
  }
  uninstall = !routers && installRouter(pubsub[this.name].__router, this, _hash);
  return function() {
    _this.removedRoute(data);
    !routers && uninstall();
  };
};

prototype.removedRoute = function(data) {
  return this.unsubscribe(null, '__router', data.path, data.callback);
};

prototype.toggleRoute = function(data, isOn) {
  var router = pubsub[this.name].__router,
    callbacks = router[data.path].paused || router[data.path];

  router[data.path] = isOn ? callbacks : [];
  router[data.path].paused = !isOn ? callbacks : null;
};

function installRouter(routes, _this, hash) {
  var event = window.onpopstate !== undefined ? 'popstate' : 'hashchange';

  return Toolbox.addEvent(window, event, function(e) {
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

prototype.renderModule = function(data) {
  var isValid = data.selector && data.container;
  var container = isValid && typeof data.container === 'string' ?
    Toolbox.$(data.container) : data.container;
  var componentElm = {};
  var item = modulesMap[data.context + data.selector];
  var _this = this;

  if (!isValid) return;

  if (item) {
    return new Toolbox.Promise(function(resolve) {
      appendChildToContainer(item.element, container, data.transition);
      if (item.instance && item.instance.onLoad) item.instance.onLoad(item.element, _this);
      resolve(item);
    });
  }

  componentElm = document.createElement(data.selector);
  data.input && componentElm.setAttribute('cr-input', data.input);
  data.event && componentElm.setAttribute('cr-event', data.event);
  container.appendChild(componentElm);

  return new Toolbox.Promise(function(resolve) {
    require([data.path || data.selector], function(module) {
      var instance = !module.instance && module.init(componentElm, null, data.data);
      var item = module.instance || instance;

      appendChildToContainer(componentElm, container, data.transition);
      if (item && item.onLoad) item.onLoad(componentElm, _this);
      resolve(modulesMap[data.context + data.selector] = !module.instance ? {
        element: componentElm,
        instance: instance,
      } : module);
    });
  });
};

function appendChildToContainer(element, container, transition) {
  if (transition) {
    return transition(function remove() {
      if (container.children[0]) {
        container.removeChild(container.children[0]);
      }
    }, function append() {
      container.appendChild(element);
    });
  }
  if (container.children[0]) {
    container.replaceChild(element, container.children[0]);
  } else {
    container.appendChild(element);
  }
}

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
