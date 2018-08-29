/**! @license VOM v0.2.0; Copyright (C) 2017-2018 by Peter Dematté */
(function (root, factory) {
  if (typeof exports === 'object') { module.exports = factory(root) }
  else if (typeof define === 'function' && define.amd) {
    define('VOM', [], function () { return factory(root) })
  } else { root.VOM = factory(root) }
}(this, function(window, undefined) { 'use strict';

var VOM = function(model, options) {
    this.options = {
      parentCheck: false,
      idProperty: 'id',
      subscribe: function() {},
      enrichModelCallback: function() {},
      preRecursionCallback: function() {},
      moveCallback: function() {},
      listeners: [],
      forceEnhance: false,
      childNodes: 'childNodes',
      throwErrors: false
    };
    this.model = model || [];

    init(this, options || {});
  },
  init = function(_this, options) {
    var rootItem = {},
      _options = _this.options;

    NODES.push({}); // new access map for current instance
    reinforceProperty(_this, 'id', NODES.length - 1);

    for (var option in options) { // extend options
      _options[option] = options[option];
    }
    _options.listeners = [];
    for (var n = options.listeners.length; n--; ) {
      if (!options.listeners[n]) continue;
      _options.listeners[n] = options.listeners[n].split(pathSplit);
    }
    rootItem[_options.childNodes] = _this.model;
    reinforceProperty(_this.model, 'root', rootItem);
    enrichModel(_this, _this.model);
  },
  pathSplit = /\.|\//,
  NODES = [], // node maps for fast access
  idCounter = 0; // item id counter (if items have no own id)

VOM.prototype = {
  getElementById: function(id) {
    return NODES[this.id][id];
  },
  getElementsByProperty: function(property, value) {
    var result = [],
      hasValue = undefined !== value,
      hasProperty = undefined !== property,
      keys = [],
      propValue = null;

    for (var id in NODES[this.id]) {
      propValue = undefined !== NODES[this.id][id][property] ?
        NODES[this.id][id][property] :
        crawlObject(NODES[this.id][id], (keys[0] ?
          keys : (keys = hasProperty && property.split(pathSplit))));
      if ((hasValue && propValue === value) ||
          (!hasValue && undefined !== propValue) ||
          (!hasValue && !hasProperty)) {
        result.push(NODES[this.id][id]);
      }
    }
    return result;
  },
  appendChild: function(item, parent) {
    parent = parent || this.model.root;
    return moveItem(this, item, parent, getChildNodes(parent,
      this.options.childNodes).length, 'appendChild', parent);
  },
  prependChild: function(item, parent) {
    parent = parent || this.model.root;
    return moveItem(this, item, parent, 0, 'prependChild', parent);
  },
  insertBefore: function(item, sibling) {
    return moveItem(this, item, sibling.parentNode, sibling.index,
      'insertBefore', sibling);
  },
  insertAfter: function(item, sibling) {
    return moveItem(this, item, sibling.parentNode, sibling.index + 1,
      'insertAfter', sibling);
  },
  replaceChild: function(newItem, item) {
    var index = item.index,
      parentNode = item.parentNode;

    newItem !== item && removeChild(this, item);
    moveItem(this, newItem, parentNode, index, 'replaceChild', item);
    return item;
  },
  removeChild: function(item) {
    removeChild(this, item);
    this.options.subscribe.call(this, 'removeChild', item); // order of args
    return item;
  },
  sortChildren: function(callback, model, children) {
    model = (model || this.model).sort(callback);
    for (var n = 0, l = model.length; n < l; n++) {
      this.options.subscribe.call(this, 'sortChildren', model[n]);
      if (children && model[n][this.options.childNodes]) {
        this.sort(callback, model[n][this.options.childNodes], children);
      }
    }
  },
  addProperty: function(property, item, readonly) {
    return addProperty(_this, property.split(pathSplit)[0],
      { current: item, root: item }, property, readonly);
  },
  reinforceProperty: reinforceProperty,
  getProperty: function(property, item) {
    return crawlObject(item, property.split(pathSplit));
  },
  getCleanModel: function(item) { // maybe not...
    return JSON.parse(JSON.stringify(item || this.model));
  },
  destroy: function() {
    return destroy(this, this.model);
  }
};

return VOM;

function crawlObject(data, keys) { // faster than while
  for (var n = 0, m = keys.length; n < m; n++) {
    if (keys[n] === '*') return data;
    data = data && data[keys[n]];
  }
  return data;
}

function destroy(_this, items) { // only cleans up NODES
  for (var n = items.length; n--; ) {
    if (items[n][_this.options.childNodes]) {
      destroy(_this, items[n][_this.options.childNodes]);
    }
    delete NODES[_this.id][items[n][_this.options.idProperty]];
    items.pop();
  }
  return items;
};

function indexOf(_this, item) {
  return (item.parentNode ?
    getChildNodes(item.parentNode, _this.options.childNodes) : _this.model)
  .indexOf(item);
};

function getChildNodes(item, childNodes) { // adds array if necessary
  item[childNodes] = item[childNodes] || [];
  return item[childNodes];
};

function moveItem(_this, item, parent, index, type, sibling) {
  var options = _this.options;

  options.moveCallback.call(_this, item, type, sibling);
  if (!item.parentNode) { // for convenience: append un-enhenced new items
    enrichModel(_this, [item], parent, type, sibling);
  } else if (options.parentCheck) {
    parentCheck(item, parent, options);
  } // TODO: add more checks if allowed...

  _this.type = type;
  _this.sibling = sibling;

  if(item.parentNode === parent && index > item.index && item.index !== -1) {
    index--;
  }
  item = item.index !== -1 && item.parentNode &&
    removeChild(_this, item, true) || item;
  getChildNodes(parent, options.childNodes).splice(index || 0, 0, item);
  item.parentNode = parent;
  return item;
};

function removeChild(_this, item, preserve) {
  !preserve && destroy(_this, [item]);
  return getChildNodes(item.parentNode, _this.options.childNodes)
    .splice(item.index, 1)[0] || item; // if new
}

function parentCheck(item, parent, options) {
  var check = parent;

  if (item === parent) {
    error('ERROR: can\'t move element inside itself', options);
  }
  while (check = check.parentNode) {
    if (check === item) {
      error('ERROR: can\'t move parent inside it\'s own child', options);
    }
  }
};

function enrichModel(_this, model, parent, type, sibling) {
  var options = _this.options,
    isNew = false,
    hasOwnId = true,
    idProperty = options.idProperty,
    item = {};

  for (var n = 0, l = model.length; n < l; n++) {
    item = model[n];

    if (!item[idProperty]) {
      item[idProperty] = 'vom_' + idCounter++;
      hasOwnId = false;
    }

    NODES[_this.id][item[idProperty]] = item; // push to flat index model
    isNew = !item.parentNode;
    item.parentNode = parent || _this.model.root;
    item.index = 0; // will be reset on get()
    if (isNew) {
      reinforceProperty(item, idProperty, item[idProperty], hasOwnId);
      addProperty(_this, 'index', { current: item }, null, true);
      addProperty(_this, 'parentNode', { current: item }, null, true);
      enhanceModel(_this, item, _this.options.listeners);
    }

    options.preRecursionCallback.call(_this, item, type, sibling);
    item[options.childNodes] && // recursion
      enrichModel(_this, item[options.childNodes], item);
    options.enrichModelCallback.call(_this, item, type, sibling);
  }

  return model;
}

function addProperty(_this, property, item, path, readonly) {
  var cache = {};

  if (!_this.options.forceEnhance &&
    !item.current.hasOwnProperty(property)) return;
  cache[property] = item.current[property];
  return defineProperty(_this, property, item, cache, !readonly, path);
}

function enhanceModel(_this, model, listeners, recPath, recModel) {
  var listener = [],
    wildcardPos = 0,
    restPos = 0,
    path = '',
    deepModel = {},
    deepListener = [];

  for (var n = listeners.length; n--; ) {
    listener = listeners[n]; // array of strings
    wildcardPos = listener.indexOf('*');
    path = (recPath || '') + listener.join('.');
    deepModel = recModel || crawlObject(model, listener);

    if (wildcardPos !== -1) {
      restPos = wildcardPos + 1;

      for (var item in deepModel) {
        if (restPos === listener.length) {
          addProperty(_this, item, { current: deepModel, root: model },
            path.replace('*', item));
        } else {
          deepListener = listener.slice(restPos);
          enhanceModel(_this, model, [listener.slice(restPos)],
            path.split('*')[0] + item + '.', crawlObject(deepModel[item],
              deepListener.slice(0, deepListener.length - 1)));
        }
      }
    } else {
      addProperty(_this, listener[listener.length - 1],
        { current: recModel ? deepModel : model, root: model }, path);
    }
  }
  return model;
}

function reinforceProperty(model, item, value, writeable, enumable) {
  delete model[item]; // in case it is set already...
  return Object.defineProperty(model, item, {
    enumerable: !!enumable,
    configurable: false,
    writable: !!writeable,
    value: value
  });
}

function defineProperty(_this, prop, obj, cache, enumable, path) {
  return Object.defineProperty(obj.current, prop, {
    get: function() {
      return prop === 'index' ? indexOf(_this, obj.current) : cache[prop];
    },
    set: function(value) {
      validate((path || prop), obj, cache[prop],
        cache[prop] = value, cache, _this);
    },
    enumerable: enumable
  });
}

function validate(prop, obj, oldValue, value, cache, _this) {
  if (prop === _this.options.idProperty || prop === 'index' ||
    _this.options.subscribe.call(_this, _this.type ||
        prop, obj.root || obj.current, value, oldValue, _this.sibling)) {
      cache[prop] = oldValue; // return value if not allowed
      error('ERROR: Cannot set property "' + prop + '" to "' +
        value + '"', _this.options);
  }
  delete _this.type;
  delete _this.sibling;
}

function error(txt, options) {
  if (!options.throwErrors && window !== undefined && window.console) {
    return console.warn ? console.warn(txt) : console.log(txt);
  }
  throw txt;
}

}));
