/**! @license api v2.0.3; Copyright (C) 2023 by Peter Dematté */
define(['toolbox'], function(Toolbox) {
  return function addCircularAPI(inbound, Circular) {
  
  var pubsub = {}; // general data cache
  var prototype = {};
  
  prototype.triggerEvent = function(type, data, params) {
    var event = {};
    var _params = params || {};
    var element = _params.ownerDocument === document ? Toolbox.findParent(params, 'cr-id') : undefined;
    var parent = !element && _params.parentOnly ?
      this.getParentComponent(_params.parentOnly).element : undefined;
      
    _params.detail = data;
    _params.element = element || parent || _params.element || window;
    _params.bubbles = parent ? false : _params.bubbles !== undefined ? _params.bubbles : true;
    event = new CustomEvent(type, _params);
    (_params.element).dispatchEvent(event);
  };
  
  prototype.installEvent = function(element, type, func, cap) {
    return Toolbox.addEvent(element || window, type, func, cap);
  };
  
  prototype.getView = function(value, element) { // TODO: maybe remove attribute...
    return Toolbox.$('[cr-view="' + value + '"]',
      element['cr-id'] ? element : Toolbox.findParent(element));
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
    // TODO: check again,...
    return comp[attr] && comp[attr].length ? data : undefined;
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
      _this.removeRoute(data);
      !routers && uninstall();
    };
  };
  
  prototype.removeRoute = function(data) {
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
    return decodeURI(hash ? location.hash.substring(hash.length) :
      location.pathname + location.search);
  }
  
  function routeToRegExp(route) {
    var names = [];
  
    route = route.replace(/[\-{}\[\]+?.,\\\^$|#\s]/g, '\\$&') // escape
      .replace(/\((.*?)\)/g, '(?:$1)?') // optional
      .replace(/(\(\?)?:\w+/g, function(match, optional) { // named
        names.push(match.substring(1));
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
  
  /* ---------------------------------------------------------- */

  function addVersionToHead(version) {
    var meta = document.createElement('meta');

    meta.setAttribute('mvc-name', 'CircularJS');
    meta.setAttribute('version', version);
    document.head.insertBefore(meta, document.head.children[0]);
  }


  Object.defineProperties(Circular, { // static
    Toolbox: { value: Toolbox },
    CreateInstance: { value: function(name, options, componentName) {
      var hasInstance = !!Circular.circular;
      var instance = Circular.circular || Object.defineProperties(Circular, {
        circular: { value: new Circular(name, options) },
      }).circular;
  
      if (componentName) require([componentName], function() {});
      if (!hasInstance && instance.options.debug) addVersionToHead(instance.version);

      return instance;
    }},
  });
  
  for (var key in prototype) { // methods
    inbound[key] = { value: prototype[key] };
  }
  
  return inbound;
  
}}, 'api');
  