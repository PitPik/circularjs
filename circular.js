/**! @license CircularJS v0.1.0; Copyright (C) 2018 by Peter Dematté */
(function (root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory(root, require('toolbox'), require('blick'), require('VOM'));
  } else if (typeof define === 'function' && define.amd) {
    define('circular', ['toolbox', 'blick', 'VOM'],
      function (Toolbox, Blick, VOM) { return factory(root, Toolbox, Blick, VOM) });
  } else root.Circular = factory(root, root.Toolbox, root.Blick, root.VOM);
}(this, function(window, Toolbox, Blick, VOM, undefined) { 'use strict';

var Circular = function(name, options) {
    this.options = {
      componentAttr: 'cr-component',
      containerAttr: 'cr-container',
      templateAttr: 'cr-template-for',
      templatesAttr: 'cr-template',
      eventAttribute: 'cr-event',
      viewAttr: 'cr-view',
      devAttribute: 'cr-dev',
      mountAttribute: 'cr-mount',
      modelAttribute: 'cr-model',

      elements: 'elements',
      events: 'events',
      views: 'views',
      // router
      hash: '#',
      // schnauzer / blick
      partials: {},
      helpers: {},
      decorators: {},
    };

    initCircular(this, name, options);
  },
  initCircular = function(_this, name, options) {
    var hasName = typeof name === 'string';

    if (!hasName) {
      options = name;
    }
    for (var option in options) {
      _this.options[option] = options[option];
    }

    _this.version = '0.1.0';
    _this.components = {};
    _this.data = {};
    _this.id = 'cr_' + id++;
    _this.Toolbox = Toolbox;
    _this.name = hasName ? name : _this.id;
  },
  Controller = function(options) {
    this.options = { appElement: document.body };
    initController(this, options);
  },
  initController = function(_this, options) {
    for (var option in options) { // extend options
      _this.options[option] = options[option];
    }

    _this.events = {}; // listeners
  },
  $ = Toolbox.$,
  $$ = Toolbox.$$,
  id = 0, // circular instance counter
  instanceList = {}, // circular instances holding components
  modulesList = {}, // list of modules for module switching
  templateCache = {}, // general (parsed) template cache (by name)
  DOC = null, // createHTMLDocument for resorce loader
  pubsub = {}; // general data holder

Circular.prototype.component = function(name, parameters) {
  if (typeof name !== 'string') {
    parameters = name;
    name = parameters.name;
  }
  if (this.components[name]) { // TODO: make this possible: name???
    return this.components[name].reset(parameters.model, parameters.extraModel);
  }
  var _this = this,
    _inst = {}, // current instance
    proto = {},
    options = this.options,
    elmsTxt = options.elements,
    componentAttr = options.componentAttr,
    componentSelector = attrSelector(componentAttr, name),
    componentElement = parameters.componentElement || // TODO: ... no wrapper
      $(componentSelector, parameters.componentWrapper || document) ||
      $(name, parameters.componentWrapper || document);

  if (!componentElement) return;

  var nestingData = handleNesting(componentElement, componentAttr),
    altName = componentElement && componentElement.getAttribute('name'),
    data = getDOMData(options, parameters, componentElement, altName || name),
    component = this.components[name] = {
      name: name,
      model: parameters.model || [],
      element: data.element,
      container: data.container,
      templates: data.templates
    },
    mountSelector = parameters.mountSelector || attrSelector(options.mountAttribute),
    template = parameters.template,
    hasStorage = parameters.storage,
    storage = hasStorage || {},
    storageHelper = Toolbox.storageHelper,
    storageData = hasStorage && storageHelper.fetch(storage.name) || {},
    storageCategory = storage.category,
    storageListeners = storage.listeners || parameters.listeners,
    storageAll = storage.storeAll ||
      (storageListeners && storageListeners.indexOf('*') !== -1);

  _this.data[name] = {
    extraModel: parameters.extraModel || options.extraModel,
  };
  pubsub[this.name] = pubsub[this.name] || {}; // prepare
  pubsub[this.name][name] = {}; // prepare
  instanceList[this.id] = instanceList[this.id] || {};
  _inst = instanceList[this.id][name] = {};
  _inst.nestingData = nestingData; //////////////////////

  parameters.onBeforeInit && parameters.onBeforeInit(component);

  _inst.controller = parameters.eventListeners && new Controller({
    appElement: data.element,
    eventAttribute: options.eventAttribute,
    eventListeners: parameters.eventListeners,
    instanceID: _this.id,
  });

  _inst.collector = {};
  _inst.template = template && template.version ?
    template : templateCache[name] ? templateCache[name] :
    data.template ? new Blick(template || data.template, {
      doEscape: false,
      helpers: parameters.helpers || options.helpers, // TODO
      decorators: parameters.decorators || options.decorators, // TODO
      attributes: parameters.attributes || options.attributes || {}, // TODO
      partials: options.partials,

      registerProperty: function(name, fn, data, active, parent) {
        var noGetter = parent && data[parent[0]] &&
          !Object.getOwnPropertyDescriptor(data[parent[0]], '0').get;
        var _parent = parent ? parent.slice(0) : parent;
        parent && noGetter &&  _parent.push(name);

        var blickItem = _inst.collector[data['cr-id']] =
            _inst.collector[data['cr-id']] || {};
        var _name = _parent && _parent.join('.') || name;

        blickItem[_name] = blickItem[_name] || [];
        blickItem[_name].push({
          fn: fn,
          forceUpdate: active === 2,
          parent: parent && (name !== 'this' && name !== '.' ?
            parent.concat(name.split('.')) : parent), // TODO: no concat
        });
      },
    }) : null;
  _inst.template && (templateCache[name] = _inst.template);

  if (hasStorage) {
    var _data = storageData[storageCategory] || storageData;
    for (var key in component.model[0]) {
      if (_data && _data[key] !== undefined) {
        component.model[0][key] = _data[key];
      }
    }
  }

  _inst.vom = new VOM(component.model, {
    idProperty: _this.options.idProperty || 'cr-id',
    preRecursionCallback: function(item, type, siblingOrParent) {
      var idProperty = this.options.idProperty,
        id = item[idProperty], // container, data, extra
        fragment = _inst.template && _inst.template.schnauzer.partials.self &&
          _inst.template.renderHTML(item, _this.data[name].extraModel),
        replaceElement = type === 'replaceChild' &&
          siblingOrParent[elmsTxt].element,
        container = item.parentNode[elmsTxt] &&
          item.parentNode[elmsTxt].container,
        parentNode = fragment && siblingElement ||
          container || component.container,
        siblingElement = parentNode ? replaceElement || undefined :
          siblingOrParent && siblingOrParent[elmsTxt] && siblingOrParent[elmsTxt].element,
        element = fragment && render(fragment, type || data.type || 'appendChild',
          parentNode, siblingElement, idProperty, id) || component.element;
      // collect elements
      this.reinforceProperty(item, elmsTxt, {
        element: element,
        container: $(mountSelector, element),
      }, true);
      // collect events
      this.reinforceProperty(item, options.events, {}, true);
      _inst.controller && _inst.controller.getEventListeners(
        item[elmsTxt].element || component.element,
        item[options.events], component, idProperty);
      // collect view elements
      this.reinforceProperty(item, options.views, {}, true);
      getViews(options, item[options.views],
        item[elmsTxt].element || component.element);

      parameters.preRecursionCallback &&
        parameters.preRecursionCallback.call(this, item);
    },
    enrichModelCallback: this.options.enrichModelCallback ||
      parameters.enrichModelCallback || function() {},
     // TODO: get options via...
    listeners: this.options.listeners || parameters.listeners || [],
    subscribe: function(property, item, value, oldValue, sibling) {
      var idProperty = this.options.idProperty,
        id = item[idProperty],
        element = item[elmsTxt] && item[elmsTxt].element,
        parentElement = (item.parentNode && item.parentNode[elmsTxt] ?
          item.parentNode[elmsTxt].container ||
            item.parentNode[elmsTxt].element : component.container),
        blickItem = [];

      if (property === 'removeChild') {
        render(element, property, element.parentElement);
        delete _inst.collector[id];
      } else if (property === 'sortChildren') {
        // speed up sorting... TODO: check
        render(element, 'appendChild', parentElement);
      } else if (this[property]) { // has method
        if (item === sibling) { // replaceChild by itself
          element = render(_inst.template.renderHTML(item, _this.data[name].extraModel),
            property, parentElement, sibling[elmsTxt].element,
            idProperty, item[idProperty]);
          item[elmsTxt].element = element;
          item[elmsTxt].container = $(mountSelector, element);

          item[options.events] = {};
          _inst.controller && _inst.controller.getEventListeners(
            item[elmsTxt].element || component.element,
            item[options.events], component, this.options.idProperty);
          item[options.views] = {};
          getViews(options, item[options.views],
            item[elmsTxt].element || component.element);
        } else if (property !== 'replaceChild' && !this.__isNew) {
          render(element, property, parentElement,
              sibling[elmsTxt] && sibling[elmsTxt].element);
        }
      } else if (hasStorage && (storageAll || storageListeners.indexOf(property) !== -1)) {
        storageData = storageHelper.fetch(storage.name) || {};
        if (!storageAll) {
          storageData[storageCategory] = storageData[storageCategory] || {};
          storageData[storageCategory][property] = value;
        } else {
          storageData[storageCategory] = component.model[0];
        }
        storageHelper[storage.saveLazy === false ?
          'save' : 'saveLazy'](storageCategory ?
            storageData : storageData[storageCategory], storage.name, this);
      }
      // blick support
      if (blickItem = _inst.collector[id] && _inst.collector[id][property]) {
        for (var n = blickItem.length, elm; n--; ) {
          if (blickItem[n].forceUpdate || value !== oldValue) {
            elm = blickItem[n].fn(blickItem[n].parent); // TODO: pass to fn()?
            if (_inst.controller && elm) for (var m = elm.length; m--; ) {
              _inst.controller.getEventListeners(elm[m], item[options.events],
              component, idProperty, true);
            }
          }
        }
      }

      parameters.subscribe && parameters.subscribe
        .call(this, property, item, value, oldValue);

      _this.publish(component, name, property, {
        property: property,
        item: item,
        value: value,
        oldValue: oldValue
      });
    }
  });
  handleNesting(componentElement, null, nestingData);

  proto = transferMethods(VOM, _inst.vom, component, this, proto);
  proto.uncloak = function(item) {
    var item = item && item.element || component.element;

    Toolbox.removeClass(item, 'cr-cloak');
    item.removeAttribute('cr-cloak');
  };
  proto.reset = function(data, extraModel) {
    if (extraModel) {
      _this.data[component.name].extraModel = extraModel;
    }
    _inst.vom.destroy();
    this.container && (this.container.innerHTML = '');
    _inst.vom.__isNew = true; // TODO
    for (var n = 0, m = data.length; n < m; n++) {
      this.appendChild(data[n]);
    }
    _inst.nestingData.length &&
      handleNesting(componentElement, null, _inst.nestingData);
    delete _inst.vom.__isNew; // TODO
    return component;
  };

  component.__proto__ = proto;

  parameters.onInit && parameters.onInit(component);

  return component;
};

Circular.prototype.getBaseModel = function(name) {
  var component = this.components[name];

  return component ? component.model[0] : null;
};

Circular.prototype.destroy = function(name) { // TODO: review -> use reset
  var _instList = instanceList[this.id];
  var _instance = {};

  for (var component in _instList) {
    if (name && name !== component) continue;
    for (var instance in _instList[component]) {
      _instance = _instList[component][instance];
      _instance && _instance.destroy && _instance.destroy(component);
    }
  }
};

Circular.prototype.model = function(model, options) {
  return new VOM(model, options);
};

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

Circular.Toolbox = Toolbox;

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

  inst = inst || this.name;
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
    pubsubs[n].call(_this, data);
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

  Toolbox.addEvent(window, event, function(e) {
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

/* ----------------- resource loader ------------------ */

Circular.prototype.loadResource = function(fileName, cache) {
  var _this = this,
    devFilter = function(elm) {
      return !elm.hasAttribute(_this.options.devAttribute);
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
    modulesList[data.previousName].cache.appendChild(childNodes[0]);
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
    modules = modulesList, // speeds up var search
    name = data.name,
    module = name && modules[name],
    init = module && module.init,
    hasTransition = data.transition,
    Promise = Toolbox.Promise;

  if (modules[data.previousName] && (!hasTransition || !name)) { // remove old app
    moveChildrenToCache(data);
  }
  if (name && module) { // append current app and initialize
    init = init && init(data.data, module.path);
    hasTransition ? transition(init, data, modules) :
      data.container.appendChild(module.cache);

    return new Promise(function(resolve) { resolve(init) });
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
            resolve(init);
          });
        } else if (temp) {
          moveChildrenToCache(data);
          temp.parentElement.removeChild(temp);
          resolve();
        }
      })
    }).catch() : new Promise(function(a){a()});
};

