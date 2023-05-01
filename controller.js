/**! @license controller v2.0.3; Copyright (C) 2023 by Peter Dematté */
define(['toolbox'], function(Toolbox) { 'use strict';

function Controller(element) {
  this.element = element || document.body;
  this.listeners = {};
  this.store = Object.create(null);
  this.root = Object.create(null);
}

Controller.prototype = {
  installEvent: function(eventName, data, callbackNames, callbackFns) {
    installEvent(this, data, eventName, callbackNames, callbackFns);
  },
  removeEvent: function(eventName) { removeEvent(this, eventName) },
  destroy: function() {
    var _this = this;
    Toolbox.keys(this.listeners).forEach(function(name) { removeEvent(_this, name) });
    return this.element = this.root = this.store = null;
  },
  removeItem: function(id) { delete this.store[id]; },
};

return Controller;

function removeEvent(_this, eventName) {
  var listener = _this.listeners[eventName];
  if (!listener) return;

  _this.listeners[eventName] = listener(); // = null
  delete _this.listeners[eventName];
}

function installEvent(_this, data, eventName, callbackNames, callbackFns) {
  var capture = eventName.length - (eventName = eventName.replace(/\!/g, '')).length;
  var delegate = eventName.length - (eventName = eventName.replace(/\?/g, '')).length;
  var useCapture = !!/(?:focus|blur|mouseenter|mouseleave|scroll)/.test(eventName); // TODO
  var isRoot = data.model === callbackFns; // TODO
  var idTag = (isRoot ? '__' : '') + data.idTag;
  var store = _this.store[data.model[idTag]];

  if (!store) store = _this.store[data.model[idTag]] = Object.create(null);
  if (!store[eventName]) store[eventName] = Object.create(null);
  store = store[eventName];

  data.delegate = delegate;
  if (delegate || isRoot) _this.root[eventName] = callbackFns['__' + idTag] || _this.element[data.idTag];

  for (var n = callbackNames.length, callback = ''; n--; ) {
    callback = callbackNames[n] = callbackNames[n].replace(/[?!]/g, '');
    if (!callback) continue;
    store[callback] ? store[callback].push(data) : store[callback] = [data];
  }
  if (_this.listeners[eventName]) return;

  _this.listeners[eventName] = Toolbox.addEvent(_this.element, eventName, function eventCB(e) {
    eventDelegator(_this, e, callbackFns, data.idTag, _this.element, _this.element.parentNode, _this.store);
  }, useCapture || capture > 1 ? true : capture === 1 ? false : undefined);
}

function findStore(_this, type, target, item, element, parent, idTag, store) {
  var itemElm = item ? null : Toolbox.findParent(target, idTag, element) || target;
  var id = item ? item[idTag] : itemElm[idTag] || element[idTag];
  var elm = !store[id] && target !== element ?
    itemElm && itemElm.parentNode || Toolbox.findParent(parent, idTag) : null;

  return elm ? findStore(_this, type, elm, item, element, parent, idTag, store) : store[id] || {};
}

function eventDelegator(_this, e, cbFns, idTag, element, parent, store, item) {
  var callbacks = findStore(_this, e.type, e.target, item, element, parent, idTag, store)[e.type];
  var path = e.path || (e.composedPath && e.composedPath());
  var items = [];
  var n = 0, m = 0;
  var data = null;
  var cbName = '';
  var cancel = false;

  var retModel = data && data.model;
  var retElement = element;
  var model = retModel;
  var tmp = Object.create(null);

  if (_this.store[_this.root[e.type]] && !item && !callbacks) { // TODO: check...
    callbacks = _this.store[_this.root[e.type]][e.type];
  }

  for (cbName in callbacks) for (m = callbacks[cbName].length; m--; ) {
    data = callbacks[cbName][m];
    data.index = path.indexOf(data.element);
    if (data.index === -1) continue;
    items.push(data);
  }
  if (!items.length) return;
  items.sort(function(a, b) { return b.index - a.index; });


  for (n = items.length; !cancel && n--; ) for (m = items[n].callbacks.length; m--; ) {
    cbName = items[n].callbacks[m];
    if (!cbFns[cbName]) continue;
    data = items[n];

    retElement = data.delegate ? Toolbox.findParent(e.target, idTag, data.element) : data.element;
    retModel = data.delegate ? retElement && data.getElementById(retElement[idTag], true) : data.model;
    model = retModel && retModel[data.children] && retModel[data.children].parent;

    if (retModel) cancel = cbFns[cbName](
      e,
      retElement,
      retModel,
      model,
      model && (data.delegate ? retElement : Toolbox.findParent(e.target, idTag, data.element))
    ) === false || e.cancelBubble || cancel;
  }

  if (!cancel && data && (data.model.parentNode || data.children)) { // down the tree...
    tmp[idTag] = data.model['__' + idTag];
    eventDelegator(_this, e, cbFns, idTag, retElement, parent, store, data.model.parentNode || tmp);
  }
}

}, 'controller');
