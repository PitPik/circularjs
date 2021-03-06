/**! @license CircularJS v1.0.1; Copyright (C) 2020 by Peter Dematté */
define('api', ['VOM', 'blick', 'toolbox'], function(VOM, Blick, Toolbox) {
return function addCircularAPI(inbound, Circular) {

var pubsub = {}; // general data holder
var modulesMap = {}; // list of modules for module switching
var prototype = {};
var Promise = Toolbox.Promise;

prototype.model = function(model, options) {
  return new VOM(model, options);
};

prototype.sendToComponent = function(name, data) {
  var component = this.getComponent(name);

  if (component && component.onSend) return component.onSend(data);
};

prototype.triggerEvent = function(type, data, params) {
  var event = {};
  var _params = params || {};
  
  _params.detail = data;
  event = new CustomEvent(type, _params);
  (_params.element || window).dispatchEvent(event, data);
}

prototype.installEvent = function(element, type, func, cap) {
  return Toolbox.addEvent(element || window, type, func, cap);
}

prototype.subscribeToComponent = function(name, prop, fn, trigger) {
  var _this = this;
  var component = this.getComponent(name);
  var id = component && component['__cr-id'];

  if (component && prop) {
    this.subscribe(this.id, id, prop, fn, trigger);

    return function unsubscribe() { _this.unsubscribe(_this.id, id, prop, fn) };
  }
  return function(){};
};

prototype.destroyComponents = function(insts) {
  var _this = this;

  insts.forEach(function(inst) {  _this.destroyComponent(inst) });
};

  /* --------------------  pubsub  ----------------------- */

prototype.subscribe = function(inst, comp, attr, callback, trigger) {
  var _this = this;
  var _comp = comp;

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

  return function() { _this.unsubscribe(inst, _comp, attr, callback) };
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
  var isValid = data.require && data.container;
  var container = isValid && typeof data.container === 'string' ?
    Toolbox.$(data.container) : data.container;
  var item = modulesMap[(data.context || '') + data.require];
  var _this = this;

  if (!isValid) {
    if (data.scroll && container.children) {
      container.children[0]._scroll = (Toolbox.$(data.scroll, container) || {}).scrollTop;
    }
    return new Promise(function(){});
  }

  if (item) {
    return new Toolbox.Promise(function(resolve) {
      appendChildToContainer(item.element, container, data);
      if (item.instance && item.instance.onLoad) item.instance.onLoad(item.element, _this);
      if (item.instance && item.instance.onRender) item.instance.onRender(data.data);
      resolve(item);
    });
  }

  return new Toolbox.Promise(function(resolve) {
    require([data.path || data.require], function(module) {
      var componentElm = document.createElement(module.selector);
      var setAttribute = componentElm.setAttribute.bind(componentElm);
      data.input && setAttribute('cr-input', data.input);
      data.event && setAttribute('cr-event', data.event);
      data.name && setAttribute('cr-name', data.name);
      var instance = !module.instance && module.init(componentElm, null, data.this);
      var item = module.instance || instance;

      appendChildToContainer(componentElm, container, data);
      if (item && item.onLoad) item.onLoad(componentElm, _this);
      if (item && item.onRender) item.onRender(data.data);
      resolve(modulesMap[(data.context || '') + data.require] = !module.instance ? {
        element: componentElm,
        instance: instance,
      } : module);
    });
  });
};

function appendChildToContainer(element, container, data) {
  if (data.transition) {
    return data.transition(function remove() {
      if (container.children[0]) {
        container.removeChild(container.children[0]);
      }
    }, function append() {
      container.appendChild(element);
    });
  }
  if (container.children[0]) {
    container.children[0]._scroll = data.scroll &&
      (Toolbox.$(data.scroll, data.container) || {}).scrollTop;
    container.replaceChild(element, container.children[0]);
    if (element._scroll && data.scroll) {
      (Toolbox.$(data.scroll, element) || {}).scrollTop = element._scroll || 0;
    }
  } else {
    container.appendChild(element);
    if (element._scroll && data.scroll) {
      (Toolbox.$(data.scroll, data.container) || {}).scrollTop = element._scroll || 0;
    }
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