/* --------------------  UI controller ------------------- */

Controller.prototype = {
  getEventListeners: function(element, events, component, idProperty, extra) {
    var eventAttribute = this.options.eventAttribute,
      elements = element.querySelectorAll(attrSelector(eventAttribute)),
      attribute = '',
      eventItem = '',
      eventType = '',
      eventFunc = '',
      eventParts = [],
      eventFuncs = {},
      extraElement = element !== component.element ? component.element : [];

    elements = [element].concat([].slice.call(elements), extraElement);

    for (var n = elements.length; n--; ) { // reverse: stopPropagation
      attribute = elements[n].getAttribute(eventAttribute);
      if (!attribute) {
        continue;
      }
      eventParts = attribute.split(/\s*;+\s*/);
      for (var m = eventParts.length; m--; ) {
        eventItem = eventParts[m].split(/\s*:+\s*/);
        eventType = eventItem[0];
        eventFunc = eventItem[1];

        eventFuncs = events[eventType] = events[eventType] || {};
        if (eventFuncs[eventFunc] === undefined) {
          eventFuncs[eventFunc] = [];
        }
        eventFuncs[eventFunc].push(elements[n]);

        if (!this.events[eventType]) { // register inside itself
          this.events[eventType] = true;
        }
      }
    }
    if (!this.installed || extra) { // && this.events !== {}
      this.installEventListeners(component, idProperty);
    }
  },
  installEventListeners: function(component, idProperty) { // $$vom !!!!!
    var that = this;

    this.installed = this.installed || {};
    for (var key in this.events) {
      if (this.installed[key]) continue;
      Toolbox.addEvent(this.options.appElement, key, function(e) {
        eventDistributor(e, idProperty, component, that);
      }, /(?:focus|blur|mouseenter|mouseleave)/.test(key) ? true : false,
        this.options.instanceID + '_' + component.name);
      this.installed[key] = true;
    }
  },
  destroy: function(component) {
    Toolbox.removeEvent(this.options.instanceID + '_' + component.name);
  }
};

return Circular;

function render(html, operator, parentNode, sibling, idProperty, id) {
  var isPrepend = operator === 'prependChild',
    element = {};

  if (html.nodeType === 11) {
    element = html.children[0];
    element.setAttribute(idProperty, id);
  } else {
    element = html;
  }

  var renderingFunc = function() {
    if (isPrepend || operator === 'insertAfter') {
      sibling = sibling && sibling.nextSibling ||
        isPrepend && parentNode.children[0];
      operator = sibling ? 'insertBefore' : 'appendChild';
    }

    (parentNode || element.parentElement)[operator](element, sibling);
  };

  element && renderingFunc();

  return element;
}

function getViews(options, views, element) {
  var elements = $$(attrSelector(options.viewAttr), element),
    attribute = '';

  elements = [element].concat([].slice.call(elements));
  for (var n = elements.length; n--; ) { // reverse: stopPropagation
    attribute = elements[n].getAttribute(options.viewAttr);
    if (!attribute) {
      continue;
    }
    views[attribute] = elements[n];
  }
}

function transferMethods(fromClass, fromInstance, toInstance, _this, proto) {
  for (var method in fromClass.prototype) {
    if (!_this[method]) {
      proto[method] = (function(method) {
        return function() {
          return fromInstance[method]
            .apply(fromInstance, arguments);
        }
      })(method);
    }
  }
  return proto;
}

function handleNesting(comp, attr, restore, nodeList) {
  var temp = [],
    restores = [],
    cache = {};

  if (restore) {
    temp = nodeList || $$('[cr-replace]', comp); // slower approach but save
    cache = {};
    for (var idx = 0, n = 0, l = temp.length; n < l; n++) {
      idx = temp[n].getAttribute('cr-replace'); // re-rendered from template
      if (cache[idx]) continue; // only on first item
      temp[n].parentNode.replaceChild(restore[idx], temp[n]);
      cache[idx] = true;
    }
    temp = temp.length !== restore.length && $$('[cr-replace]', comp);
    if (temp.length) handleNesting(comp, attr, restore, temp);
  } else if (comp && attr) {
    temp = $$(attrSelector(attr), comp);
    for (var replacement = {}, n = 0, m = temp.length; n < m; n++) {
      replacement = document.createElement(temp[n].tagName);
      replacement.setAttribute('cr-replace', n); // TODO: check if n is good
      temp[n].parentNode.replaceChild(replacement, temp[n]);
      restores.push(temp[n]);
    }
    return restores;
  }
}

function processTemplate(template, options) {
  var isScript = template.tagName.toLowerCase() === 'script';
  var html = '';

  if (!isScript) {
    template.removeAttribute(options.templateAttr);
    html = template.outerHTML.replace(/(?:{{&gt;|cr-src=)/g, function($1) {
      return $1.charAt(0) === '{' ? '{{>' : 'src=';
    });
    template.parentNode.removeChild(template);
    return html;
  }

  return template.innerHTML;
}

// ----- get component data
function getDOMData(options, parameters, component, name) {
  var searchContainer = component || document.body,
    containerAttr = options.containerAttr,
    namedTplSelector = attrSelector(options.templateAttr, name),
    container = component.hasAttribute(containerAttr) ? component :
      // $(attrSelector(containerAttr, name), component) ||
      $(attrSelector(containerAttr), component),
    _template,
    type = container && container.getAttribute(options.containerAttr),
    template = container && ($(namedTplSelector, searchContainer) ||
      $(namedTplSelector, document.body)), // also outside component
    _templates = ($$(attrSelector(options.templatesAttr, name),
      searchContainer) || []),
    templates = {};

  for (var n = _templates.length; n--; ) { // TODO
    _template = processTemplate(_templates[n], options);
    templates[_templates[n].id || _templates[n].getAttribute('name')] =
      new Blick(_template, {
          doEscape: false,
          helpers: parameters.helpers || options.helpers
        });
  }
  return {
    element: component,
    template: template ? processTemplate(template, options) : template, // TODO && container??
    templates: templates, // TODO && container??
    container: container,
    type: type ? type + 'Child' : '',
  }
}

function attrSelector(attr, value) {
  return '[' + attr + (value ? '="' + value + '"]' : ']');
}

function isConnected(elm, contect) {
  return elm.isConnected !== undefined ?
    elm.isConnected : _this.options.appElement.contains(eventElement);
}
// -------- for Controller --------- //
// --------------------------------- //
function eventDistributor(e, idProperty, component, _this) {
  // TODO: cache by e.target for next vars??
  var element = Toolbox.closest(e.target, attrSelector(idProperty)) || component.element,
    id = element.getAttribute(idProperty),
    elms = 'elements.element',
    item = component.getElementById(id) ||
      component.getElementsByProperty(elms, component.element)[0] || // TODO
      component.getElementsByProperty(elms, e.target)[0] || component.model[0],
    eventElements = item && item.events[e.type],
    eventElement = {},
    stopPropagation = false,
    eventListener;

  for (var key in eventElements) { // TODO: check for optimisation
    eventListener = _this.options.eventListeners[key];
    if (!eventListener) continue;
    for (var n = eventElements[key].length; n--; ) {
      eventElement = eventElements[key][n];
      if (!isConnected(eventElement, _this.options.appElement)) {
        eventElements[key].splice(n, 1); // cleanup
        continue;
      }
      if (!stopPropagation && (eventElement === e.target || eventElement.contains(e.target))) {
        stopPropagation = eventListener.call(component, e, eventElement, item) === false;
        if (stopPropagation) e.stopPropagation();
      }
    }
  }
}
}));